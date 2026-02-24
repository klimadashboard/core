/** @type {import('./$types').PageServerLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { getChartSnapshots } from '$lib/utils/chartDataService';

export async function load({ fetch, params, url, parent }) {
	const directus = getDirectusInstance(fetch);
	const lang = params.lang || 'de';

	try {
		const page = await directus.request(
			readItem('charts', params.id, {
				fields: [
					'id',
					'date_updated',
					'translations.title',
					'translations.heading',
					'translations.text',
					'translations.source',
					'translations.methods',
					'translations.seo.*'
				],
				deep: {
					translations: {
						_filter: {
							languages_code: {
								_eq: lang
							}
						}
					}
				}
			})
		);

		const translation = page.translations[0];
		const descriptionRaw = translation.text || translation.heading || '';
		const description = descriptionRaw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

		// SSR chart snapshot (region from query param if present)
		const regionId = url.searchParams.get('region') || null;
		const snapshots = await getChartSnapshots([params.id], regionId, [], lang, fetch);
		const chartSnapshot = snapshots[params.id] || null;

		return {
			page: page,
			content: {
				title: chartSnapshot?.title || translation.title,
				description: chartSnapshot?.text?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || description,
				seo: translation.seo || null
			},
			id: page.id,
			date_updated: page.date_updated,
			chartSnapshot
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
