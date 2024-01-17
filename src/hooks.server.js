/** @type {import('@sveltejs/kit').Handle} */ export function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', 'en')
	});
}
