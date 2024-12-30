import { createDirectus, rest } from '@directus/sdk';
import { DIRECTUS_TOKEN } from '$env/static/private';

function getDirectusInstance(fetch) {
	const options = fetch ? { globals: { fetch } } : {};
	const directus = createDirectus('https://base.klimadashboard.org', options).with(rest());
	if (DIRECTUS_TOKEN) {
		directus.auth.static(DIRECTUS_TOKEN);
	}
	return directus;
}

export default getDirectusInstance;
