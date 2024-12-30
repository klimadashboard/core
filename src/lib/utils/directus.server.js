import { createDirectus, rest, staticToken } from '@directus/sdk';
import { DIRECTUS_TOKEN } from '$env/static/private';

function getDirectusInstance(fetch) {
	const options = fetch ? { globals: { fetch } } : {};
	const directus = createDirectus('https://base.klimadashboard.org', options)
		.with(staticToken(DIRECTUS_TOKEN))
		.with(rest());
	return directus;
}

export default getDirectusInstance;
