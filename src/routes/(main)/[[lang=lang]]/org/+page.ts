import type { PageLoad } from './$types';
import getDirectusInstance from '$lib/utils/directus';
import { readUsers, readItems } from '@directus/sdk';

export const load: PageLoad = async ({ fetch }) => {
	const directus = getDirectusInstance(fetch);

	async function tryFetch<T>(p: Promise<T>, fallback: T) {
		try {
			return await p;
		} catch (e) {
			console.error('[org load]', e);
			return fallback;
		}
	}

	const team = await tryFetch(directus.request(readUsers({ filter: {} })) as Promise<any[]>, []);

	const media = await tryFetch(
		directus.request(
			readItems('org_press_reports', {
				fields: ['id', 'title', 'summary', 'date', 'link', { medium: ['name', 'logo'] }],
				limit: 12,
				sort: ['-date']
			})
		) as Promise<any[]>,
		[]
	);

	const events = await tryFetch(
		directus.request(
			readItems('org_events', {
				fields: ['id', 'title', 'date', 'date_end', 'location'],
				limit: 10,
				sort: ['-date'],
				filter: { date_end: { _lte: '$NOW' } }
			})
		) as Promise<any[]>,
		[]
	);

	const moments = await tryFetch(
		directus.request(
			readItems('org_moments', {
				fields: ['id', 'title', 'copyright', { image: ['id'] }],
				limit: 12,
				sort: ['-id'] // change to date if you have one
			})
		) as Promise<any[]>,
		[]
	);

	const quotes = await tryFetch(
		directus.request(
			readItems('quotes', {
				fields: ['id', 'text', 'author_name', 'author_role', { author_image: ['id'] }],
				limit: 12
			})
		) as Promise<any[]>,
		[]
	);

	const projects = await tryFetch(
		directus.request(readItems('org_projects', {})) as Promise<any[]>,
		[]
	);

	return {
		team,
		media,
		events,
		moments,
		quotes,
		projects,
		content: { title: 'Startseite' }
	};
};
