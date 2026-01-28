/**
 * Script to add translation keys to Directus
 *
 * Usage:
 *   node scripts/add-translations.js
 *
 * Prerequisites:
 *   - Set DIRECTUS_TOKEN environment variable with an admin token
 *   - Or modify this script to use your authentication method
 *
 * This script will:
 *   1. Check which translation keys already exist
 *   2. Add only the missing keys (won't overwrite existing translations)
 */

import { createDirectus, rest, staticToken, createTranslations, readTranslations } from '@directus/sdk';

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/add-translations.js');
	process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// All translation keys with German (de-DE) and English (en-US) values
const translations = [
	// ========== UI Labels ==========
	// Card component
	{ key: 'ui.card.tabChart', de: 'Grafik', en: 'Chart' },
	{ key: 'ui.card.tabTable', de: 'Tabelle', en: 'Table' },
	{ key: 'ui.card.tabInfo', de: 'Info', en: 'Info' },
	{ key: 'ui.card.map', de: 'Karte', en: 'Map' },
	{ key: 'ui.card.showOnMap', de: 'Auf Karte anzeigen', en: 'Show on map' },
	{ key: 'ui.card.rawData', de: 'Rohdaten', en: 'Raw data' },
	{ key: 'ui.card.permalink', de: 'Permalink', en: 'Permalink' },

	// Embed modal
	{ key: 'ui.embed.title', de: 'Grafik einbetten', en: 'Embed chart' },
	{ key: 'ui.embed.close', de: 'Schließen', en: 'Close' },
	{ key: 'ui.embed.type', de: 'Einbettungsart', en: 'Embed type' },
	{ key: 'ui.embed.autoHeight', de: 'Auto-Höhe', en: 'Auto height' },
	{ key: 'ui.embed.fixedHeight', de: 'Feste Höhe (450px)', en: 'Fixed height (450px)' },
	{ key: 'ui.embed.options', de: 'Optionen', en: 'Options' },
	{ key: 'ui.embed.preselectRegion', de: 'Region vorauswählen', en: 'Preselect region' },
	{ key: 'ui.embed.simpleView', de: 'Vereinfachte Ansicht (nur Grafik)', en: 'Simple view (chart only)' },
	{ key: 'ui.embed.code', de: 'Einbettungscode', en: 'Embed code' },
	{ key: 'ui.embed.copyIframe', de: 'iFrame kopieren', en: 'Copy iFrame' },

	// Wrapper component
	{ key: 'ui.wrapper.dataSources', de: 'Datenquellen', en: 'Data sources' },

	// Search
	{ key: 'ui.search.findRegion', de: 'Region finden...', en: 'Find region...' },
	{ key: 'ui.search.coordinatesNote', de: 'Du kannst auch Koordinaten eingeben', en: 'You can also enter coordinates' },

	// Renewable regions
	{ key: 'ui.renewable.solarInstallations', de: 'Solaranlagen', en: 'Solar installations' },
	{ key: 'ui.renewable.windTurbines', de: 'Windkraftanlagen', en: 'Wind turbines' },
	{ key: 'ui.renewable.power', de: 'Leistung', en: 'Power' },
	{ key: 'ui.renewable.totalPower', de: 'Gesamtleistung', en: 'Total power' },
	{ key: 'ui.renewable.cumulativePower', de: 'Kumulative Leistung', en: 'Cumulative power' },
	{ key: 'ui.renewable.netAdditionsPerYear', de: 'Netto-Zubau pro Jahr', en: 'Net additions per year' },
	{ key: 'ui.renewable.addition', de: 'Zubau', en: 'Addition' },
	{ key: 'ui.renewable.cumulative', de: 'Kumuliert', en: 'Cumulative' },
	{ key: 'ui.renewable.requiredForGoal', de: 'Benötigt für Ziel', en: 'Required for goal' },
	{ key: 'ui.renewable.actualAddition', de: 'Tatsächlicher Zubau', en: 'Actual addition' },
	{ key: 'ui.renewable.addRegion', de: 'Region hinzufügen...', en: 'Add region...' },
	{ key: 'ui.renewable.showHistoric', de: 'Zeige historische Entwicklung', en: 'Show historical development' },
	{ key: 'ui.renewable.dataStatus', de: 'Datenstand', en: 'Data status' },
	{ key: 'ui.renewable.dataSource', de: 'Datenquelle: Marktstammdatenregister der Bundesnetzagentur', en: 'Data source: Market Master Data Register of the Federal Network Agency' },

	// Emissions
	{ key: 'ui.emissions.perCapita', de: 'Pro-Kopf Emissionen?', en: 'Per capita emissions?' },
	{ key: 'ui.emissions.selectYear', de: 'Jahr auswählen', en: 'Select year' },
	{ key: 'ui.emissions.perCapitaNote', de: 'Pro-Kopf-Werte basieren auf jahresspezifischen Bevölkerungsdaten', en: 'Per capita values are based on year-specific population data' },
	{ key: 'ui.emissions.perCapitaNotePopulation', de: 'Pro-Kopf-Werte basieren auf einer Bevölkerung von', en: 'Per capita values are based on a population of' },
	{ key: 'ui.emissions.ghgPerCapita', de: 'Treibhausgas-Emissionen pro Kopf', en: 'Greenhouse gas emissions per capita' },

	// Time periods
	{ key: 'ui.time.days', de: 'Tage', en: 'Days' },
	{ key: 'ui.time.months', de: 'Monate', en: 'Months' },
	{ key: 'ui.time.year', de: 'Jahr', en: 'Year' },
	{ key: 'ui.time.years', de: 'Jahre', en: 'Years' },
	{ key: 'ui.time.seasons', de: 'Jahreszeiten', en: 'Seasons' },
	{ key: 'ui.time.sinceYearStart', de: 'Seit Jahresbeginn', en: 'Since start of year' },
	{ key: 'ui.time.annualProduction', de: 'Jahresproduktion', en: 'Annual production' },

	// Temperature
	{ key: 'ui.temperature.comparedToHistorical', de: 'im Vergleich zum historischen Durchschnitt', en: 'compared to historical average' },
	{ key: 'ui.temperature.hottestDays', de: 'Heißeste Tage', en: 'Hottest days' },

	// Comparison
	{ key: 'ui.comparison.nationalAverage', de: 'Nationaler Durchschnitt', en: 'National average' },
	{ key: 'ui.comparison.showAllYears', de: 'Alle Jahre zeigen', en: 'Show all years' },

	// ========== Status Messages ==========
	{ key: 'status.loading', de: 'Lade Daten...', en: 'Loading data...' },
	{ key: 'status.loadingDetails', de: 'Lade Details...', en: 'Loading details...' },
	{ key: 'status.loadingEmissions', de: 'Lade Emissionsdaten...', en: 'Loading emissions data...' },
	{ key: 'status.noData', de: 'Keine Daten', en: 'No data' },
	{ key: 'status.noDataAvailable', de: 'Keine Daten verfügbar', en: 'No data available' },
	{ key: 'status.noDataForRegion', de: 'Keine Daten für diese Region verfügbar', en: 'No data available for this region' },
	{ key: 'status.noDataForYearCategory', de: 'Keine Daten für dieses Jahr und diese Kategorie verfügbar', en: 'No data available for this year and category' },
	{ key: 'status.error', de: 'Fehler beim Laden', en: 'Error loading' },
	{ key: 'status.errorOccurred', de: 'Ein Fehler ist aufgetreten', en: 'An error occurred' },
	{ key: 'status.errorLoadingData', de: 'Fehler beim Laden der Daten', en: 'Error loading data' },
	{ key: 'status.copied', de: 'Kopiert!', en: 'Copied!' },

	// ========== Action Labels ==========
	{ key: 'action.downloadData', de: 'Daten herunterladen', en: 'Download data' },
	{ key: 'action.shareImage', de: 'Als Bild teilen', en: 'Share as image' },
	{ key: 'action.copyCode', de: 'Code kopieren', en: 'Copy code' },
	{ key: 'action.embed', de: 'Einbetten', en: 'Embed' },
	{ key: 'action.close', de: 'Schließen', en: 'Close' },

	// ========== Domain: Sectors ==========
	{ key: 'domain.sector.energy', de: 'Energie', en: 'Energy' },
	{ key: 'domain.sector.industry', de: 'Industrie', en: 'Industry' },
	{ key: 'domain.sector.buildings', de: 'Gebäude', en: 'Buildings' },
	{ key: 'domain.sector.mobility', de: 'Verkehr', en: 'Transport' },
	{ key: 'domain.sector.agriculture', de: 'Landwirtschaft', en: 'Agriculture' },
	{ key: 'domain.sector.waste', de: 'Abfall', en: 'Waste' },
	{ key: 'domain.sector.wasteOther', de: 'Abfall und Sonstige', en: 'Waste and other' },
	{ key: 'domain.sector.wasteManagement', de: 'Abfallwirtschaft', en: 'Waste management' },
	{ key: 'domain.sector.fluorinatedGases', de: 'Fluorierte Gase', en: 'Fluorinated gases' },
	{ key: 'domain.sector.sectors', de: 'Sektoren', en: 'Sectors' },

	// ========== Domain: Transport ==========
	{ key: 'domain.transport.onFoot', de: 'Zu Fuß', en: 'On foot' },
	{ key: 'domain.transport.onFootShort', de: 'Fuß', en: 'Walk' },
	{ key: 'domain.transport.bicycle', de: 'Fahrrad', en: 'Bicycle' },
	{ key: 'domain.transport.bicycleShort', de: 'Rad', en: 'Bike' },
	{ key: 'domain.transport.eBike', de: 'E-Bike', en: 'E-Bike' },
	{ key: 'domain.transport.publicTransport', de: 'ÖPNV', en: 'Public transport' },
	{ key: 'domain.transport.publicTransportShort', de: 'ÖPNV', en: 'PT' },
	{ key: 'domain.transport.carDriver', de: 'Auto (Fahrer)', en: 'Car (driver)' },
	{ key: 'domain.transport.carDriverShort', de: 'Fahrer:in', en: 'Driver' },
	{ key: 'domain.transport.carPassenger', de: 'Auto (Mitfahrer)', en: 'Car (passenger)' },
	{ key: 'domain.transport.carPassengerShort', de: 'Mitfahrer:in', en: 'Passenger' },
	{ key: 'domain.transport.motorbike', de: 'Motorrad', en: 'Motorbike' },
	{ key: 'domain.transport.motorbikeShort', de: 'Krad', en: 'Bike' },
	{ key: 'domain.transport.sustainable', de: 'Umweltverbund', en: 'Sustainable' },
	{ key: 'domain.transport.motorized', de: 'Motorisiert', en: 'Motorized' },
	{ key: 'domain.transport.eCarShare', de: 'E-Auto Anteil', en: 'E-car share' },
	{ key: 'domain.transport.phevShare', de: 'Plug-In-Hybrid Anteil', en: 'PHEV share' },
	{ key: 'domain.transport.eMobilityShare', de: 'Anteil der Elektromobilität', en: 'Share of e-mobility' },
	{ key: 'domain.transport.publicTransportConnection', de: 'Anbindung an den öffentlichen Verkehr', en: 'Connection to public transport' },

	// Car density & area charts
	{ key: 'domain.transport.cars', de: 'Autos', en: 'Cars' },
	{ key: 'domain.transport.carsIn', de: 'Autos in', en: 'cars in' },
	{ key: 'domain.transport.carsTotal', de: 'Autos gesamt', en: 'Total cars' },
	{ key: 'domain.transport.residents', de: 'Einwohner:innen', en: 'residents' },
	{ key: 'domain.transport.privateCars', de: 'Privat-PKW', en: 'Private cars' },
	{ key: 'domain.transport.companyCars', de: 'Firmen-PKW', en: 'Company cars' },
	{ key: 'domain.transport.selectRegionDensity', de: 'Wähle eine Region auf der Karte, um mehr zur PKW-Dichte zu erfahren. Für manche Regionen sind aufgrund von Gemeindezusammenlegungen keine Daten verfügbar.', en: 'Select a region on the map to learn more about car density. For some regions, data is unavailable due to municipal mergers.' },
	{ key: 'domain.transport.selectRegionArea', de: 'Wähle eine Region auf der Karte, um mehr zur Parkfläche zu erfahren.', en: 'Select a region on the map to learn more about parking area.' },
	{ key: 'domain.transport.footballPitches', de: 'Fußballfelder', en: 'football pitches' },
	{ key: 'domain.transport.footballPitch', de: 'Fußballfeld', en: 'football pitch' },
	{ key: 'domain.transport.pitch', de: 'Feld', en: 'pitch' },

	// ========== Domain: Energy ==========
	{ key: 'domain.energy.gas', de: 'Gasheizungen', en: 'Gas heating' },
	{ key: 'domain.energy.gasShort', de: 'Gas', en: 'Gas' },
	{ key: 'domain.energy.districtHeating', de: 'Fernwärme', en: 'District heating' },
	{ key: 'domain.energy.heatingOil', de: 'Heizöl', en: 'Heating oil' },
	{ key: 'domain.energy.oilHeating', de: 'Ölheizungen', en: 'Oil heating' },
	{ key: 'domain.energy.electricity', de: 'Strom', en: 'Electricity' },
	{ key: 'domain.energy.electricityHeating', de: 'Stromheizungen', en: 'Electric heating' },
	{ key: 'domain.energy.wood', de: 'Holz', en: 'Wood' },
	{ key: 'domain.energy.heatPump', de: 'Wärmepumpe', en: 'Heat pump' },
	{ key: 'domain.energy.heatPumps', de: 'Wärmepumpen', en: 'Heat pumps' },
	{ key: 'domain.energy.coal', de: 'Kohle', en: 'Coal' },
	{ key: 'domain.energy.oil', de: 'Öl', en: 'Oil' },
	{ key: 'domain.energy.naturalGas', de: 'Erdgas', en: 'Natural gas' },
	{ key: 'domain.energy.solar', de: 'Solar', en: 'Solar' },
	{ key: 'domain.energy.photovoltaic', de: 'Photovoltaik', en: 'Photovoltaic' },
	{ key: 'domain.energy.wind', de: 'Windkraft', en: 'Wind power' },
	{ key: 'domain.energy.windShort', de: 'Wind', en: 'Wind' },
	{ key: 'domain.energy.renewableShare', de: 'Erneuerbarer Anteil', en: 'Renewable share' },
	{ key: 'domain.energy.heatingType', de: 'Heizungen', en: 'Heating systems' },
	{ key: 'domain.energy.totalOfPower', de: 'der Gesamtleistung', en: 'of total power' },
	{ key: 'domain.energy.shareOfTotal', de: 'Anteil an Gesamt', en: 'Share of total' },

	// ========== Domain: Fuel Types ==========
	{ key: 'domain.fuel.petrol', de: 'Benzin', en: 'Petrol' },
	{ key: 'domain.fuel.diesel', de: 'Diesel', en: 'Diesel' },
	{ key: 'domain.fuel.electric', de: 'Elektro', en: 'Electric' },
	{ key: 'domain.fuel.hybrid', de: 'Hybrid', en: 'Hybrid' },

	// ========== Domain: Verbs (for dynamic text) ==========
	{ key: 'domain.verb.increased', de: 'stiegen', en: 'increased' },
	{ key: 'domain.verb.decreased', de: 'sanken', en: 'decreased' },
	{ key: 'domain.emissions.sectorIncreased', de: 'Im Sektor {sector} sind die Emissionen gestiegen.', en: 'In the {sector} sector, emissions rose.' },

	// ========== Domain: Emissions types ==========
	{ key: 'domain.emissions.consumptionBased', de: 'Konsumbasierte Emissionen', en: 'Consumption-based emissions' },
	{ key: 'domain.emissions.productionBased', de: 'Produktionsbasierte Emissionen', en: 'Production-based emissions' },
	{ key: 'domain.emissions.peakEmissions', de: 'Peak der Emissionen', en: 'Peak of emissions' },
	{ key: 'domain.emissions.historicalEmissions', de: 'Historische Emissionen', en: 'Historical emissions' },
	{ key: 'domain.emissions.totalEmissions', de: 'Gesamtemissionen', en: 'Total emissions' },

	// ========== Table Headers ==========
	{ key: 'table.year', de: 'Jahr', en: 'Year' },
	{ key: 'table.sector', de: 'Sektor', en: 'Sector' },
	{ key: 'table.value', de: 'Wert', en: 'Value' },
	{ key: 'table.share', de: 'Anteil', en: 'Share' },
	{ key: 'table.sharePercent', de: 'Anteil (%)', en: 'Share (%)' },
	{ key: 'table.total', de: 'Gesamt', en: 'Total' },
	{ key: 'table.count', de: 'Anzahl', en: 'Count' },
	{ key: 'table.category', de: 'Kategorie', en: 'Category' },
	{ key: 'table.energySource', de: 'Energieträger', en: 'Energy source' },
	{ key: 'table.region', de: 'Region', en: 'Region' },
	{ key: 'table.power', de: 'Leistung', en: 'Power' },
	{ key: 'table.sources', de: 'Quellen', en: 'Sources' },

	// ========== Units ==========
	{ key: 'unit.percent', de: 'Prozent', en: 'Percent' },
	{ key: 'unit.billionCubicMetersYear', de: 'Milliarden Kubikmeter/Jahr', en: 'Billion cubic meters/year' },
	{ key: 'unit.co2Tonnes2016', de: 'CO2 [t] im Jahr 2016', en: 'CO2 [t] in 2016' },

	// ========== Embed Options ==========
	{ key: 'ui.embedOption.historicDevelopment', de: 'Historische Entwicklung anzeigen', en: 'Show historical development' },
	{ key: 'ui.embedOption.yes', de: 'Ja', en: 'Yes' },
	{ key: 'ui.embedOption.no', de: 'Nein', en: 'No' },

	// ========== Illustration ==========
	{ key: 'ui.illustration.howWouldItBeBetter', de: 'Wie wär\'s besser?', en: 'How could it be better?' },

	// ========== Region Intro ==========
	{ key: 'ui.region.intro', de: 'Das Klimadashboard {regionName} zeigt die Auswirkungen der Klimakrise in deiner Region und begleitet die Umsetzung der Energie- und Mobilitätswende und weitere Klimaschutzmaßnahmen bei dir vor Ort.', en: 'The Klimadashboard {regionName} shows the effects of the climate crisis in your region and accompanies the implementation of the energy and mobility transition and other climate protection measures in your area.' },
	{ key: 'ui.region.exploreMap', de: 'Datenlandkarte erkunden', en: 'Explore data map' },
	{ key: 'ui.region.scrollForMore', de: 'Scrollen für mehr Daten', en: 'Scroll for more data' }
];

