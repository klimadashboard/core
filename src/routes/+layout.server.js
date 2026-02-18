import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem, readTranslations } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { error } from '@sveltejs/kit';

// ---------------------------------------------------------------------------
// In-memory TTL cache for layout data (sites, translations, languages).
// This data changes very rarely but is fetched on every single page load.
// ---------------------------------------------------------------------------
const layoutCache = new Map();
const LAYOUT_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key, fetcher) {
	const entry = layoutCache.get(key);
	if (entry && Date.now() < entry.expires) return entry.data;
	const data = fetcher().catch((err) => {
		layoutCache.delete(key); // Don't cache errors
		throw err;
	});
	layoutCache.set(key, { data, expires: Date.now() + LAYOUT_TTL });
	return data;
}

// src/routes/+layout.server.js
export async function load({ fetch, params }) {
	try {
		const locale = params.lang ? params.lang : 'de';

		const localeLong = locale == 'de' ? 'de-DE' : 'en-US';
		const directus = getDirectusInstance(fetch);

		const response = await getCached(`site-${locale}`, () =>
			directus.request(
				readItem('sites', PUBLIC_VERSION, {
					deep: {
						translations: {
							_filter: {
								languages_code: {
									_eq: locale
								}
							}
						}
					},
					fields: [
						'*', // Include all fields from the 'sites' table
						'translations.*',
						'translations.seo.*' // Load all translation fields
					]
				})
			)
		);

		const site = {
			...response,
			content: response.translations[0]
		};

		const translations = await getCached(`translations-${localeLong}`, async () => {
			const translationsData = await directus.request(
				readTranslations({
					filter: {
						language: localeLong
					},
					limit: -1
				})
			);
			return translationsData.reduce((acc, { key, value }) => {
				acc[key] = value;
				return acc;
			}, {});
		});

		const languages = await getCached('languages', () =>
			directus.request(readItems('languages'))
		);

		return {
			site,
			translations,
			language: {
				code: locale,
				codeLong: localeLong
			},
			languages
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
