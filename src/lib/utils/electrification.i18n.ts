// $lib/utils/electrification.i18n.ts
//
// German/English strings for the electrification tracker.
//
// Why local rather than the Directus `translations` collection: nearly every string here splices in
// a live value (year, percentage, country name), and the site's `t()` helper is
// `translations?.[key] ?? key` — no interpolation. Functions express that directly and stay
// reviewable in the diff. Shared card chrome (tabs, download menu) still comes from Directus, where
// it is already German.
//
// The German register follows the earlier standalone tracker (klimadashboard_v1): Sie-form, German
// typography (23,4 % with a space before the sign), "Elektrifizierungsquote", em-dashes. Strings
// whose English has not changed since then are carried over verbatim; everything the English has
// since gained — the lede, the targets copy, the benchmarks — is translated fresh from the current
// English rather than ported, so the two languages say the same thing.

export type Lang = 'en' | 'de';

/** Narrow whatever `page.data.language.code` holds down to a supported locale. */
export function toLang(code: string | undefined | null): Lang {
	return code === 'de' ? 'de' : 'en';
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------
// Values arrive as percentages (0-100), not fractions — do not scale them here.

export interface Fmt {
	/** Bare decimal with the locale's separator, e.g. "0.85" / "0,85". */
	num: (value: number, digits?: number) => string;
	/** e.g. "23.4%" / "23,4 %" */
	pct: (value: number, digits?: number) => string;
	/** Percentage points, e.g. "8.6pp" / "8,6 Pp." */
	pp: (value: number, digits?: number) => string;
	/** Signed gap in percentage points, e.g. "+4.2pp" / "−8,6 Pp." (U+2212 minus). */
	signedPP: (value: number, digits?: number) => string;
}

export function formatters(lang: Lang): Fmt {
	const dec = (n: number, digits: number) =>
		lang === 'de' ? n.toFixed(digits).replace('.', ',') : n.toFixed(digits);

	const num = (value: number, digits = 1) => {
		if (value == null || isNaN(value)) return '–';
		return dec(value, digits);
	};
	const pct = (value: number, digits = 0) => {
		if (value == null || isNaN(value)) return '–';
		return lang === 'de' ? `${dec(value, digits)} %` : `${dec(value, digits)}%`;
	};
	const pp = (value: number, digits = 1) => {
		if (value == null || isNaN(value)) return '–';
		return lang === 'de' ? `${dec(value, digits)} Pp.` : `${dec(value, digits)}pp`;
	};
	const signedPP = (value: number, digits = 1) => {
		if (value == null || isNaN(value)) return '–';
		return (value >= 0 ? '+' : '−') + pp(Math.abs(value), digits);
	};
	return { num, pct, pp, signedPP };
}

// ---------------------------------------------------------------------------
// Sector names
// ---------------------------------------------------------------------------
// Carried over from v1 — the English has not changed.

const SECTOR_NAMES: Record<string, Record<Lang, { label: string; short: string }>> = {
	total_economy: {
		en: { label: 'Total final consumption', short: 'Total' },
		de: { label: 'Gesamter Endenergieverbrauch', short: 'Gesamt' }
	},
	industry: {
		en: { label: 'Industry', short: 'Industry' },
		de: { label: 'Industrie', short: 'Industrie' }
	},
	residential: {
		en: { label: 'Residential buildings', short: 'Residential' },
		de: { label: 'Wohngebäude', short: 'Wohnen' }
	},
	services: {
		en: { label: 'Commercial & services', short: 'Services' },
		de: { label: 'Gewerbe & Dienstleistungen', short: 'Gewerbe' }
	},
	transport: {
		en: { label: 'Transport', short: 'Transport' },
		de: { label: 'Verkehr', short: 'Verkehr' }
	}
};

export function sectorLabel(key: string, lang: Lang): string {
	return SECTOR_NAMES[key]?.[lang]?.label ?? key;
}
export function sectorShort(key: string, lang: Lang): string {
	return SECTOR_NAMES[key]?.[lang]?.short ?? key;
}

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------

const en = {
	// -- shared states -------------------------------------------------------
	loadError: 'Failed to load data',
	noDataAvailable: 'No data available',
	noData: 'No data',

	// -- controls ------------------------------------------------------------
	addCountry: 'Add country',
	addPlaceholder: '+ country…',
	clearSelection: 'Clear selection',
	clearAll: 'Clear all',
	remove: (name: string) => `Remove ${name}`,
	sort: 'Sort',
	sortValue: 'Value',
	sortAZ: 'A–Z',
	yAxis: 'Y-axis',
	perSector: 'Per-sector',
	sharedAxis: (max: string) => `Shared 0–${max}`,
	compareWith: 'Compare with',

	// -- sources / targets ---------------------------------------------------
	euTargets: 'EU targets',
	proposed: 'proposed',
	globalRate: 'global',
	sourceEc: 'European Commission',
	sourceEap: 'Electrification Action Plan',
	sourceCop31: 'COP31 Presidency',
	sourceEsabcc: 'EU Climate Advisory Board',
	refCop31: 'COP31 (global)',
	refEsabcc: 'Climate Advisory Board',
	byYear: (value: string, year: number) => `${value} by ${year}`,

	// -- page ----------------------------------------------------------------
	pageTitle: 'EU Electrification Tracker | Klimadashboard',
	metaDescription:
		'Track how the EU and its member states are progressing toward the 32% (2030) and proposed 46% (2040) electrification targets, by country and by sector.',
	headline: 'How fast is the EU electrifying?',
	ledeCovers: (pct: string, year: number) =>
		`Electricity now covers ${pct} of the EU-27's total final energy consumption (${year}).`,
	ledeCoversFallback: "Electricity covers a growing share of the EU-27's total final energy consumption.",
	ledeBody: (t30: string, t40: string) =>
		`In order to cut dependence on oil and gas, the European Commission proposed a target of ${t30} as part of the Affordable Energy Action Plan on 26 February 2025. On 17 July 2026 the European Commission proposed a new target of ${t40}. These targets are non-binding, but could be integrated into legislation. Here we track how each EU country and sector is progressing toward the proposed ${t30} and ${t40} electrification targets.`,

	// -- methodology ---------------------------------------------------------
	methHeading: 'Data & methodology',
	dataH: 'Data source',
	// Rendered with {@html} — these carry <code>/<b>/<a> markup.
	dataB: (start: number, end: number | string) =>
		`Eurostat, Complete energy balances (<code>nrg_bal_c</code>), annual. Charts show ${start}–${end}; the series reaches back to 1990 but early-1990s data is unreliable for several states. For each sector, the electrification rate = final electricity consumption (product <code>E7000</code>) ÷ that sector's total final energy consumption (product <code>TOTAL</code>). The EU-27 aggregate is Σ member-state electricity ÷ Σ member-state total.`,
	sourceName: 'Eurostat, Complete energy balances (nrg_bal_c)',
	sectorsH: 'Sectors',
	colSector: 'Sector',
	colCode: 'Eurostat code',
	targetsH: 'EU targets',
	targetsB: (t30: string, t40: string, ecUrl: string, eapUrl: string) =>
		`<b class="text-gray-900 dark:text-white">${t30}</b> — the electrification key performance indicator of the EU Clean Industrial Deal and the Affordable Energy Action Plan (COM/2025/79), published <b class="text-gray-900 dark:text-white">26 February 2025</b>, against a 2024 baseline of 23.4% (<a class="underline underline-offset-2" href="${ecUrl}" target="_blank" rel="noopener">European Commission</a>). <b class="text-gray-900 dark:text-white">${t40} (proposed)</b> — Action 1 of the <a class="underline underline-offset-2" href="${eapUrl}" target="_blank" rel="noopener">Electrification Action Plan (COM(2026) 595)</a>, adopted <b class="text-gray-900 dark:text-white">17 July 2026</b>, which sets "an indicative electrification target of 46% by 2040 (electricity share in final energy consumption)" — the same measure shown here. The Commission calls it indicative, not binding, and it will be subject to an impact assessment as part of the Energy Union Package in Q4 2026.`,
	benchmarksH: 'Contextual benchmarks',
	benchmarksB: (cop31Url: string, esabccUrl: string) =>
		`Optional comparison lines, off by default. <b class="text-gray-900 dark:text-white">COP31 — 35% by 2035</b>: a voluntary <b class="text-gray-900 dark:text-white">global</b> electrification rate announced by the COP31 Presidency in June 2026, up from just over 20% worldwide (<a class="underline underline-offset-2" href="${cop31Url}" target="_blank" rel="noopener">UNFCCC</a>). <b class="text-gray-900 dark:text-white">Climate Advisory Board — 50% by 2040, 60% by 2050</b>: the electrification rates reached in the pathways that deliver a 90–95% emissions reduction in the 2040 advice of the European Scientific Advisory Board on Climate Change (ESABCC), Indicator E5. Scientific advice, not a policy target (<a class="underline underline-offset-2" href="${esabccUrl}" target="_blank" rel="noopener">European Scientific Advisory Board on Climate Change</a>).`,
	caveatsH: 'Notes & caveats',
	caveatsB: (note: string) =>
		`Transport is shown as the raw electricity/TFC ratio (~2%) and excludes the Renewable Energy Directive multipliers that raise the Commission's headline figure. Pre-2004 EU-27 is a counterfactual sum of today's 27 members. ${note} All figures are illustrative, not forecasts.`,
	smallNote: '* Malta, Cyprus, Luxembourg have very small or distorted energy bases.',
	footerData: (source: string) => `Data: ${source}.`,
	footerInspired: 'Inspired by Jan Rosenow —',
	footerLink: 'Is electrification happening fast enough?',

	// -- country paths -------------------------------------------------------
	cpActual: (year: number) => `${year} actual`,
	cpGapTo: (year: number, pct: string) => `Gap to ${year} (${pct})`,
	cpNeeded: (year: number) => `Needed to ${year}`,
	cpPerYr: (v: string) => `${v} pp/yr`,
	cpMet: (year: number) => `${year} met`,

	// -- distance to target --------------------------------------------------
	dtAria: 'Distance to the EU electrification targets',
	dtVs: (year: number, pct: string) => `vs ${year} (${pct})`,
	dtVsRef: (label: string, year: number, pct: string) => `vs ${label} ${year} (${pct})`,

	// -- by sector -----------------------------------------------------------
	svSubSingle: (country: string, a: number, b: number | string) =>
		`Electricity share of ${country}'s final consumption by sector, ${a}–${b}`,
	svSubMulti: (n: number, a: number, b: number | string) =>
		`Electricity share by sector, comparing ${n} countries, ${a}–${b}`,

	// -- table columns -------------------------------------------------------
	colCountry: 'Country',
	colYear: 'Year',
	colShareTfc: 'Electricity share of TFC (%)',
	colShareTfcLatest: 'Electricity share of TFC, latest year (%)',
	colShare: 'Electricity share (%)',
	colGapTo: (year: number) => `Gap to ${year} target (pp)`,

	// -- headlines -----------------------------------------------------------
	hlCpFallback: 'Track country progress toward the EU electrification targets',
	hlCpMulti: (leader: string, lv: string, laggard: string, gv: string) =>
		`${leader} leads the selected regions at ${lv}, while ${laggard} trails at ${gv}`,
	hlCpMultiSame: (year: number) =>
		`The selected regions are progressing toward the ${year} electrification goals`,
	hlCpSurpassed: (name: string, year: number) =>
		`${name} has already surpassed the ${year} electrification target`,
	hlCpMetOnTrack: (name: string, y30: number, y40: number) =>
		`${name} has already reached its ${y30} target and is on track for ${y40}`,
	hlCpMetOffTrack: (name: string, y30: number, y40: number) =>
		`${name} has reached its ${y30} target, but isn't on track for ${y40} yet`,
	hlCpOnTrack: (name: string, y30: number, y40: number) =>
		`${name} is on track to reach the ${y30} and ${y40} electrification goals`,
	hlCpOffTrack: (name: string, y30: number, y40: number) =>
		`${name} is not yet on track to reach the ${y30} and ${y40} electrification goals`,
	hlDtFallback: 'Countries today differ widely in their electrification rates',
	hlDtRange: (minV: string, minN: string, maxV: string, maxN: string) =>
		`Electrification today ranges from ${minV} in ${minN} to ${maxV} in ${maxN} across the EU`,
	hlSvFallback: 'Electrification varies widely by sector',
	hlSvEven: (region: string) => `In ${region}, electrification is fairly even across sectors`,
	hlSvSingle: (region: string, max: string, maxV: string, min: string, minV: string) =>
		`In ${region}, ${max} is highly electrified (${maxV}) while ${min} lags (${minV})`,
	hlSvScopeSelected: 'the selected countries',
	hlSvScopeEu: 'the EU',
	hlSvMulti: (scope: string, max: string, min: string) =>
		`Across ${scope}, ${max} is consistently the most electrified sector, while ${min} lags behind`
};

export type Strings = typeof en;

const de: Strings = {
	// -- shared states -------------------------------------------------------
	// v1 had no fetch, so it had no error/empty states — these are new.
	loadError: 'Daten konnten nicht geladen werden',
	noDataAvailable: 'Keine Daten verfügbar',
	noData: 'Keine Daten',

	// -- controls (carried over from v1) -------------------------------------
	addCountry: 'Land hinzufügen',
	addPlaceholder: '+ Land …',
	clearSelection: 'Auswahl zurücksetzen',
	clearAll: 'Alles zurücksetzen',
	remove: (name) => `${name} entfernen`,
	sort: 'Sortierung',
	sortValue: 'Wert',
	sortAZ: 'A–Z',
	yAxis: 'Y-Achse',
	perSector: 'Pro Sektor',
	sharedAxis: (max) => `Einheitlich 0–${max}`,
	compareWith: 'Vergleichen mit',

	// -- sources / targets (new: the benchmarks did not exist in v1) ---------
	euTargets: 'EU-Ziele',
	proposed: 'Vorschlag',
	globalRate: 'global',
	sourceEc: 'Europäische Kommission',
	sourceEap: 'Electrification Action Plan',
	sourceCop31: 'COP31-Präsidentschaft',
	sourceEsabcc: 'EU-Klimabeirat',
	refCop31: 'COP31 (global)',
	refEsabcc: 'EU-Klimabeirat',
	byYear: (value, year) => `${value} bis ${year}`,

	// -- page ----------------------------------------------------------------
	pageTitle: 'EU-Elektrifizierungstracker | Klimadashboard',
	metaDescription:
		'Verfolgen Sie, wie die EU und ihre Mitgliedstaaten in Richtung der Elektrifizierungsziele 32 % (2030) und der vorgeschlagenen 46 % (2040) vorankommen — nach Land und nach Sektor.',
	headline: 'Wie schnell elektrifiziert die EU?',
	// Opening clause kept verbatim from v1; the rest is new copy, translated from the current English.
	ledeCovers: (pct, year) =>
		`Elektrizität deckt derzeit ${pct} des gesamten Endenergieverbrauchs der EU-27 (${year}).`,
	ledeCoversFallback:
		'Elektrizität deckt einen wachsenden Anteil des gesamten Endenergieverbrauchs der EU-27.',
	ledeBody: (t30, t40) =>
		`Um die Abhängigkeit von Öl und Gas zu verringern, schlug die Europäische Kommission am 26. Februar 2025 im Rahmen des Affordable Energy Action Plan ein Ziel von ${t30} vor. Am 17. Juli 2026 schlug die Europäische Kommission ein neues Ziel von ${t40} vor. Diese Ziele sind rechtlich nicht bindend, könnten aber in Gesetzgebung überführt werden. Hier verfolgen wir, wie jedes EU-Land und jeder Sektor in Richtung der vorgeschlagenen Ziele ${t30} und ${t40} vorankommt.`,

	// -- methodology (headings + dataB/caveatsB carried over from v1) --------
	methHeading: 'Daten & Methodik',
	dataH: 'Datenquelle',
	dataB: (start, end) =>
		`Eurostat, Energiebilanzen (<code>nrg_bal_c</code>), jährlich. Die Grafiken zeigen ${start}–${end}; die Reihe reicht bis 1990 zurück, doch die Daten der frühen 1990er sind für mehrere Länder unzuverlässig. Je Sektor gilt: Elektrifizierungsquote = Endenergieverbrauch an Elektrizität (<code>E7000</code>) ÷ gesamter Endenergieverbrauch des Sektors (<code>TOTAL</code>). Die EU-27 ergibt sich aus Σ Elektrizität der Mitgliedstaaten ÷ Σ Gesamtverbrauch der Mitgliedstaaten.`,
	sourceName: 'Eurostat, Energiebilanzen (nrg_bal_c)',
	sectorsH: 'Sektoren',
	colSector: 'Sektor',
	colCode: 'Eurostat-Code',
	targetsH: 'EU-Ziele',
	// New copy — v1's targetsB predates the 46 % proposal and still says 50 %.
	targetsB: (t30, t40, ecUrl, eapUrl) =>
		`<b class="text-gray-900 dark:text-white">${t30}</b> — der Elektrifizierungs-Leitindikator des <b>Clean Industrial Deal</b> und des <b>Affordable Energy Action Plan</b> der EU (COM/2025/79), veröffentlicht am <b class="text-gray-900 dark:text-white">26. Februar 2025</b>, gegenüber einem Basiswert von 23,4 % im Jahr 2024 (<a class="underline underline-offset-2" href="${ecUrl}" target="_blank" rel="noopener">Europäische Kommission</a>). <b class="text-gray-900 dark:text-white">${t40} (Vorschlag)</b> — Action 1 des <a class="underline underline-offset-2" href="${eapUrl}" target="_blank" rel="noopener">Electrification Action Plan (COM(2026) 595)</a>, angenommen am <b class="text-gray-900 dark:text-white">17. Juli 2026</b>: „an indicative electrification target of 46% by 2040 (electricity share in final energy consumption)“ — dieselbe Größe, die hier dargestellt wird. Die Kommission bezeichnet den Wert als indikativ, nicht als verbindlich; er wird im 4. Quartal 2026 im Rahmen des Energy Union Package einer Folgenabschätzung unterzogen.`,
	benchmarksH: 'Vergleichswerte',
	benchmarksB: (cop31Url, esabccUrl) =>
		`Optionale Vergleichslinien, standardmäßig ausgeblendet. <b class="text-gray-900 dark:text-white">COP31 — 35 % bis 2035</b>: eine freiwillige <b class="text-gray-900 dark:text-white">globale</b> Elektrifizierungsquote, die die COP31-Präsidentschaft im Juni 2026 angekündigt hat, ausgehend von etwas über 20 % weltweit (<a class="underline underline-offset-2" href="${cop31Url}" target="_blank" rel="noopener">UNFCCC</a>). <b class="text-gray-900 dark:text-white">EU-Klimabeirat — 50 % bis 2040, 60 % bis 2050</b>: die Elektrifizierungsquoten in jenen Pfaden, die im 2040-Gutachten des Europäischen Wissenschaftlichen Beirats zum Klimawandel (ESABCC) eine Emissionsminderung von 90–95 % erreichen (Indikator E5). Wissenschaftliche Beratung, kein politisches Ziel (<a class="underline underline-offset-2" href="${esabccUrl}" target="_blank" rel="noopener">Europäischer Wissenschaftlicher Beirat zum Klimawandel</a>).`,
	caveatsH: 'Hinweise',
	caveatsB: (note) =>
		`Der Verkehr wird als reines Verhältnis Elektrizität/Endenergie (~2 %) dargestellt und schließt die Multiplikatoren der Erneuerbare-Energien-Richtlinie aus, die die Schlagzeilen-Zahl der Kommission erhöhen. Die EU-27 vor 2004 ist eine kontrafaktische Summe der heutigen 27 Mitgliedstaaten. ${note} Alle Werte sind illustrativ, keine Prognosen.`,
	smallNote: '* Malta, Zypern, Luxemburg haben sehr kleine oder verzerrte Energiebasen.',
	footerData: (source) => `Daten: ${source}.`,
	footerInspired: 'Inspiriert von Jan Rosenow —',
	footerLink: 'Is electrification happening fast enough?',

	// -- country paths (carried over from v1) --------------------------------
	cpActual: (year) => `Ist-Wert ${year}`,
	cpGapTo: (year, pct) => `Abstand zu ${year} (${pct})`,
	cpNeeded: (year) => `Nötig bis ${year}`,
	cpPerYr: (v) => `${v} Pp./Jahr`,
	cpMet: (year) => `${year} erreicht`,

	// -- distance to target --------------------------------------------------
	dtAria: 'Abstand zu den EU-Elektrifizierungszielen',
	dtVs: (year, pct) => `ggü. ${year} (${pct})`,
	dtVsRef: (label, year, pct) => `ggü. ${label} ${year} (${pct})`,

	// -- by sector (carried over from v1) ------------------------------------
	svSubSingle: (country, a, b) =>
		`Anteil der Elektrizität am Endenergieverbrauch je Sektor — ${country}, ${a}–${b}`,
	svSubMulti: (n, a, b) => `Anteil der Elektrizität je Sektor, Vergleich von ${n} Ländern, ${a}–${b}`,

	// -- table columns (new: v1 had no data table) ---------------------------
	colCountry: 'Land',
	colYear: 'Jahr',
	colShareTfc: 'Anteil der Elektrizität am Endenergieverbrauch (%)',
	colShareTfcLatest: 'Anteil der Elektrizität am Endenergieverbrauch, letztes Jahr (%)',
	colShare: 'Anteil der Elektrizität (%)',
	colGapTo: (year) => `Abstand zum Ziel ${year} (Pp.)`,

	// -- headlines (new: v1 had no generated headlines) ----------------------
	hlCpFallback: 'Verfolgen Sie den Fortschritt der Länder in Richtung der EU-Elektrifizierungsziele',
	hlCpMulti: (leader, lv, laggard, gv) =>
		`${leader} führt unter den gewählten Regionen mit ${lv}, während ${laggard} mit ${gv} zurückliegt`,
	hlCpMultiSame: (year) =>
		`Die gewählten Regionen kommen in Richtung der Elektrifizierungsziele ${year} voran`,
	hlCpSurpassed: (name, year) =>
		`${name} hat das Elektrifizierungsziel für ${year} bereits übertroffen`,
	hlCpMetOnTrack: (name, y30, y40) =>
		`${name} hat sein Ziel für ${y30} bereits erreicht und liegt für ${y40} auf Kurs`,
	hlCpMetOffTrack: (name, y30, y40) =>
		`${name} hat sein Ziel für ${y30} erreicht, liegt für ${y40} aber noch nicht auf Kurs`,
	hlCpOnTrack: (name, y30, y40) =>
		`${name} liegt auf Kurs, die Elektrifizierungsziele ${y30} und ${y40} zu erreichen`,
	hlCpOffTrack: (name, y30, y40) =>
		`${name} liegt noch nicht auf Kurs, die Elektrifizierungsziele ${y30} und ${y40} zu erreichen`,
	hlDtFallback: 'Die Elektrifizierungsquoten der Länder gehen heute weit auseinander',
	hlDtRange: (minV, minN, maxV, maxN) =>
		`Die Elektrifizierung reicht heute EU-weit von ${minV} in ${minN} bis ${maxV} in ${maxN}`,
	hlSvFallback: 'Die Elektrifizierung unterscheidet sich stark je nach Sektor',
	hlSvEven: (region) => `In ${region} ist die Elektrifizierung über die Sektoren hinweg recht gleichmäßig`,
	hlSvSingle: (region, max, maxV, min, minV) =>
		`In ${region} ist ${max} stark elektrifiziert (${maxV}), während ${min} zurückliegt (${minV})`,
	hlSvScopeSelected: 'den gewählten Ländern',
	hlSvScopeEu: 'der EU',
	hlSvMulti: (scope, max, min) =>
		`In ${scope} ist ${max} durchgängig der am stärksten elektrifizierte Sektor, während ${min} zurückliegt`
};

export const STRINGS: Record<Lang, Strings> = { en, de };

/** Strings for a locale. Pass `page.data.language.code` or a chart config's `lang`. */
export function strings(lang: string | undefined | null): Strings {
	return STRINGS[toLang(lang)];
}

// ---------------------------------------------------------------------------
// Lookups for the target/source data in electrification.ts
// ---------------------------------------------------------------------------
// Keyed by plain strings rather than importing SourceKey, so electrification.ts stays data-only
// and the two modules don't import each other.

const SOURCE_LABEL: Record<string, keyof Strings> = {
	ec: 'sourceEc',
	eap: 'sourceEap',
	cop31: 'sourceCop31',
	esabcc: 'sourceEsabcc'
};
const REF_LABEL: Record<string, keyof Strings> = { cop31: 'refCop31', esabcc: 'refEsabcc' };

/** Tag shown in chart annotations, e.g. the "(ESABCC)" in "2050 · 60% (ESABCC)". Not translated —
 *  these are institution acronyms. */
const SOURCE_SHORT: Record<string, string> = {
	ec: 'EU',
	eap: 'EU',
	cop31: 'COP31',
	esabcc: 'ESABCC'
};

export function sourceLabel(key: string, lang: Lang): string {
	const k = SOURCE_LABEL[key];
	return k ? (STRINGS[lang][k] as string) : key;
}

/** Toggle label for a REFERENCE_TARGETS entry. */
export function refLabel(id: string, lang: Lang): string {
	const k = REF_LABEL[id];
	return k ? (STRINGS[lang][k] as string) : id;
}

/** Annotation for a target dot/line, e.g. "2030 · 32% (EU)" / "2030 · 32 % (EU)".
 *  `compact` (mobile) drops the year and source tag — measured, the full form collides and
 *  overflows the plot below ~500px. */
export function targetAnnotation(
	year: number,
	value: number,
	sourceKey: string,
	compact: boolean,
	lang: Lang
): string {
	const f = formatters(lang);
	if (compact) return f.pct(value);
	return `${year} · ${f.pct(value)} (${SOURCE_SHORT[sourceKey] ?? ''})`;
}
