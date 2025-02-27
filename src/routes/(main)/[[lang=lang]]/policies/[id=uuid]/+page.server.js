/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);
	const lang = params.lang || 'de';

	try {
		const policy = await directus.request(
			readItem('policies', params.id, {
				fields: [
					'*',
					'translations.*',
					'updates.*',
					'updates.translations.*',
					'stakeholders.stakeholders_id.*',
					'attributes.policies_attributes_key.*',
					'attributes.policies_attributes_key.translations.*',
					'status'
				],
				deep: {
					translations: { _filter: { languages_code: { _eq: lang } } },
					updates: { translations: { _filter: { languages_code: { _eq: lang } } } }
				}
			})
		);

		// Move translations[0] properties to top-level fields for policy
		const policyData = {
			...policy,
			...policy.translations?.[0], // Flatten translations[0]
			updates: policy.updates?.map((update) => ({
				...update,
				...update.translations?.[0] // Flatten translations[0] for updates
			})),
			attributes: policy.attributes?.map((attr) => ({
				...attr.policies_attributes_key,
				...attr.policies_attributes_key?.translations?.[0] // Flatten translations[0] for attributes
			}))
		};

		// Cleanup unused translation fields
		delete policyData.translations;
		policyData.updates?.forEach((update) => delete update.translations);
		policyData.attributes?.forEach((attr) => delete attr.translations);

		// Content for display
		const content = {
			title: policyData.title
			// eyebrow: '<a href="/policies">&larr; Maßnahmen</a>'
		};

		return {
			policy: await resolvePlaceholders(policyData, lang),
			content
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
