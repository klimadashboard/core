import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Locations of all public charging stations (Ladesäulenregister der Bundesnetzagentur).
// The register is uploaded to Directus as `Ladesaeulenregister_BNetzA_<Stand>.csv` (~58 MB,
// Latin-1, semicolon-separated, ~10 lines of notes above the header). Far too large for the
// browser, so it is loaded once here, reduced to what the map needs and kept in memory.
//
//   GET /api/charging-locations        → { updateDate, source, count, locations, points: number[] }
//       one entry per location (stations with the same coordinate combined), flat:
//       [id, lon, lat, chargingPoints, stations, topClass, district, ...] (STRIDE values each)
//       topClass: highest class of charging point there (0 NLP ≤ 22 kW, 1 SLP, 2 HPC ≥ 150 kW)
//       district: AGS of the Kreis the location lies in, as a number (09564 → 9564; 0 = none found),
//       from point-in-polygon against the district outlines in Directus, so maps can show one region
//   GET /api/charging-locations?id=123 → details of one location for the map tooltip
//   GET /api/charging-locations?zubau=1[&districts=09564,09562 | &state=09]
//       → { updateDate, source, years: [{ year, nlp, slp, hpc }] }: charging points by year of
//       commissioning and class (NLP ≤ 22 kW, SLP > 22 to < 150 kW, HPC ≥ 150 kW, per charging point)
//
// A newer upload is picked up automatically (newest file whose name starts with FILE_PREFIX).

const BASE = 'https://base.klimadashboard.org';
const FILE_PREFIX = 'Ladesaeulenregister_BNetzA';
/** Used when the file lookup fails (Stand 12.11.2026) */
const FALLBACK_ASSET = 'ee65b3d2-0aca-4855-8536-cfb7f440cd27';
const SOURCE = 'Bundesnetzagentur, Ladesäulenregister (CC BY 4.0)';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const STRIDE = 7;

// ------------------------------------------------------------------ districts (point-in-polygon)

type Ring = number[][];
interface District {
	ags: number;
	bbox: [number, number, number, number];
	polygons: Ring[][];
}

async function loadDistricts(): Promise<District[]> {
	const params = new URLSearchParams({
		limit: '-1',
		fields: 'code,outline',
		'filter[layer][_eq]': 'district',
		'filter[country][_eq]': 'DE'
	});
	const res = await fetch(`${BASE}/items/regions?${params}`);
	if (!res.ok) throw new Error(`District outlines: ${res.status}`);
	const rows: Array<{ code: string; outline: any }> = (await res.json()).data ?? [];
	return rows
		.filter((r) => r.outline?.coordinates && /^\d{5}$/.test(r.code))
		.map((r) => {
			const polygons: Ring[][] =
				r.outline.type === 'Polygon' ? [r.outline.coordinates] : r.outline.coordinates;
			const bbox: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
			for (const poly of polygons)
				for (const [x, y] of poly[0]) {
					bbox[0] = Math.min(bbox[0], x);
					bbox[1] = Math.min(bbox[1], y);
					bbox[2] = Math.max(bbox[2], x);
					bbox[3] = Math.max(bbox[3], y);
				}
			return { ags: parseInt(r.code, 10), bbox, polygons };
		});
}

function inRing(x: number, y: number, ring: Ring): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

/** AGS of the district containing the point (outer ring in, no hole), 0 if none */
function districtOf(x: number, y: number, districts: District[]): number {
	for (const d of districts) {
		const [x0, y0, x1, y1] = d.bbox;
		if (x < x0 || x > x1 || y < y0 || y > y1) continue;
		for (const [outer, ...holes] of d.polygons)
			if (inRing(x, y, outer) && !holes.some((h) => inRing(x, y, h))) return d.ags;
	}
	return 0;
}

interface Station {
	id: number;
	operator: string;
	type: string;
	points: number;
	kw: number;
	since: string;
	street: string;
	zip: string;
	city: string;
	lon: number;
	lat: number;
	/** Year of commissioning (0 if unknown) */
	year: number;
	/** Charging points by class: [NLP ≤ 22 kW, SLP > 22 to < 150 kW, HPC ≥ 150 kW] */
	classes: Classes;
}

/** Charging points by class: NLP ≤ 22 kW, SLP > 22 to < 150 kW, HPC ≥ 150 kW */
type Classes = [number, number, number];

/** Class of a charging point by its rated power: 0 NLP, 1 SLP, 2 HPC */
const classOf = (kw: number) => (kw >= 150 ? 2 : kw > 22 ? 1 : 0);

/** All stations at one coordinate */
interface Location {
	/** id of its first station */
	id: number;
	stations: number;
	points: number;
	/** Charging points by class: [NLP ≤ 22 kW, SLP > 22 to < 150 kW, HPC ≥ 150 kW] */
	classes: Classes;
	/** Sum of the stations' rated power */
	kw: number;
	maxKw: number;
	operators: string[];
	street: string;
	zip: string;
	city: string;
	/** Commissioning date of a single station (only shown when there is one) */
	since: string;
	lon: number;
	lat: number;
	/** AGS of its Kreis as a number, 0 if outside all district outlines */
	district: number;
}

