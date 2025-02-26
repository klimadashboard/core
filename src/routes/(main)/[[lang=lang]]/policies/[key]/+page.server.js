/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import dayjs from 'dayjs';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const attribute = await directus.request(
			readItem('policies_attributes', params.key, {
				fields: ['*', 'translations.*'],
				deep: {
					translations: {
						_filter: {
							languages_code: {
								_eq: params.lang || 'de'
							}
						}
					}
				}
			})
		);

		const policies = await directus.request(
			readItems('policies', {
				fields: [
					'*',
					'translations.*',
					'updates.*',
					'stakeholders.stakeholders_id.*',
					'updates.translations.*',
					'attributes.policies_attributes_key.*',
					'attributes.policies_attributes_key.translations.*'
				],
				deep: { translations: { _filter: { languages_code: { _eq: params.lang || 'de' } } } },
				filter: {
					attributes: {
						_some: {
							policies_attributes_key: {
								key: {
									_eq: attribute.key
								}
							}
						}
					}
				}
			})
		);

		const content = {
			title: attribute.translations[0].title,
			description: attribute.translations[0].description
		};
		return {
			attribute,
			policies,
			content
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
