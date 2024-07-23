/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const pages = await directus.request(
			readItems('pages', {
				filter: {
					slug: {
						_eq: params.slug
					}
				},
				fields: [
					'*',
					{
						blocks: [
							'*',
							{
								item: {
									block_toggle: ['*'],
									charts: ['*'],
									block_richtext: ['*']
								}
							}
						]
					}
				],
				limit: 1
			})
		);

		const page = pages[0];
		return {
			page: page
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
