import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Internal staging page for the heatwave monitor (Kysely days).
// Only reachable with `npm run dev`; every build (production, staging server) answers 404,
// so the page can never become public by accident. Remove this route before merging.
export const load: PageServerLoad = ({ setHeaders }) => {
	if (!dev) {
		error(404, 'Not found');
	}

	setHeaders({ 'x-robots-tag': 'noindex, nofollow' });

	return {};
};
