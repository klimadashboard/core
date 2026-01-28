/**
 * Script to update chart info texts in Directus
 *
 * Usage:
 *   DIRECTUS_TOKEN=your_token node scripts/update-chart-text.js
 *
 * This script updates the text and methods fields for chart translations.
 * It finds the chart by custom_sveltestring and updates both DE and EN translations.
 */

import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk';

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/update-chart-text.js');
	process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// ============================================================
// CHART: emissionsRegion
// ============================================================

const CHART_SVELTESTRING = 'emissionsRegion';

const deText = `<p>Diese Visualisierung zeigt wahlweise den jährlichen Gesamtausstoß aller Treibhausgase in {{regionName}}{{#if hasParentState}} oder in {{stateName}}{{/if}}, aufgeschlüsselt nach Sektoren. {{firstYear}} lagen die Emissionen in {{regionName}} noch bei {{firstYearTotal}} Millionen Tonnen CO₂-Äquivalenten, {{lastYear}} bei {{lastYearTotal}} Millionen Tonnen. Das entspricht einer Reduktion um {{totalReduction}}%.</p>
{{#if hasClimateTargetStatic}}<p>{{regionName}} hat sich das Ziel gesetzt, bis {{climateTargetYear}} {{climateTargetValue}} zu erreichen. Dafür müssen die Emissionen im Vergleich zu {{firstYear}} um {{climateTargetReduction}}% gesenkt werden.</p>{{/if}}
<p><b>Sektoren und Pro-Kopf-Ansicht</b></p>
<p>Die Schaltfläche am unteren Rand der Visualisierung ermöglicht es dir außerdem, neben den Gesamtemissionen auch die Entwicklungen der einzelnen Sektoren über die Zeit genauer zu betrachten.</p>
<p>Über „Pro-Kopf-Emissionen" siehst du, wie hoch der durchschnittliche jährliche Treibhausgasausstoß pro Person in {{regionName}}{{#if hasParentState}} oder {{stateName}}{{/if}} ist. Beachte: Der individuelle Ausstoß variiert stark. Laut einer Oxfam-Untersuchung (2025) zu Klima und Ungleichheit verursachen die reichsten 1% weltweit 75,1 Tonnen pro Person und Jahr – neben Lebensstilfaktoren spielen dabei auch Investitionen in umweltschädliche Industrien eine Rolle.</p>`;

const deMethods = `{{#if isStuttgart}}<p><b>Methodik (Stuttgart)</b></p>
<p>Die Daten stammen vom Amt für Umweltschutz der Landeshauptstadt Stuttgart und werden jährlich aktualisiert. Dargestellt ist der jährliche Ausstoß aller Treibhausgase in CO₂-Äquivalenten (CO₂eq). Die Berechnung erfolgt nach dem BISKO-Standard. Nicht enthalten sind die Emissionen aus Landwirtschaft sowie dem Abfall- und Abwassersektor.</p>
<p>Hinweis: Seit 2022 wird der Treibhausgasausstoß des Sektors „Städtische Liegenschaften" in Stuttgart anders berechnet. Dieser methodische Bruch führte zu einer deutlichen Emissionsreduktion im Vergleich zu den Vorjahren. Seither werden der Ökostrom für die städtischen Liegenschaften und die Stuttgarter Straßenbahnen sowie der anteilige biogene Gasbezug von 35% im Erdgas für die städtischen Liegenschaften dem Sektor angerechnet.</p>{{/if}}
{{#if hasParentState}}<p><b>Methodik ({{stateName}})</b></p>
<p>Die Daten stammen von den Statistischen Ämtern des Bundes und der Länder und werden jährlich aktualisiert (Datenstand: 01.03.2025). Dargestellt ist der jährliche Ausstoß aller Treibhausgase in CO₂-Äquivalenten (CO₂eq). Der Arbeitskreis Umweltökonomische Gesamtrechnungen der Länder sammelt die Emissionsdaten der Bundesländer, vereinheitlicht sie und stellt sie nach den Sektoren des Klimaschutzgesetzes aufgeschlüsselt zur Verfügung. Da dieser Prozess zeitintensiv ist, liegen vergleichbare Daten derzeit nur bis {{lastYear}} vor.</p>{{/if}}`;

