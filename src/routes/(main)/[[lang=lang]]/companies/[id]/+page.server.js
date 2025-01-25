/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			content: await directus.request(
				readItem('companies', params.id, {
					fields: ['*.*']
				})
			)
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
