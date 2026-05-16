export type RegionCase = 'grossstadt' | 'mittelstadt' | 'kleinstadt' | 'kreis' | 'bundesland';

export interface HistEntry {
	net_potential_share: number;
	roofs_solar_share: number;
	net_power_kw: number;
	units_count: number;
	date: string;
}

export interface SolarRegion {
	id: string;
	name: string;
	population?: number;
	layer?: string;       // 'municipality' | 'district' | 'state' | 'country'
	layer_label?: string;
	parents?: Array<{ id: string; layer: string }>;
	center?: [string, string]; // [lon, lat]
}

export interface SolarRankEntry {
	region: SolarRegion;
	potential: number;    // net_potential_share (%)
	daecher: number;      // roofs_solar_share (%)
	mwp: number;          // net_power_kw / 1000
	unitCount: number;    // units_count
	trend: number | null; // 6-month delta in pp, null if no prev data
	rc: number | null;    // rank change vs 6 months ago (positive = improved)
}

export type SolarNeighbourEntry = SolarRankEntry & { distKm: number };

export interface SolarStats {
	potential: number;
	daecher: number;
	dachPV: number;
	unitCount: number;
	trend: number;
	neuAnlagenMonat: number;
	neuLeistungMonat: number;
	updateDate: string;
	avgDE: number;        // avg net_potential_share across all regions
	avgDaecherDE: number; // avg roofs_solar_share across all regions
}

export interface SolarAverages {
	avgDE: number;
	avgDaecherDE: number;
	avgState: number | null;
	avgDaecherState: number | null;
	stateName: string;
}
