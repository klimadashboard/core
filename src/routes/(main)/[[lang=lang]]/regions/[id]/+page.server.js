/** @type {import('./$types').PageServerLoad} */
import { error, redirect } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

export async function load({ fetch, params, url }) {
	const directus = getDirectusInstance(fetch);

	const host = url.hostname;
	const isProduction = ['klimadashboard.at', 'klimadashboard.de'].includes(host);
	const expectedHost =
		PUBLIC_VERSION.toLowerCase() === 'at' ? 'klimadashboard.at' : 'klimadashboard.de';

	if (isProduction && host !== expectedHost) {
		url.hostname = expectedHost;
		throw redirect(301, url.toString());
	}

	try {
		const page = await directus.request(readItem('regions', params.id));

		return {
			page,
			content: {
				title: page.name
			}
		};
	} catch (err) {
		throw error(404, 'Page not found');
	}
}
