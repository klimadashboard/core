// Placeholders for the CMS text of the "Neuzulassungen" block (Pkw, Lkw, Busse), loaded once when the block mounts,
// so every paragraph of the text is filled regardless of the selected view. They update with new monthly data.
// Data: Directus collection `vehicle_registrations`, Austria (see docs/data-sources-mobility.md).
//
// Pkw
//   {{carLatestMonth}}       "Oktober 2026"           latest month
//   {{carLatestShare}}       "34,9"                   electric share in that month (%)
//   {{carLatestShareText}}   "gut jedes dritte"       the same in words
//   {{carPrevYear}}          "2025"                   previous complete year
//   {{carPrevYearShare}}     "21,3"
//   {{carYtdPeriod}}         "Jänner bis Oktober 2026" (or "2026" when the year is complete)
//   {{carYtdShare}}          "27,0"
// Lkw (current year so far)
//   {{truckYear}}            "2026"
//   {{truckPeriod}}          "Jänner bis Oktober 2026"
//   {{truckN2Share}} "26,5" · {{truckN2ShareText}} "gut jeder vierte"     leichte Lkw (N2, 3,5–12 t)
//   {{truckN1Share}} "14,0" · {{truckN1ShareText}} "rund jeder siebte"    Lieferwagen (N1)
//   {{truckN3Share}} "6,0" · {{truckSemiShare}} "5,3"                    schwere Lkw (N3) / Sattelzugmaschinen
//   {{truckHeavyShare}}      "6"                      N3 + Sattelzugmaschinen together, rounded (%)
// Busse
//   {{busPrevYear}} "2025" · {{busPrevYearShare}} "21,6" · {{busPrevYearShareText}} "gut jeder fünfte"
//   {{busYtdPeriod}} "Jänner bis Oktober 2026" · {{busYtdShare}} "13,0" · {{busYtdShareText}} "gut jeder achte"
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { formatNumber } from '$lib/utils/formatters';

const AUSTRIA = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81';
const CLASSES = ['passenger_car_m1', 'truck_n1', 'truck_n2', 'truck_n3', 'semi_trailer_tractor', 'bus_m2_m3'];
const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const ORDINALS = ['', '', 'zweite', 'dritte', 'vierte', 'fünfte', 'sechste', 'siebte', 'achte', 'neunte', 'zehnte'];

type Row = { vehicle_class: string; year: number; month: number; period: string; fuel_type: string; parent_fuel_type: string | null; value: number | null };
type Values = { electric: number; total: number };

/** share in words: "gut jedes dritte", "rund jeder siebte", "fast jeder vierte" (article "jedes" for cars, "jeder" for trucks/buses) */
export function shareInWords(share: number | null, article: 'jedes' | 'jeder'): string {
	if (share == null || !isFinite(share)) return '';
	if (share >= 100) return article;
	let best = 2;
	for (let n = 2; n <= 10; n++) if (Math.abs(share - 100 / n) < Math.abs(share - 100 / best)) best = n;
	const target = 100 / best;
	if (share < 100 / 10.5) return `weniger als ${article} zehnte`;
	const diff = (share - target) / target;
	const prefix = Math.abs(diff) <= 0.03 ? 'rund' : diff > 0 ? 'gut' : 'fast';
	return `${prefix} ${article} ${ORDINALS[best]}`;
}

const periodText = (year: number, month: number) =>
	month === 12 ? String(year) : month === 1 ? `Jänner ${year}` : `Jänner bis ${MONTHS[month - 1]} ${year}`;
const pct = (v: number | null, digits = 1) => (v == null || !isFinite(v) ? '' : formatNumber(v, digits));

