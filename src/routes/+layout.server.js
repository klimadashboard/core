import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem, readTranslations } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

// src/routes/+layout.server.js
export async function load({ fetch, params }) {
	const locale = params.lang ? params.lang : 'de';

	const localeLong = locale == 'de' ? 'de-DE' : 'en-US';
	const directus = getDirectusInstance(fetch);

	const site = await directus.request(
		readItem('sites', PUBLIC_VERSION, {
			deep: {
				translations: {
					filter: {
						languages_code: {
							_eq: locale
						}
					}
				}
			},
			fields: [
				'*', // Include all fields from the 'sites' table
				'translations.*' // Load all translation fields
			]
		})
	);

	const translationsData = await directus.request(
		readTranslations({
			filter: {
				language: localeLong
			}
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
}
