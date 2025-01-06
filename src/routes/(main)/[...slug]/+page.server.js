/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem } from '@directus/sdk';
import { locale } from '$lib/stores/i18n';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);
	let language_code;
	locale.subscribe((value) => {
		language_code = value;
	});
	let slug = params.slug ? params.slug : 'home';
	try {
		const translations = await directus.request(
			readItems('pages_translations', {
				filter: {
					_and: [
						{
							languages_code: { _eq: language_code }
						},
						{
							slug: { _eq: slug }
						}
					]
				},
				fields: [
					'*',
					{
						blocks: [
							'*',
							{
								item: [
									'*',
									{
										charts: [
											'*',
											{
												chart: ['*', { translations: ['*'] }]
											}
										]
									},
									{ files: ['*.*'] }
								]
							}
						]
					}
				],
				limit: 1
			})
		);
		const translation = translations[0];
		const pages_id = translation.pages_id;
		const page = await directus.request(readItem('pages', pages_id));
		const seo = page.seo ? await directus.request(readItem('seo', page.seo)) : null;
		return {
			content: translation,
			page: page,
			seo: seo
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