export async function loadTextPlaceholders(fetchFn?: typeof fetch): Promise<Record<string, string>> {
	const directus = getDirectusInstance(fetchFn);
	const rows = (await directus.request(
		readItems('vehicle_registrations', {
			filter: { region: { _eq: AUSTRIA }, vehicle_class: { _in: CLASSES }, date: { _gte: '$NOW(-3 years)' } },
			fields: ['vehicle_class', 'year', 'month', 'period', 'fuel_type', 'parent_fuel_type', 'value'],
			limit: -1
		})
	)) as Row[];

	// class|year|month|period → electric / total (total row for cars; otherwise the sum of all fuel types)
	const acc = new Map<string, Values & { hasTotal: boolean }>();
	for (const r of rows) {
		const k = `${r.vehicle_class}|${r.year}|${r.month}|${r.period}`;
		const a = acc.get(k) ?? { electric: 0, total: 0, hasTotal: false };
		const v = Number(r.value) || 0;
		if (r.fuel_type === 'total') {
			a.total = v;
			a.hasTotal = true;
		} else if (!r.parent_fuel_type) {
			if (r.fuel_type === 'electric') a.electric += v;
			if (!a.hasTotal) a.total += v;
		}
		acc.set(k, a);
	}
	const share = (cls: string, year: number, month: number, period: string): number | null => {
		const a = acc.get(`${cls}|${year}|${month}|${period}`);
		return a && a.total ? (a.electric / a.total) * 100 : null;
	};
	const latest = (cls: string, period: string) => {
		let best: { year: number; month: number } | null = null;
		for (const k of acc.keys()) {
			const [c, y, m, p] = k.split('|');
			if (c !== cls || p !== period) continue;
			const cand = { year: Number(y), month: Number(m) };
			if (!best || cand.year > best.year || (cand.year === best.year && cand.month > best.month)) best = cand;
		}
		return best;
	};

	const out: Record<string, string> = {};

	// Pkw
	const carMonth = latest('passenger_car_m1', 'month');
	if (carMonth) {
		const s = share('passenger_car_m1', carMonth.year, carMonth.month, 'month');
		const ytd = share('passenger_car_m1', carMonth.year, carMonth.month, 'year_to_date');
		const prev = share('passenger_car_m1', carMonth.year - 1, 12, 'year_to_date');
		Object.assign(out, {
			carLatestMonth: `${MONTHS[carMonth.month - 1]} ${carMonth.year}`,
			carLatestShare: pct(s),
			carLatestShareText: shareInWords(s, 'jedes'),
			carPrevYear: String(carMonth.year - 1),
			carPrevYearShare: pct(prev),
			carYtdPeriod: periodText(carMonth.year, carMonth.month),
			carYtdShare: pct(ytd)
		});
	}

	// Lkw: latest year_to_date of each class (same period for all classes)
	const truckYtd = latest('truck_n1', 'year_to_date');
	if (truckYtd) {
		const { year, month } = truckYtd;
		const s = (cls: string) => share(cls, year, month, 'year_to_date');
		const heavy = ['truck_n3', 'semi_trailer_tractor'].map((c) => acc.get(`${c}|${year}|${month}|year_to_date`));
		const heavyTotal = heavy.reduce((t, a) => t + (a?.total ?? 0), 0);
		const heavyElectric = heavy.reduce((t, a) => t + (a?.electric ?? 0), 0);
		Object.assign(out, {
			truckYear: String(year),
			truckPeriod: periodText(year, month),
			truckN1Share: pct(s('truck_n1')),
			truckN1ShareText: shareInWords(s('truck_n1'), 'jeder'),
			truckN2Share: pct(s('truck_n2')),
			truckN2ShareText: shareInWords(s('truck_n2'), 'jeder'),
			truckN3Share: pct(s('truck_n3')),
			truckSemiShare: pct(s('semi_trailer_tractor')),
			truckHeavyShare: heavyTotal ? pct((heavyElectric / heavyTotal) * 100, 0) : ''
		});
	}

	// Busse
	const busYtd = latest('bus_m2_m3', 'year_to_date');
	if (busYtd) {
		const ytd = share('bus_m2_m3', busYtd.year, busYtd.month, 'year_to_date');
		const prev = share('bus_m2_m3', busYtd.year - 1, 12, 'year_to_date');
		Object.assign(out, {
			busPrevYear: String(busYtd.year - 1),
			busPrevYearShare: pct(prev),
			busPrevYearShareText: shareInWords(prev, 'jeder'),
			busYtdPeriod: periodText(busYtd.year, busYtd.month),
			busYtdShare: pct(ytd),
			busYtdShareText: shareInWords(ytd, 'jeder')
		});
	}
	return out;
}