interface Index {
	updateDate: string | null;
	points: number[];
	locations: Map<number, Location>;
	/** Number of stations (Ladeeinrichtungen) in operation */
	stations: number;
	/** Charging points commissioned per district (AGS number) and year, by class */
	zubau: Map<number, Map<number, Classes>>;
	expires: number;
}

let index: Index | null = null;
let loading: Promise<Index> | null = null;

async function latestAssetId(): Promise<string> {
	try {
		const params = new URLSearchParams({
			'filter[filename_download][_starts_with]': FILE_PREFIX,
			sort: '-uploaded_on',
			limit: '1',
			fields: 'id'
		});
		const res = await fetch(`${BASE}/files?${params}`);
		const id = res.ok ? (await res.json()).data?.[0]?.id : null;
		return id || FALLBACK_ASSET;
	} catch {
		return FALLBACK_ASSET;
	}
}

/** Quote-aware CSV rows (fields may contain `;` and line breaks inside quotes). */
function* rows(text: string, sep = ';'): Generator<string[]> {
	let row: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (quoted) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else quoted = false;
			} else field += ch;
		} else if (ch === '"') quoted = true;
		else if (ch === sep) {
			row.push(field);
			field = '';
		} else if (ch === '\n') {
			row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
			yield row;
			row = [];
			field = '';
		} else field += ch;
	}
	if (field || row.length) yield [...row, field];
}

const num = (s: string | undefined) => {
	const n = parseFloat(String(s ?? '').replace(/\./g, '').replace(',', '.'));
	return Number.isFinite(n) ? n : 0;
};
/** Coordinates use a decimal comma but no thousands separator */
const coord = (s: string | undefined) => {
	const n = parseFloat(String(s ?? '').replace(',', '.'));
	return Number.isFinite(n) ? n : NaN;
};

function parse(text: string, districts: District[]): Omit<Index, 'expires'> {
	const updateDate = text.match(/Letzte Aktualisierung vom:\s*(\d{2})\.(\d{2})\.(\d{4})/);
	const it = rows(text);
	// Skip the notes above the header. Not with for…of + break: that would close the generator.
	let header: string[] | null = null;
	for (let next = it.next(); !next.done; next = it.next()) {
		if (next.value[0] === 'Ladeeinrichtungs-ID') {
			header = next.value;
			break;
		}
	}
	if (!header) throw new Error('Ladesäulenregister: header row not found');
	const col = (name: string) => {
		const i = header!.indexOf(name);
		if (i === -1) throw new Error(`Ladesäulenregister: column "${name}" not found`);
		return i;
	};
	const c = {
		id: col('Ladeeinrichtungs-ID'),
		operator: col('Betreiber'),
		status: col('Status'),
		type: col('Art der Ladeeinrichtung'),
		points: col('Anzahl Ladepunkte'),
		kw: col('Nennleistung Ladeeinrichtung [kW]'),
		since: col('Inbetriebnahmedatum'),
		street: col('Straße'),
		number: col('Hausnummer'),
		zip: col('Postleitzahl'),
		city: col('Ort'),
		lat: col('Breitengrad'),
		lon: col('Längengrad'),
		// Rated power of each charging point (the register lists up to six per station)
		plugKw: [1, 2, 3, 4, 5, 6].map((i) => header!.indexOf(`Nennleistung Stecker${i}`))
	};

	// Stations sharing a coordinate (e.g. 37 units in one car park) become one location: drawn
	// separately they would stack into a single dot showing only one unit's charging points.
	const byCoord = new Map<string, Station[]>();
	for (const r of it) {
		if (r.length <= c.lon || r[c.status] !== 'In Betrieb') continue;
		const id = parseInt(r[c.id], 10);
		const lat = coord(r[c.lat]);
		const lon = coord(r[c.lon]);
		// Germany's bounding box: skips missing or swapped coordinates
		if (!id || !(lat > 47 && lat < 55.2 && lon > 5.5 && lon < 15.5)) continue;
		const pointCount = Math.max(1, Math.round(num(r[c.points])));
		const kw = num(r[c.kw]);
		// Class per charging point from its own rated power; without it, the station's average
		const classes: Classes = [0, 0, 0];
		for (let p = 0; p < pointCount; p++) {
			const plugCol = c.plugKw[p];
			const pointKw = plugCol !== undefined && plugCol >= 0 ? num(r[plugCol]) : 0;
			classes[classOf(pointKw || kw / pointCount)]++;
		}
		const since = /(\d{4})\s*$/.exec(r[c.since] ?? '');
		const station: Station = {
			id,
			operator: r[c.operator],
			type: r[c.type],
			points: pointCount,
			kw,
			year: since ? parseInt(since[1], 10) : 0,
			classes,
			since: r[c.since],
			street: [r[c.street], r[c.number]].filter(Boolean).join(' '),
			zip: r[c.zip],
			city: r[c.city],
			lon,
			lat
		};
		const key = `${lon.toFixed(5)},${lat.toFixed(5)}`;
		const group = byCoord.get(key);
		if (group) group.push(station);
		else byCoord.set(key, [station]);
	}

	const points: number[] = [];
	const locations = new Map<number, Location>();
	const zubau = new Map<number, Map<number, Classes>>();
	let stations = 0;
	for (const group of byCoord.values()) {
		const first = group[0];
		const classes: Classes = [0, 0, 0];
		for (const s of group) for (let k = 0; k < 3; k++) classes[k] += s.classes[k];
		const topClass = classes[2] ? 2 : classes[1] ? 1 : 0;
		const loc: Location = {
			id: first.id,
			stations: group.length,
			points: group.reduce((sum, s) => sum + s.points, 0),
			classes,
			kw: Math.round(group.reduce((sum, s) => sum + s.kw, 0)),
			maxKw: Math.max(...group.map((s) => s.kw)),
			operators: [...new Set(group.map((s) => s.operator))],
			street: first.street,
			zip: first.zip,
			city: first.city,
			since: first.since,
			lon: first.lon,
			lat: first.lat,
			district: districtOf(first.lon, first.lat, districts)
		};
		stations += group.length;
		locations.set(loc.id, loc);
		let byYear = zubau.get(loc.district);
		if (!byYear) zubau.set(loc.district, (byYear = new Map()));
		for (const s of group) {
			if (!s.year) continue;
			const sum = byYear.get(s.year) ?? [0, 0, 0];
			for (let k = 0; k < 3; k++) sum[k] += s.classes[k];
			byYear.set(s.year, sum);
		}
		points.push(
			loc.id,
			Math.round(loc.lon * 1e5) / 1e5,
			Math.round(loc.lat * 1e5) / 1e5,
			loc.points,
			loc.stations,
			topClass,
			loc.district
		);
	}
	return {
		updateDate: updateDate ? `${updateDate[3]}-${updateDate[2]}-${updateDate[1]}` : null,
		points,
		locations,
		stations,
		zubau
	};
}

