/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params, parent }) {
	const directus = getDirectusInstance(fetch);
	const lang = params.lang || 'de';

	try {
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
					status: {
						_neq: 'hidden'
					}
				},
				deep: {
					translations: { _filter: { languages_code: { _eq: lang } } },
					updates: { translations: { _filter: { languages_code: { _eq: lang } } } },
					status: { translations: { _filter: { languages_code: { _eq: lang } } } }
				}
			})
		);

		// Flatten structure for each policy
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

			return flatPolicy;
		});

		const { translations } = await parent();
		const content = {
			title: translations.policiesTracker,
			description: translations.policiesDescription
		};

		return {
			policies: await Promise.all(policies.map((policy) => resolvePlaceholders(policy, lang))),
			content
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