async function getExistingKeys() {
	try {
		const existingTranslations = await directus.request(
			readTranslations({
				fields: ['key', 'language'],
				limit: -1
			})
		);
		return new Set(existingTranslations.map((t) => `${t.key}:${t.language}`));
	} catch (error) {
		console.error('Error fetching existing translations:', error);
		return new Set();
	}
}

async function addTranslations() {
	console.log('Fetching existing translation keys...');
	const existingKeys = await getExistingKeys();
	console.log(`Found ${existingKeys.size / 2} existing keys`);

	const newTranslations = [];

	for (const { key, de, en } of translations) {
		if (!existingKeys.has(`${key}:de-DE`)) {
			newTranslations.push({ key, language: 'de-DE', value: de });
		}
		if (!existingKeys.has(`${key}:en-US`)) {
			newTranslations.push({ key, language: 'en-US', value: en });
		}
	}

	if (newTranslations.length === 0) {
		console.log('All translation keys already exist. Nothing to add.');
		return;
	}

	console.log(`Adding ${newTranslations.length} new translations...`);

	try {
		// Add in batches of 100 to avoid timeouts
		const batchSize = 100;
		for (let i = 0; i < newTranslations.length; i += batchSize) {
			const batch = newTranslations.slice(i, i + batchSize);
			await directus.request(createTranslations(batch));
			console.log(`Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newTranslations.length / batchSize)}`);
		}

		console.log('Successfully added all translations!');
	} catch (error) {
		console.error('Error adding translations:', error);
		process.exit(1);
	}
}

// Run the script
addTranslations();
