import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

// src/routes/+layout.server.js
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);
	const lang = params.lang || 'de';

	const statusRaw = await directus.request(
		readItems('policies_status', {
			deep: {
				translations: {
					_filter: {
						languages_code: {
							_eq: lang
						}
					}
				}
			},
			sort: ['sort'],
			fields: [
				'*', // Include all fields
				'translations.*'
			]
		})
	);

	const attributesRaw = await directus.request(
		readItems('policies_attributes', {
			deep: {
				translations: {
					_filter: {
						languages_code: {
							_eq: lang
						}
					}
				}
			},
			fields: [
				'*', // Include all fields
				'translations.*'
			]
		})
	);

	// Flatten `status`
	const status = statusRaw.map((item) => {
		const flatItem = {
			...item,
			...(item.translations?.[0] ?? {}) // Flatten translations[0]
		};
		delete flatItem.translations; // Remove original translations field
		return flatItem;
	});

	// Flatten `attributes`
	const attributes = attributesRaw.map((item) => {
		const flatItem = {
			...item,
			...(item.translations?.[0] ?? {}) // Flatten translations[0]
		};
		delete flatItem.translations; // Remove original translations field
		return flatItem;
	});

	return {
		status,
		attributes
	};
}
