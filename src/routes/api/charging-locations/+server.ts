import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Locations of all public charging stations (Ladesäulenregister der Bundesnetzagentur).
// The register is uploaded to Directus as `Ladesaeulenregister_BNetzA_<Stand>.csv` (~58 MB,
// Latin-1, semicolon-separated, ~10 lines of notes above the header). Far too large for the
// browser, so it is loaded once here, reduced to what the map needs and kept in memory.
//
//   GET /api/charging-locations        → { updateDate, source, count, points: number[] }
//       points is flat: [id, lon, lat, chargingPoints, kw, fast(0|1), ...] (STRIDE values per station)
//   GET /api/charging-locations?id=123 → details of one station for the map tooltip
//
// A newer upload is picked up automatically (newest file whose name starts with FILE_PREFIX).

const BASE = 'https://base.klimadashboard.org';
const FILE_PREFIX = 'Ladesaeulenregister_BNetzA';
/** Used when the file lookup fails (Stand 12.11.2026) */
const FALLBACK_ASSET = 'ee65b3d2-0aca-4855-8536-cfb7f440cd27';
const SOURCE = 'Bundesnetzagentur, Ladesäulenregister (CC BY 4.0)';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const STRIDE = 6;

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
}

interface Index {
	updateDate: string | null;
	points: number[];
	byId: Map<number, Station>;
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

function parse(text: string): Omit<Index, 'expires'> {
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
		lon: col('Längengrad')
	};

	const points: number[] = [];
	const byId = new Map<number, Station>();
	for (const r of it) {
		if (r.length <= c.lon || r[c.status] !== 'In Betrieb') continue;
		const id = parseInt(r[c.id], 10);
		const lat = coord(r[c.lat]);
		const lon = coord(r[c.lon]);
		// Germany's bounding box: skips missing or swapped coordinates
		if (!id || !(lat > 47 && lat < 55.2 && lon > 5.5 && lon < 15.5)) continue;
		const station: Station = {
			id,
			operator: r[c.operator],
			type: r[c.type],
			points: Math.max(1, Math.round(num(r[c.points]))),
			kw: num(r[c.kw]),
			since: r[c.since],
			street: [r[c.street], r[c.number]].filter(Boolean).join(' '),
			zip: r[c.zip],
			city: r[c.city],
			lon,
			lat
		};
		byId.set(id, station);
		points.push(
			id,
			Math.round(lon * 1e5) / 1e5,
			Math.round(lat * 1e5) / 1e5,
			station.points,
			Math.round(station.kw),
			/schnell/i.test(station.type) ? 1 : 0
		);
	}
	return {
		updateDate: updateDate ? `${updateDate[3]}-${updateDate[2]}-${updateDate[1]}` : null,
		points,
		byId
	};
}

async function load(): Promise<Index> {
	if (index && Date.now() < index.expires) return index;
	if (!loading) {
		loading = (async () => {
			const res = await fetch(`${BASE}/assets/${await latestAssetId()}`);
			if (!res.ok) throw new Error(`Ladesäulenregister: ${res.status}`);
			const text = new TextDecoder('latin1').decode(await res.arrayBuffer());
			index = { ...parse(text), expires: Date.now() + CACHE_TTL };
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

	const id = url.searchParams.get('id');
	if (id !== null) {
		const station = data.byId.get(parseInt(id, 10));
		if (!station) throw error(404, 'Ladeeinrichtung nicht gefunden');
		return json(station);
	}
	return json({
		updateDate: data.updateDate,
		source: SOURCE,
		count: data.byId.size,
		stride: STRIDE,
		points: data.points
	});
};
