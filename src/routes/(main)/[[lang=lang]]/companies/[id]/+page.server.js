/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const company = await directus.request(
			readItem('companies', params.id, {
				fields: ['*.*']
			})
		);
		const chart = await directus.request(
			readItem('charts', 'b07da22c-e425-4259-8094-f85ddb46518a', {
				fields: ['id']
			})
		);
		const content = {
			title: company.name,
			heading: company.name
		};
		return {
			company,
			content,
			chart: {
				preset: company.id,
				...chart
			}
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
