<script>
	import PoliciesGrid from '../../../routes/(main)/[[lang=lang]]/policies/PoliciesGrid.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { page } from '$app/state';

	$: getData = async () => {
		const directus = getDirectusInstance();
		try {
			const lang = page.data.language.code;
			const response = await directus.request(
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
					},
					limit: 9
				})
			);

			// Flatten structure for each policy
			const policies = response.map((policy) => {
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
			return policies;
		} catch (error) {
			console.error(error);
		}
	};

	$: promise = getData();
</script>

{#await promise then policies}
	<PoliciesGrid {policies} />
{/await}
