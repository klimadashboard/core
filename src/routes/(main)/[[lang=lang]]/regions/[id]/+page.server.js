/** @type {import('./$types').PageServerLoad} */
import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { getRegionConfigWithFallback } from '$lib/utils/getRegionConfig';
import { getChartSnapshots } from '$lib/utils/chartDataService';
import { buildRegionDescription, buildRegionIntro, buildRegionTitle } from '$lib/utils/regionSeo';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REGION_FIELDS = ['*', 'parents.id', 'parents.name', 'parents.layer', 'parents.layer_label'];

/** First (canonical) token of a comma-separated slug field. */
function canonicalSlug(slug) {
	if (!slug) return null;
	const first = String(slug).split(',')[0].trim();
	return first || null;
}

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

	// Language prefix for canonical redirects (default language `de` has no prefix).
	const parentData = await parent();
	const lang = parentData.language?.code || 'de';
	const langPrefix = lang === 'de' ? '' : `/${lang}`;

	try {
		const idParam = params.id;
		let page;

		if (UUID_RE.test(idParam)) {
			// Legacy UUID URL — load, then 301 to the readable slug if one exists.
			page = await directus.request(readItem('regions', idParam, { fields: REGION_FIELDS }));
			const slug = canonicalSlug(page?.slug);
			if (slug) throw redirect(301, `${langPrefix}/regions/${slug}`);
		} else {
			// Slug URL — exact match first (covers the single-value slugs),
			// then fall back to comma-separated aliases.
			const exact = await directus.request(
				readItems('regions', { filter: { slug: { _eq: idParam } }, fields: REGION_FIELDS, limit: 1 })
			);
			page = exact?.[0];
			if (!page) {
				const candidates = await directus.request(
					readItems('regions', {
						filter: { slug: { _contains: idParam } },
						fields: REGION_FIELDS,
						limit: 25
					})
				);
				page = (candidates || []).find((r) =>
					String(r.slug || '')
						.split(',')
						.map((s) => s.trim())
						.includes(idParam)
				);
			}
			if (!page) throw error(404, 'Page not found');

			// Hit an alias rather than the canonical slug → 301 to canonical.
			const canonical = canonicalSlug(page.slug);
			if (canonical && canonical !== idParam) {
				throw redirect(301, `${langPrefix}/regions/${canonical}`);
			}
		}

		const regionId = page.id;

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

		// Load region-specific config (walks up hierarchy to find config)
		const regionConfig = await getRegionConfigWithFallback(regionId, lang, fetch);

		// Get cached chart snapshots (resolved titles, descriptions, text)
		const chartIds = (regionConfig.sections || [])
			.flatMap((s) => s.charts || [])
			.map((c) => c.id)
			.filter(Boolean);

		const snapshotParentIds = (page.parents || []).map((p) => p.id).filter(Boolean);
		const chartSnapshots = await getChartSnapshots(chartIds, regionId, snapshotParentIds, lang, fetch, { textOnly: true });

		// Per-region SEO text (unique title / meta description / intro paragraph),
		// composed from region fields + available data categories — no extra fetch.
		const sections = regionConfig.sections || [];
		const metaDescription = buildRegionDescription(page, sections, lang);
		const metaTitle = buildRegionTitle(page, lang);
		const seoIntro = buildRegionIntro(page, sections, lang);

		return {
			page,
			regionConfig,
			chartSnapshots,
			content: {
				title: page.name,
				metaTitle,
				description: metaDescription,
				seoIntro
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
