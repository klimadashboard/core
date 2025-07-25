/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
export async function load({ fetch, params }) {
	try {
		const directus = getDirectusInstance(fetch);
		const regions = await directus.request(
			readItems('regions', {
				fields: [
					'id',
					'name',
					'code',
					'center',
					'layer',
					'layer_label',
					'population',
					'area',
					'parents'
				],
				filter: {
					_and: [
						{
							country: {
								_eq: PUBLIC_VERSION.toUpperCase()
							}
						},
						{
							layer: {
								_neq: 'country'
							}
						},
						{
							visible: {
								_eq: true
							}
						}
					]
				},
				limit: -1
			})
		);

		return {
			content: {
				title: 'Regionen'
			},
			regions
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
