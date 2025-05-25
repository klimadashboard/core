/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			regions: await directus.request(
				readItems('regions', {
					fields: ['id', 'name', 'center', 'layer', 'layer_label', 'population', 'area'],
					filter: {
						country: {
							_eq: PUBLIC_VERSION.toUpperCase()
						}
					},
					limit: -1
				})
			)
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
