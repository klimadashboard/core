import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import getDirectusInstance from '$lib/utils/directus.server.js';
import { readUser, readItems } from '@directus/sdk';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const directus = getDirectusInstance(fetch);

	let member: any;
	try {
		member = await directus.request(
			readUser(params.id, {
				fields: ['id', 'first_name', 'last_name', 'title', 'avatar', 'description']
			} as any)
		);
	} catch {
		throw error(404, 'Team member not found');
	}

	if (!member) throw error(404, 'Team member not found');

	// Fetch pages where this user is listed as an author.
	// Requires an `authors` many-to-many field on the `pages` collection pointing to directus_users.
	// See Directus setup notes below.
	let authoredPages: any[] = [];
	try {
		authoredPages = (await directus.request(
			readItems('pages', {
				fields: [
					'id',
					{ site: ['domain'] },
					{ translations: ['slug', 'title', 'languages_code'] }
				],
				filter: {
					_and: [
						{ status: { _eq: 'published' } },
						{ authors: { directus_users_id: { _eq: params.id } } }
					]
				},
				limit: 20
			} as any)
		)) as any[];
	} catch {
		// Field not yet configured in Directus — silently skip
	}

	return { member, authoredPages };
};
