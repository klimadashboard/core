/** @type {import('./$types').PageLoad} */
import { error } from '@sveltejs/kit';

export async function load({ fetch, params }) {
	try {
		return {
			id: params.id
		};
	} catch (err) {
		error(404, 'Page not found');
	}
}
