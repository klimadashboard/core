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
					_and: [
						{
							site: {
								_eq: PUBLIC_VERSION
							}
						},
						{
							status: {
								_eq: 'published'
							}
						}
					]
				},
				fields: ['id', 'translations.slug']
			})
		);

		console.log(pages);

		const charts = await directus.request(
			readItems('charts', {
				filter: {
					_and: [
						{
							site: {
								_eq: PUBLIC_VERSION
							}
						},
						{
							status: {
								_eq: 'published'
							}
						}
					]
				}
			})
		);

		let companies;

		if (PUBLIC_VERSION == 'at') {
			companies = await directus.request(
				readItems('companies', {
					filter: {
						_and: [
							{
								status: {
									_eq: 'published'
								}
							}
						]
					}
				})
			);
		} else {
			companies = [];
		}

		console.log(url);

		// Generate URLs
		const urls = [
			...pages
				.map((page) => page.translations.map((t) => `${currentUrl}/${t.slug.replace('home', '')}`))
				.flat(),
			...charts.map((chart) => `${currentUrl}/charts/${chart.id}`),
			...companies.map((company) => `${currentUrl}/companies/${company.id}`)
		];

		// Generate XML content
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${urls
							.map(
								(url) => `
                <url>
                    <loc>${url}</loc>
                    <changefreq>weekly</changefreq>
                    <priority>0.8</priority>
                </url>
            `
							)
							.join('\n')}
        </urlset>`;

		// Return XML response
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