/**
 * Charging points commissioned per year by class, summed over the selected districts:
 * `districts` (AGS list), else `state` (AGS prefix), else all of Germany.
 */
function zubauFor(data: Index, districts: number[] | null, state: number | null) {
	const keep = (d: number) =>
		districts ? districts.includes(d) : state !== null ? Math.floor(d / 1000) === state : true;
	const years = new Map<number, Classes>();
	for (const [district, byYear] of data.zubau) {
		if (!keep(district)) continue;
		for (const [year, c] of byYear) {
			const sum = years.get(year) ?? [0, 0, 0];
			for (let k = 0; k < 3; k++) sum[k] += c[k];
			years.set(year, sum);
		}
	}
	return [...years.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([year, [nlp, slp, hpc]]) => ({ year, nlp, slp, hpc }));
}

async function load(): Promise<Index> {
	if (index && Date.now() < index.expires) return index;
	if (!loading) {
		loading = (async () => {
			const [res, districts] = await Promise.all([
				latestAssetId().then((id) => fetch(`${BASE}/assets/${id}`)),
				loadDistricts()
			]);
			if (!res.ok) throw new Error(`Ladesäulenregister: ${res.status}`);
			const text = new TextDecoder('latin1').decode(await res.arrayBuffer());
			index = { ...parse(text, districts), expires: Date.now() + CACHE_TTL };
			return index;
		})().finally(() => (loading = null));
	}
	return loading;
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	let data: Index;
	try {
		data = await load();
	} catch (e) {
		console.error('[charging-locations]', e);
		throw error(502, 'Ladesäulenregister konnte nicht geladen werden');
	}
	setHeaders({ 'cache-control': 'public, max-age=3600' });

	if (url.searchParams.has('zubau')) {
		const districts = url.searchParams.get('districts');
		const state = url.searchParams.get('state');
		return json({
			updateDate: data.updateDate,
			source: SOURCE,
			years: zubauFor(
				data,
				districts ? districts.split(',').map((d) => parseInt(d.slice(0, 5), 10)) : null,
				state ? parseInt(state.slice(0, 2), 10) : null
			)
		});
	}

	const id = url.searchParams.get('id');
	if (id !== null) {
		const location = data.locations.get(parseInt(id, 10));
		if (!location) throw error(404, 'Standort nicht gefunden');
		return json(location);
	}
	return json({
		updateDate: data.updateDate,
		source: SOURCE,
		count: data.stations,
		locations: data.locations.size,
		stride: STRIDE,
		points: data.points
	});
};
