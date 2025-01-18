// src/routes/api/items/[collection]/read/+server.js
import getDirectusInstance from '$lib/utils/directus.server';
import { json, error } from '@sveltejs/kit';

export async function POST({ params, request }) {
	const { collection } = params;
	const directus = getDirectusInstance();

	try {
		const query = await request.json();
		const items = await directus.items(collection).readByQuery(query);

		// Return JSON using the SvelteKit "json" helper
		return json(items, { status: 200 });
	} catch (err) {
		// Throw a SvelteKit error so the framework can handle it (e.g., SSR error page)
		throw error(500, err.message);
	}
}
