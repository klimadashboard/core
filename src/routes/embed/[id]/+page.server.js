import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import { getChartSnapshots } from '$lib/utils/chartDataService';

export async function load({ fetch, params, url }) {
	const directus = getDirectusInstance(fetch);

	try {
		// Check if the ID exists in the charts collection
		const chart = await directus.request(readItem('charts', params.id));

		// SSR chart snapshot (region from query param if present)
		const regionId = url.searchParams.get('region') || null;
		const lang = url.searchParams.get('lang') || 'de';
		const snapshots = await getChartSnapshots([params.id], regionId, [], lang, fetch);

		return {
			id: params.id,
			chartSnapshot: snapshots[params.id] || null
		};
	} catch (err) {
		// On rate-limit or backend error, don't attempt a second Directus request
		const status = err?.response?.status ?? err?.status;
		if (status === 429) throw error(503, 'Too many requests to data backend — please try again shortly');
		if (status >= 500) throw error(503, 'Data backend unavailable — please try again shortly');

		// If not found, check for an entry where old_id matches
		try {
			const oldChart = await directus.request(
				readItems('charts', {
					filter: { id_old: { _eq: params.id } },
					limit: 1
				})
			);
			if (oldChart.length > 0) {
				throw redirect(308, `/embed/${oldChart[0].id}`);
			}
		} catch (innerErr) {
			if (innerErr && 'location' in innerErr) throw innerErr;
		}
	}

	throw error(404, 'Chart not found');
}
