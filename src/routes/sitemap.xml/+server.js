import { PUBLIC_VERSION } from '$env/static/public';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { json } from '@sveltejs/kit';

function formatDate(dateStr) {
	if (!dateStr) return null;
	try {
		return new Date(dateStr).toISOString().split('T')[0];
	} catch {
		return null;
	}
}

export const GET = async ({ url }) => {
	try {
		const directus = getDirectusInstance();
		const currentUrl = url.href.replace('/sitemap.xml', '');

		const pages = await directus.request(
			readItems('pages', {
				filter: {
					_and: [{ site: { _eq: PUBLIC_VERSION } }, { status: { _eq: 'published' } }]
				},
				fields: ['id', 'date_updated', 'translations.slug', 'translations.languages_code']
			})
		);

		const charts = await directus.request(
			readItems('charts', {
				filter: {
					_and: [{ site: { _eq: PUBLIC_VERSION } }, { status: { _eq: 'published' } }]
				},
				fields: ['id', 'date_updated']
			})
		);

		let companies = [],
			policies = [],
			policiesAttributes = [];

		if (PUBLIC_VERSION === 'at') {
			policies = await directus.request(
				readItems('policies', {
					filter: { status: { _neq: 'hidden' } },
					fields: ['id', 'date_updated']
				})
			);

			policiesAttributes = await directus.request(
				readItems('policies_attributes', {
					fields: ['key', 'date_updated']
				})
			);

			companies = await directus.request(
				readItems('companies', {
					filter: { status: { _eq: 'published' } },
					fields: ['id', 'date_updated']
				})
			);
		}

		const regions = await directus.request(
			readItems('regions', {
				filter: {
					_and: [{ visible: { _eq: true } }, { country: { _eq: PUBLIC_VERSION.toUpperCase() } }]
				},
				limit: -1,
				fields: ['id']
			})
		);

		const urls = [
			{ loc: currentUrl, priority: '1.0', changefreq: 'daily', lastmod: null },
			{ loc: `${currentUrl}/regions`, priority: '0.7', changefreq: 'weekly', lastmod: null },
			{ loc: `${currentUrl}/charts`, priority: '0.7', changefreq: 'weekly', lastmod: null },
			...pages.flatMap((page) =>
				page.translations.map((t) => ({
					loc: `${currentUrl}/${(t.languages_code === 'de' ? '' : t.languages_code + '/') + t.slug.replace('home', '')}`,
					priority: '0.8',
					changefreq: 'weekly',
					lastmod: formatDate(page.date_updated)
				}))
			),
			...charts.map((chart) => ({
				loc: `${currentUrl}/charts/${chart.id}`,
				priority: '0.6',
				changefreq: 'weekly',
				lastmod: formatDate(chart.date_updated)
			})),
			...companies.map((company) => ({
				loc: `${currentUrl}/companies/${company.id}`,
				priority: '0.5',
				changefreq: 'monthly',
				lastmod: formatDate(company.date_updated)
			})),
			...policies.map((policy) => ({
				loc: `${currentUrl}/policies/${policy.id}`,
				priority: '0.5',
				changefreq: 'monthly',
				lastmod: formatDate(policy.date_updated)
			})),
			...policiesAttributes.map((attr) => ({
				loc: `${currentUrl}/policies/${attr.key}`,
				priority: '0.4',
				changefreq: 'monthly',
				lastmod: formatDate(attr.date_updated)
			})),
			...regions.map((region) => ({
				loc: `${currentUrl}/regions/${region.id}`,
				priority: '0.5',
				changefreq: 'monthly',
				lastmod: null
			}))
		];

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml'
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		return json({ error: 'Failed to generate sitemap' }, { status: 500 });
	}
};
