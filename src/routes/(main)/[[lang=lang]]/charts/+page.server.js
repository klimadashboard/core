/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			charts: await directus.request(
				readItems('charts', {
					fields: ['id', 'translations.title']
				})
			)
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
