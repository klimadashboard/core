/** @type {import('./$types').PageServerLoad} */
import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { getRegionConfigWithFallback } from '$lib/utils/getRegionConfig';

const BOT_UA_RE =
	/bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|applebot|semrush|ahref|mj12bot|petalbot|gptbot|chatgpt|perplexity|anthropic|claude/i;

export async function load({ fetch, params, url, parent, request }) {
	const directus = getDirectusInstance(fetch);

	const ua = request.headers.get('user-agent') || '';
	const isBot = BOT_UA_RE.test(ua);

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

		// Batch-fetch chart metadata for SSR content
		const chartIds = (regionConfig.sections || [])
			.flatMap((s) => s.charts || [])
			.map((c) => c.id)
			.filter(Boolean);

		let chartsContent = {};
		if (chartIds.length > 0) {
			try {
				const charts = await directus.request(
					readItems('charts', {
						filter: { id: { _in: chartIds } },
						fields: ['id', 'translations.*'],
						deep: {
							translations: {
								_filter: { languages_code: { _eq: lang } }
							}
						},
						limit: -1
					})
				);
				chartsContent = Object.fromEntries(
					charts.map((c) => {
						const t = c.translations?.[0] || {};
						return [c.id, { title: t.title, heading: t.heading, text: t.text, methods: t.methods, source: t.source }];
					})
				);
			} catch (e) {
				// Non-critical: page works without chart metadata
				console.warn('Failed to fetch chart metadata for SSR:', e?.message || e);
			}
		}

		return {
			page,
			regionConfig,
			chartsContent,
			isBot,
			content: {
				title: page.name
			}
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
