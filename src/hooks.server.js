// ---------------------------------------------------------------------------
// Keep the Node server alive when a promise rejects without a handler.
//
// Since Node 15 an unhandled rejection terminates the process. With
// adapter-node that means a single floating promise — e.g. a Directus call
// that gets a 503 "Under pressure" from base.klimadashboard.org during a load
// spike — takes the whole site down and drops every in-flight request until
// the container has restarted. Log it and keep serving instead; a request that
// depends on the rejected promise still fails on its own.
// ---------------------------------------------------------------------------
if (!globalThis.__kdProcessGuardsInstalled) {
	globalThis.__kdProcessGuardsInstalled = true;

	process.on('unhandledRejection', (reason) => {
		console.error('[unhandledRejection]', reason);
	});

	process.on('uncaughtException', (err) => {
		console.error('[uncaughtException]', err);
	});
}

/** @type {import('@sveltejs/kit').Handle} */ export function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', 'de')
	});
}
