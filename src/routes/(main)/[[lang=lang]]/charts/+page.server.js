/** @type {import('./$types').PageServerLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';
import { readItems } from '@directus/sdk';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const charts = await directus.request(
			readItems('charts', {
				fields: [
					'id',
					'date_updated',
					'translations.title',
					'translations.heading'
				],
				filter: {
					_and: [
						{
							status: { _eq: 'published' },
							site: { _eq: PUBLIC_VERSION }
						}
					]
				},
				deep: {
					translations: {
						_filter: {
							languages_code: { _eq: params.lang || 'de' }
						}
					}
				},
				sort: ['-date_updated']
			})
		);

		return {
			charts,
			content: {
				title: 'Charts'
			}
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
