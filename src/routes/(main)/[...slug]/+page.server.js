/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { locale } from '$lib/stores/i18n';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);
	let language_code;
	locale.subscribe((value) => {
		language_code = value;
	});
	console.log(language_code);
	try {
		const pages = await directus.request(
			readItems('pages', {
				deep: {
					translations: {
						_filter: {
							_and: [
								{
									languages_code: { _eq: language_code }
								},
								{
									slug: { _eq: params.slug ? params.slug : 'home' }
								}
							]
						}
					}
				},
				fields: [
					'*',
					{
						blocks: [
							'*',
							{
								item: {
									block_toggle: ['*'],
									block_chart: [
										'*',
										{
											charts: [
												'*',
												{
													chart: ['*']
												}
											]
										}
									],
									block_richtext: ['*']
								}
							}
						]
					}
				],
				limit: 1
			})
		);

		const page = pages[0];
		console.log(pages);
		return {
			page: page
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
