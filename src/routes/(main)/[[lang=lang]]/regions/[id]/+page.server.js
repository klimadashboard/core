/** @type {import('./$types').PageServerLoad} */
import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
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

		if (!page.visible) {
			throw error(404, 'Page not found');
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

		const parentIds = (page.parents || []).map((p) => p.id).filter(Boolean);
		const chartSnapshots = await getChartSnapshots(chartIds, params.id, parentIds, lang, fetch);

		return {
			page,
			regionConfig,
			chartSnapshots,
			content: {
				title: page.name
			}
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
