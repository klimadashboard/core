import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem, readTranslations } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

// src/routes/+layout.server.js
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	const site = await directus.request(readItem('sites', PUBLIC_VERSION));
	const translationsData = await directus.request(
		readTranslations({
			filter: {
				language: 'de-DE'
			}
		})
	);
	const translations = translationsData.reduce((acc, { key, value }) => {
		acc[key] = value; // Add each key-value pair to the object
		return acc;
	}, {});
	return {
		site,
		translations
	};
}
