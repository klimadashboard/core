/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);
	const lang = params.lang || 'de';

	try {
		// Fetch the attribute with its translations
		const attributeRaw = await directus.request(
			readItem('policies_attributes', params.key, {
				fields: ['*', 'translations.*'],
				deep: {
					translations: {
						_filter: {
							languages_code: {
								_eq: lang
							}
						}
					}
				}
			})
		);

		// Flatten `attribute`
		const attribute = {
			...attributeRaw,
			...(attributeRaw.translations?.[0] ?? {}) // Flatten translations[0]
		};
		delete attribute.translations; // Remove unused translations field

		// Fetch related policies
		const policiesRaw = await directus.request(
			readItems('policies', {
				fields: [
					'*',
					'translations.title',
					'updates.*',
					'updates.translations.*',
					'stakeholders.stakeholders_id.*',
					'attributes.policies_attributes_key.*',
					'attributes.policies_attributes_key.translations.*',
					'status.*',
					'status.translations.*'
				],
				filter: {
					_and: [
						{
							attributes: {
								_some: {
									policies_attributes_key: {
										key: {
											_eq: attribute.key
										}
									}
								}
							}
						},
						{
							status: {
								_neq: 'draft'
							}
						}
					]
				},
				deep: {
					translations: { _filter: { languages_code: { _eq: lang } } },
					updates: { translations: { _filter: { languages_code: { _eq: lang } } } },
					status: { translations: { _filter: { languages_code: { _eq: lang } } } }
				}
			})
		);

		// Flatten `policies`
		const policies = policiesRaw.map((policy) => {
			const flatPolicy = {
				...policy,
				...policy.translations?.[0], // Flatten translations[0]
				updates: policy.updates?.map((update) => ({
					...update,
					...update.translations?.[0] // Flatten translations[0] for updates
				})),
				attributes: policy.attributes?.map((attr) => ({
					...attr.policies_attributes_key,
					...attr.policies_attributes_key?.translations?.[0] // Flatten translations[0] for attributes
				})),
				status: policy.status ? { ...policy.status, ...policy.status.translations?.[0] } : null
			};

			// Cleanup unused translation fields
			delete flatPolicy.translations;
			flatPolicy.updates?.forEach((update) => delete update.translations);
			flatPolicy.attributes?.forEach((attr) => delete attr.translations);
			if (flatPolicy.status) delete flatPolicy.status.translations;

			return flatPolicy;
		});

		// Create content object from attribute translations
		const content = {
			title: attribute.title,
			description: attribute.description,
			eyebrow: 'Tracker'
		};

		return {
			attribute,
			policies: await Promise.all(policies.map((policy) => resolvePlaceholders(policy, lang))),
			content
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
