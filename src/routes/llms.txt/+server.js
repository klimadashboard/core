import { PUBLIC_VERSION } from '$env/static/public';

const descriptions = {
	de: 'Germany',
	at: 'Austria',
	org: 'Klimadashboard Organisation'
};

export function GET({ url }) {
	const domain = `klimadashboard.${PUBLIC_VERSION}`;
	const audience = descriptions[PUBLIC_VERSION] || 'international audiences';

	const body = `# Klimadashboard

> ${domain} is an open-source climate dashboard providing up-to-date climate and energy data for ${audience}.

## About

Klimadashboard visualizes climate-relevant data including CO2 emissions, temperature trends, renewable energy adoption, electric vehicle registrations, heating systems, modal split, and more. Data is sourced from official government agencies and research institutions.

All charts and data are licensed under CC-BY 4.0. The project is maintained by a non-profit organization.

## Key Pages

- Homepage: ${url.origin}/
- All Charts: ${url.origin}/charts
- Regional Dashboards: ${url.origin}/regions
- About / Organization: ${url.origin}/org

## Data Access

- Each chart card offers CSV and JSON data export via the download button
- The sitemap at ${url.origin}/sitemap.xml lists all available pages and charts
- Charts are available as individual pages at ${url.origin}/charts/{id}
- Chart detail pages include structured data (JSON-LD Dataset schema)

## Topics Covered

- Greenhouse gas emissions (CO2, CO2-equivalents, by sector)
- Renewable energy (solar, wind, hydro, by region)
- Electric mobility (registrations, charging infrastructure)
- Heating systems (by type and region)
- Carbon pricing (EU ETS)
- Temperature anomalies and climate trends
- Policy tracking and implementation status
- Company emissions tracking

## Contact

- Website: https://${domain}
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
