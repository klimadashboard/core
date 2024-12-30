// src/routes/api/items/[collection]/read/+server.js
import { getDirectusInstance } from '$lib/utils/directus.server';

export async function POST({ params, request }) {
	const { collection } = params;
	const directus = getDirectusInstance();

	try {
		const query = await request.json();
		const items = await directus.items(collection).readByQuery(query);
		return new Response(JSON.stringify(items), { status: 200 });
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}
