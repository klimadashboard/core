/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

export async function load({ fetch, params }) {
	const directus = getDirectusInstance(fetch);

	let language = params.lang ? params.lang : 'de';
	let slug = params.slug ? params.slug : 'home';
	let site = PUBLIC_VERSION;

	try {
		// Find the page based on the provided filters
		const pages = await directus.request(
			readItems('pages', {
				filter: {
					_and: [
						{
							status: {
								_eq: 'published'
							}
						},
						{
							translations: {
								slug: {
									_eq: slug
								}
							}
						},
						{
							translations: {
								languages_code: {
									_eq: language
								}
							}
						},
						{
							site: {
								_eq: PUBLIC_VERSION
							}
						}
					]
				},
				fields: [
					'*',
					{
						translations: [
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
															{ blocks: ['*.*'] },
															{ files: ['*.*'] }
														]
													}
												]
											},
											{ files: ['*.*'] }
										]
									}
								]
							}
						]
					}
				],
				limit: 1
			})
		);

		if (pages.length === 0) {
			throw error(404, 'Page not found');
		}

		const page = pages[0];

		const translation = page.translations.find(
			(t) => t.slug === slug && t.languages_code === language
		);

		// const seo = page.seo ? await directus.request(readItem('seo', page.seo)) : null;

		return {
			content: resolvePlaceholders(translation),
			page: page
			// seo: seo
		};
	} catch (err) {
		console.log(err);
		throw error(404, 'Page not found');
	}
}
