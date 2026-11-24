// Tabler icons for the sector switch, same set as productionBasedEmissions.
// Keyed by emissions_category code; codes without an icon fall back to a colour dot.

import {
	IconBolt,
	IconBuildingFactory2,
	IconHome2,
	IconCar,
	IconTractor,
	IconRecycle,
	IconWind,
	IconBuildingStore,
	IconBuildingCommunity,
	IconBriefcase
} from '@tabler/icons-svelte-runes';

const SECTOR_ICONS: Record<string, unknown> = {
	// Energy
	'Emissions|Kyoto Gases|Energy': IconBolt,
	ksg_energy: IconBolt,
	// Industry
	'Emissions|Kyoto Gases|Industrial Processes': IconBuildingFactory2,
	ksg_industry: IconBuildingFactory2,
	industry: IconBuildingFactory2,
	bisko_industrie: IconBuildingFactory2,
	bisko_ghdi: IconBuildingFactory2,
	// Buildings / households
	'Emissions|Kyoto Gases|Buildings': IconHome2,
	ksg_buildings: IconHome2,
	buildings: IconHome2,
	bisko_wohnen: IconHome2,
	// Transport
	'Emissions|Kyoto Gases|Mobility': IconCar,
	ksg_transport: IconCar,
	mobility: IconCar,
	bisko_verkehr: IconCar,
	// Agriculture
	'Emissions|Kyoto Gases|Agriculture': IconTractor,
	ksg_agriculture: IconTractor,
	agriculture: IconTractor,
	// Waste
	'Emissions|Kyoto Gases|Waste and Other': IconRecycle,
	ksg_waste: IconRecycle,
	// F-gases
	ksg_fgases: IconWind,
	// Municipal balances (BISKO)
	bisko_ghd: IconBuildingStore,
	services: IconBuildingStore,
	bisko_staedtliegenschaften: IconBuildingCommunity,
	bisko_unternehmen: IconBriefcase
};

export function getSectorIcon(code: string): unknown | null {
	return SECTOR_ICONS[code] ?? null;
}
