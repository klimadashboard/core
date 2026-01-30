import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem, readTranslations } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { error } from '@sveltejs/kit';

// src/routes/+layout.server.js
export async function load({ fetch, params }) {
	try {
		const locale = params.lang ? params.lang : 'de';

		const localeLong = locale == 'de' ? 'de-DE' : 'en-US';
		const directus = getDirectusInstance(fetch);

		const response = await directus.request(
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
		);

		const site = {
			...response,
			content: response.translations[0]
		};

		const translationsData = await directus.request(
			readTranslations({
				filter: {
					language: localeLong
				},
				limit: -1
			})
		);
		const translations = translationsData.reduce((acc, { key, value }) => {
			acc[key] = value; // Add each key-value pair to the object
			return acc;
		}, {});

		const languages = await directus.request(readItems('languages'));
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
