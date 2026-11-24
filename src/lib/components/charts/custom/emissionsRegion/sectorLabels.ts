// Display names for the federal-state sectors (Regionalstatistik 86431), overriding the
// emissions_category labels from Directus. Ordering still uses the Directus labels.

const SECTOR_LABELS: Record<string, string> = {
	'Emissions|Kyoto Gases|Energy': 'Energiewirtschaft',
	'Emissions|Kyoto Gases|Industrial Processes': 'Industrie',
	'Emissions|Kyoto Gases|Buildings': 'Gebäude',
	'Emissions|Kyoto Gases|Mobility': 'Verkehr',
	'Emissions|Kyoto Gases|Agriculture': 'Landwirtschaft',
	'Emissions|Kyoto Gases|Waste and Other': 'Abfallwirtschaft und Sonstiges'
};

export function sectorLabel(code: string, directusLabel: string | null | undefined): string {
	return SECTOR_LABELS[code] ?? directusLabel ?? code;
}
