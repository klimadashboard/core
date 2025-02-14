/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const page = await directus.request(
			readItem('charts', params.id, {
				fields: ['id', 'translations.title'],
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
		return {
			page: page,
			content: {
				title: page.translations[0].title
			},
			id: page.id
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
