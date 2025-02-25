/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import dayjs from 'dayjs';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const policies = await directus.request(
			readItems('policies', {
				fields: [
					'*',
					'translations.*',
					'updates.*',
					'stakeholders.stakeholders_id.*',
					'updates.translations.*'
				],
				deep: {
					translations: {
						_filter: {
							languages_code: {
								_eq: params.lang || 'de'
							}
						}
					},
					updates: {
						translations: {
							_filter: {
								languages_code: {
									_eq: params.lang || 'de'
								}
							}
						}
					}
				}
			})
		);

		const content = {
			title: 'Maßnahmen'
		};
		return {
			policies,
			content
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
