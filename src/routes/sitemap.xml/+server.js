import { PUBLIC_VERSION } from '$env/static/public';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	try {
		const directus = getDirectusInstance();
		const currentUrl = url.href.replace('/sitemap.xml', '');

		const pages = await directus.request(
			readItems('pages', {
				filter: {
					_and: [{ site: { _eq: PUBLIC_VERSION } }, { status: { _eq: 'published' } }]
				},
				fields: ['id', 'translations.slug', 'translations.languages_code']
			})
		);

		const charts = await directus.request(
			readItems('charts', {
				filter: {
					_and: [{ site: { _eq: PUBLIC_VERSION } }, { status: { _eq: 'published' } }]
				}
			})
		);

		let companies = [],
			policies = [],
			policiesAttributes = [];

		if (PUBLIC_VERSION === 'at') {
			policies = await directus.request(
				readItems('policies', {
					filter: { status: { _neq: 'hidden' } }
				})
			);

			policiesAttributes = await directus.request(readItems('policies_attributes'));

			companies = await directus.request(
				readItems('companies', {
					filter: { status: { _eq: 'published' } }
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
			`${currentUrl}/regions`, // static regions overview route
			...pages.flatMap((page) =>
				page.translations.map(
					(t) =>
						`${currentUrl}/${(t.languages_code === 'de' ? '' : t.languages_code + '/') + t.slug.replace('home', '')}`
				)
			),
			...charts.map((chart) => `${currentUrl}/charts/${chart.id}`),
			...companies.map((company) => `${currentUrl}/companies/${company.id}`),
			...policies.map((policy) => `${currentUrl}/policies/${policy.id}`),
			...policiesAttributes.map((attr) => `${currentUrl}/policies/${attr.key}`),
			...regions.map((region) => `${currentUrl}/regions/${region.id}`)
		];

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
