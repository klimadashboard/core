import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		// Check if the ID exists in the charts collection
		const cars = await directus.request(
			readItems('mobility_cars', {
				limit: -1,
				filter: {
					_and: [
						{
							country: {
								_eq: PUBLIC_VERSION.toUpperCase()
							}
						},
						{
							category: {
								_in: ['Insgesamt', 'Elektro', 'Gesamt']
							}
						},
						{
							period: {
								_eq: '2024'
							}
						}
					]
				}
			})
		);

		const regions = await directus.request(
			readItems('regions', {
				limit: -1,
				filter: {
					country: {
						_eq: PUBLIC_VERSION.toUpperCase()
					},
					layer: {
						_eq: 'district'
					}
				}
			})
		);
		return { cars, regions };
	} catch (err) {
		const status = err?.response?.status ?? err?.status;
		if (status === 429) throw error(503, 'Too many requests to data backend — please try again shortly');
		if (status >= 500) throw error(503, 'Data backend unavailable — please try again shortly');
		console.error('[embed electric-cars load]', err);
	}

	throw error(404, 'Page not found');
}
