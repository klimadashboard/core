/** @type {import('./$types').PageServerLoad} */
import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { getRegionConfigWithFallback } from '$lib/utils/getRegionConfig';
import { getChartSnapshots } from '$lib/utils/chartDataService';

export async function load({ fetch, params, url, parent }) {
	const directus = getDirectusInstance(fetch);

	const host = url.hostname;
	const isProduction = ['klimadashboard.at', 'klimadashboard.de'].includes(host);
	const expectedHost =
		PUBLIC_VERSION.toLowerCase() === 'at' ? 'klimadashboard.at' : 'klimadashboard.de';

	if (isProduction && host !== expectedHost) {
		url.hostname = expectedHost;
		throw redirect(301, url.toString());
	}

	try {
		const page = await directus.request(
			readItem('regions', params.id, {
				fields: ['*', 'parents.id', 'parents.name', 'parents.layer', 'parents.layer_label']
			})
		);


		// Enrich parent regions with name and layer_label
		// (parents is a JSON field storing only {id, layer}, so we fetch full details)
		const parentIds = (page.parents || []).map((p) => p.id).filter(Boolean);
		if (parentIds.length > 0) {
			try {
				const parentDetails = await directus.request(
					readItems('regions', {
						filter: { id: { _in: parentIds } },
						fields: ['id', 'name', 'layer', 'layer_label']
					})
				);
				page.parents = page.parents.map((p) => {
					const details = parentDetails.find((d) => d.id === p.id);
					return {
						...p,
						name: details?.name || p.name,
						layer_label: details?.layer_label || p.layer_label
					};
				});
			} catch (e) {
				// Non-critical: continue with original parents if enrichment fails
				console.error('Failed to enrich parent regions:', e);
			}
		}

		// Get language from parent layout
		const parentData = await parent();
		const lang = parentData.language?.code || 'de';

		// Load region-specific config (walks up hierarchy to find config)
		const regionConfig = await getRegionConfigWithFallback(params.id, lang, fetch);

		// Get cached chart snapshots (resolved titles, descriptions, text)
		const chartIds = (regionConfig.sections || [])
			.flatMap((s) => s.charts || [])
			.map((c) => c.id)
			.filter(Boolean);

		const snapshotParentIds = (page.parents || []).map((p) => p.id).filter(Boolean);
		const chartSnapshots = await getChartSnapshots(chartIds, params.id, snapshotParentIds, lang, fetch, { textOnly: true });

		return {
			page,
			regionConfig,
			chartSnapshots,
			content: {
				title: page.name
			}
		};
	} catch (err) {
		if (err && 'location' in err) throw err;
		if (err?.status && err.status < 500) throw err;
		const status = err?.response?.status ?? err?.status;
		if (status === 429) throw error(503, 'Too many requests to data backend — please try again shortly');
		if (status >= 500) throw error(503, 'Data backend unavailable — please try again shortly');
		console.error('[regions load]', err);
		throw error(404, 'Page not found');
	}
}
