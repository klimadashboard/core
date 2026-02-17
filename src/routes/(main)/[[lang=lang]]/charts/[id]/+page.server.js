/** @type {import('./$types').PageServerLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

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
								_eq: params.lang || 'de'
							}
						}
					}
				}
			})
		);

		const translation = page.translations[0];
		const descriptionRaw = translation.text || translation.heading || '';
		const description = descriptionRaw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

		return {
			page: page,
			content: {
				title: translation.title,
				description,
				seo: translation.seo || null
			},
			id: page.id,
			date_updated: page.date_updated
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
