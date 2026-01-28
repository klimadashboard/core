/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';
import { readItems } from '@directus/sdk';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		return {
			charts: await directus.request(
				readItems('charts', {
					fields: ['id', 'translations.title'],
					filter: {
						_and: [
							{
								status: {
									_eq: 'published'
								},
								site: {
									_eq: PUBLIC_VERSION
								}
							}
						]
					}
				})
			)
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
