import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		// Check if the ID exists in the charts collection
		const rawRegion = await directus.request(readItem('regions', params.id));
		const region = {
			...rawRegion,
			code: rawRegion.code_short ? rawRegion.code_short : rawRegion.code
		};
		const regions = await directus.request(
			readItems('regions', {
				filter: {
					country: {
						_eq: region.country
					}
				}
			})
		);

		return {
			region,
			regions
		};
	} catch (err) {
		const status = err?.response?.status ?? err?.status;
		if (status === 429) throw error(503, 'Too many requests to data backend — please try again shortly');
		if (status >= 500) throw error(503, 'Data backend unavailable — please try again shortly');
		console.error('[embed renewable-regions load]', err);
	}

	throw error(404, 'Chart not found');
}
