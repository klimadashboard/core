import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		// Check if the ID exists in the charts collection
		const chart = await directus.request(readItem('charts', params.id));
		return {
			id: params.id
		};
	} catch (err) {
		console.log('chart not found, looking in new location');
		// If not found, check for an entry where old_id matches
		const oldChart = await directus.request(
			readItems('charts', {
				filter: { id_old: { _eq: params.id } },
				limit: 1
			})
		);

		if (oldChart.length > 0) {
			throw redirect(308, `/embed/${oldChart[0].id}`);
		}
	}

	throw error(404, 'Chart not found');
}
