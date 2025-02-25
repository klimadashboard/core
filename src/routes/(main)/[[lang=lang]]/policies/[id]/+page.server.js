/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import dayjs from 'dayjs';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	try {
		const policy = await directus.request(
			readItem('policies', params.id, {
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
			title: policy.translations[0].title,
			eyebrow: 'Policy'
		};
		return {
			policy: await resolvePlaceholders(policy, params.lang || 'de'),
			content
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
