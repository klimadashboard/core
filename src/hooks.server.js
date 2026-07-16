import { PUBLIC_VERSION } from '$env/static/public';

const DEFAULT_LOCALE = PUBLIC_VERSION === 'electrification' ? 'en' : 'de';

/** @type {import('@sveltejs/kit').Handle} */ export function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', DEFAULT_LOCALE)
	});
}
