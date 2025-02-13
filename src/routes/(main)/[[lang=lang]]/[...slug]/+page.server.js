/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

// We'll use a small helper to flatten translations recursively.
function flattenBlockPivot(pivot, language) {
	// pivot = { id, collection, item, sort, ... }
	const item = pivot?.item;
	if (!item) return;

	// 1) If there's a translations array, merge [0] into top-level fields
	if (Array.isArray(item.translations) && item.translations.length > 0) {
		const t = item.translations.find((d) => d.language_code == language);
		// Overwrite or add fields from `t`:
		Object.assign(item, t);
		// Remove the translations array to keep things clean:
		delete item.translations;
	}

	// 2) If this pivot is a block_grid, flatten its nested blocks
	//    so we handle any child blocks similarly:
	if (pivot.collection === 'block_grid' && Array.isArray(item.blocks)) {
		item.blocks.forEach((nestedPivot) => {
			flattenBlockPivot(nestedPivot);
		});
	}
}

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	const language = params.lang || 'de';
	const slug = params.slug || 'home';
	const site = PUBLIC_VERSION;

	console.log(language);

	try {
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
				],

				// ============ DEEP FILTERS ============
				deep: {
					// Filter page translations by language
					translations: {
						_filter: {
							languages_code: { _eq: language }
						}
					},
					'blocks.item:block_richtext.translations': {
						_filter: { languages_code: { _eq: language } }
					}
				}
			})
		);

		// console.log(JSON.stringify(pages));

		if (!pages || pages.length === 0) {
			throw error(404, 'Page not found');
		}

		const page = pages[0];

		// Typically only 1 translation thanks to our filter
		const translation = page.translations?.[0] ?? null;

		// Optionally resolve placeholders in the page's own translation
		const content = translation ? await resolvePlaceholders(translation, language) : null;

		// Now flatten all block items so that any translated fields
		// are merged into the top-level block fields
		page.blocks?.forEach((pivot) => flattenBlockPivot(pivot, language));

		const blocks = await resolvePlaceholders(page.blocks, language);

		return {
			page: {
				id: page.id,
				date_updated: page.date_updated,
				blocks: blocks
			},
			content
		};
	} catch (err) {
		console.error(err);
		throw error(404, 'Page not found');
	}
}
