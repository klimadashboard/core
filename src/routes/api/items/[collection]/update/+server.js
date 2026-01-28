// src/routes/api/items/[collection]/update/+server.js
import getDirectusInstance from '$lib/utils/directus.server';
import { updateItem } from '@directus/sdk';
import { json, error } from '@sveltejs/kit';

export async function POST({ params, request }) {
	const { collection } = params;
	const directus = getDirectusInstance();

	try {
		const body = await request.json();
		const updatedItem = await directus.request(updateItem(collection, body.id, body.data));
		// Return JSON using SvelteKit's helper
		return json(updatedItem, { status: 200 });
	} catch (err) {
		// Throw a SvelteKit error; SvelteKit can render an error page if desired
		error(500, err.message);
	}
}
