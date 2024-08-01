/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			page: await directus.request(readItem('regions', params.id))
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
