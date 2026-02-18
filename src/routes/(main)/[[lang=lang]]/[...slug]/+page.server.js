/** @type {import('./$types').PageServerLoad} */
import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';
import { getChartSnapshots } from '$lib/utils/chartDataService';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import 'dayjs/locale/en';

/** Extract chart IDs from a blocks array (handles nested block_grid) */
function extractChartIds(blocks) {
	const ids = [];
	for (const block of blocks || []) {
		if (block.collection === 'block_chart' && block.item?.charts) {
			for (const c of block.item.charts) {
				if (c.chart) ids.push(c.chart);
			}
		} else if (block.collection === 'block_grid' && block.item?.blocks) {
			ids.push(...extractChartIds(block.item.blocks));
		}
	}
	return ids;
}

function filterTranslations(data, language) {
	// If data is an array, process each element.
	if (Array.isArray(data)) {
		return data.map((item) => filterTranslations(item, language));
	}
	// If data is an object, process its keys.
	else if (data && typeof data === 'object') {
		const result = {};
		for (const key in data) {
			if (key === 'translations' && Array.isArray(data[key])) {
				// Find the translation matching the target language.
				const selected = data[key].find((item) => item.languages_code === language);
				if (selected) {
					// Recursively filter the selected translation as well.
					const filteredTranslation = filterTranslations(selected, language);
					// Merge the translation fields into the current object.
					Object.assign(result, filteredTranslation);
				}
				// Do not include the original "translations" key.
			} else {
				// For all other keys, process them recursively.
				result[key] = filterTranslations(data[key], language);
			}
		}
		return result;
	}
	// For primitives, return the value directly.
	else {
		return data;
	}
}

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	if (params.lang == 'de') {
		redirect(308, '/' + params.slug);
	}

	const language = params.lang || 'de';
	const slug = params.slug || 'home';
	const site = PUBLIC_VERSION;
	dayjs.locale(language);

	try {
		const slugs = await directus.request(
			readItems('pages', {
				filter: {
					site: { _eq: site },
					translations: { slug: { _eq: slug } }
				},
				fields: ['translations.slug', 'translations.languages_code']
			})
		);

		// ---------- Fetch the page + expansions ----------
		const pages = await directus.request(
			readItems('pages', {
				filter: {
					_and: [
						{ status: { _eq: 'published' } },
						{ site: { _eq: site } },
						{
							translations: {
								slug: { _eq: slug },
								languages_code: { _eq: language }
							}
						}
					]
				},
				limit: 1,

				// ============ FIELDS (with polymorphic alias expansions) ============
				fields: [
					'id',
					'date_updated',

					// Page translations (only the current language via "deep")
					'translations.*',

					// Page->blocks pivot
					'blocks.*',

					// For each possible block type with translations...
					'blocks.item:block_panel.*',
					'blocks.item:block_panel.translations.*',
					'blocks.item:block_teaser.*',
					'blocks.item:block_teaser.translations.*',
					'blocks.item:block_richtext.*',
					'blocks.item:block_richtext.translations.*',
					'blocks.item:block_items.*',
					'blocks.item:block_items.translations.*',
					'blocks.item:block_donation.*',
					'blocks.item:block_donation.translations.*',
					'blocks.item:block_toggle.*',
					'blocks.item:block_toggle.translations.*',

					// For block types WITHOUT translations...
					'blocks.item:block_news.*',
					'blocks.item:block_chart.*',
					'blocks.item:block_chart.charts.chart',
					'blocks.item:block_quiz.*',

					// ========== The block_grid itself ==========
					'blocks.item:block_grid.*',
					// Expand block_grid.blocks pivot
					'blocks.item:block_grid.blocks.*',

					// Now expand the nested block_grid.blocks.item by type:
					'blocks.item:block_grid.blocks.item:block_panel.*',
					'blocks.item:block_grid.blocks.item:block_panel.translations.*',
					'blocks.item:block_grid.blocks.item:block_teaser.*',
					'blocks.item:block_grid.blocks.item:block_teaser.translations.*',
					'blocks.item:block_grid.blocks.item:block_richtext.*',
					'blocks.item:block_grid.blocks.item:block_richtext.translations.*',
					'blocks.item:block_grid.blocks.item:block_items.*',
					'blocks.item:block_grid.blocks.item:block_items.translations.*',
					'blocks.item:block_grid.blocks.item:block_donation.*',
					'blocks.item:block_grid.blocks.item:block_donation.translations.*',

					// Non-translated block types inside grid
					'blocks.item:block_grid.blocks.item:block_news.*',
					'blocks.item:block_grid.blocks.item:block_chart.*',
					'blocks.item:block_grid.blocks.item:block_quiz.*',
					'blocks.item:block_grid.blocks.item:block_grid.*'
					// ^ if you allow nested grids, you'd keep going or do recursion.
				]
			})
		);

		if (!pages || pages.length === 0) {
			// Check if the slug exists in any other language first
			if (slugs.length > 0) {
				const translatedPage = slugs[0].translations.find((t) => t.languages_code == language);
				if (translatedPage) {
					redirect(308, `/${translatedPage.languages_code}/${translatedPage.slug}`);
				}
			}

			//Check if slug matches a region
			const regionMatch = await directus.request(
				readItems('regions', {
					filter: {
						slug: { _eq: slug }
					},
					fields: ['id'],
					limit: 1
				})
			);

			if (regionMatch && regionMatch.length > 0) {
				const regionId = regionMatch[0].id;
				redirect(308, `/regions/${regionId}`);
			}

			throw error(404, 'Page not found');
		}

		const page = pages[0];

		const translatedPage = filterTranslations(page, language);

		// Optionally resolve placeholders in the page's own translation
		const content = await resolvePlaceholders(translatedPage, language);

		const blocks = content.blocks;

		// SSR chart snapshots for any chart blocks on this page
		const chartIds = extractChartIds(blocks);
		const chartSnapshots = chartIds.length > 0
			? await getChartSnapshots(chartIds, null, [], language, fetch)
			: {};

		return {
			page: {
				id: page.id,
				date_updated: page.date_updated,
				blocks: blocks,
				slugs: slugs[0].translations
			},
			content,
			chartSnapshots
		};
	} catch (err) {
		if (err && 'location' in err) {
			throw err;
		}
		throw error(404, 'Page not found');
	}
}