const enText = `<p>This visualization shows the annual total greenhouse gas emissions in {{regionName}}{{#if hasParentState}} or in {{stateName}}{{/if}}, broken down by sector. In {{firstYear}}, emissions in {{regionName}} were {{firstYearTotal}} million tonnes of CO₂ equivalents; by {{lastYear}}, they had fallen to {{lastYearTotal}} million tonnes. This corresponds to a reduction of {{totalReduction}}%.</p>
{{#if hasClimateTargetStatic}}<p>{{regionName}} has set the goal of reaching {{climateTargetValue}} by {{climateTargetYear}}. To achieve this, emissions must be reduced by {{climateTargetReduction}}% compared to {{firstYear}}.</p>{{/if}}
<p><b>Sectors and per capita view</b></p>
<p>The toggle at the bottom of the visualization also allows you to examine the trends of individual sectors over time, in addition to total emissions.</p>
<p>The "Per capita emissions" option shows the average annual greenhouse gas output per person in {{regionName}}{{#if hasParentState}} or {{stateName}}{{/if}}. Note: Individual emissions vary widely. According to an Oxfam study (2025) on climate and inequality, the richest 1% worldwide cause 75.1 tonnes per person per year – driven not only by lifestyle factors but also by investments in polluting industries.</p>`;

const enMethods = `{{#if isStuttgart}}<p><b>Methodology (Stuttgart)</b></p>
<p>The data comes from the Office for Environmental Protection of the City of Stuttgart and is updated annually. It shows the annual output of all greenhouse gases in CO₂ equivalents (CO₂eq). The calculation follows the BISKO standard. Emissions from agriculture and the waste and wastewater sector are not included.</p>
<p>Note: Since 2022, the greenhouse gas output of the "Municipal Properties" sector in Stuttgart has been calculated differently. This methodological change led to a significant emission reduction compared to previous years. Since then, green electricity for municipal properties and Stuttgart's trams, as well as the proportional biogenic gas share of 35% in natural gas for municipal properties, have been credited to this sector.</p>{{/if}}
{{#if hasParentState}}<p><b>Methodology ({{stateName}})</b></p>
<p>The data comes from the Federal and State Statistical Offices and is updated annually (data as of: 01.03.2025). It shows the annual output of all greenhouse gases in CO₂ equivalents (CO₂eq). The Working Group on Environmental Economic Accounts of the States collects emissions data from the federal states, standardizes it, and provides it broken down by the sectors defined in the Climate Protection Act. As this process is time-intensive, comparable data is currently only available up to {{lastYear}}.</p>{{/if}}`;

// ============================================================
// MAIN
// ============================================================

async function main() {
	console.log(`Looking for chart: ${CHART_SVELTESTRING}...`);

	// Find chart by custom_sveltestring
	const charts = await directus.request(
		readItems('charts', {
			filter: { custom_sveltestring: { _eq: CHART_SVELTESTRING } },
			fields: ['id', 'custom_sveltestring', 'translations.*']
		})
	);

	if (charts.length === 0) {
		console.error(`No chart found with custom_sveltestring="${CHART_SVELTESTRING}"`);
		process.exit(1);
	}

	// Use the chart that has a heading (the active one)
	const chart = charts.find((c) => c.translations?.some((t) => t.heading)) || charts[0];
	console.log(`Found chart: ${chart.id}`);
	console.log(`Translations: ${chart.translations.length}`);

	for (const translation of chart.translations) {
		const lang = translation.languages_code;
		console.log(`\nUpdating ${lang} translation (ID: ${translation.id})...`);

		let text, methods;
		if (lang === 'de' || lang === 'de-DE') {
			text = deText;
			methods = deMethods;
		} else if (lang === 'en' || lang === 'en-US') {
			text = enText;
			methods = enMethods;
		} else {
			console.log(`  Skipping unknown language: ${lang}`);
			continue;
		}

		try {
			await directus.request(
				updateItem('charts_translations', translation.id, { text, methods })
			);
			console.log(`  ✓ Updated ${lang} text and methods`);
		} catch (err) {
			console.error(`  ✗ Failed to update ${lang}:`, err.message || err);
		}
	}

	console.log('\nDone! Verify by refreshing a region page and clicking the Info tab.');
}

main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
