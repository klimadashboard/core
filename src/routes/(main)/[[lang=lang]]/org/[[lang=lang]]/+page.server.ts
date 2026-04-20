import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import getDirectusInstance from '$lib/utils/directus.server.js';
import { readUsers, readItems } from '@directus/sdk';

/* ─── Finance summary cache (2h TTL) ──────────────────────── */
type FinanceSummary = { income: number; expenses: number; year: number };
let _finCache: FinanceSummary | null = null;
let _finCacheTime = 0;
const FIN_CACHE_TTL = 2 * 60 * 60 * 1000;

async function fetchFinanceSummary(fetchFn: typeof fetch): Promise<FinanceSummary | null> {
	if (_finCache && Date.now() - _finCacheTime < FIN_CACHE_TTL) return _finCache;

	const { CAMP_API_KEY, CAMP_ORG_ID, CAMP_MANDATE_ID } = env;
	if (!CAMP_API_KEY || !CAMP_ORG_ID || !CAMP_MANDATE_ID) return null;

	try {
		const year = new Date().getUTCFullYear();
		const url = `https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/finance/accounting/postings/list`;

		let allPostings: any[] = [];
		let offset = 0;
		const limit = 100;

		while (true) {
			const res = await fetchFn(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-API-Key': CAMP_API_KEY },
				body: JSON.stringify({
					limit,
					offset,
					fromDate: new Date(Date.UTC(year, 0, 1)).toISOString(),
					toDate: new Date(Date.UTC(year + 1, 0, 1)).toISOString()
				})
			});
			if (!res.ok) break;
			const json = await res.json();
			allPostings = allPostings.concat(json.postings ?? []);
			if (!json.postings || json.postings.length < limit) break;
			offset += limit;
		}

		let income = 0;
		let expenses = 0;
		for (const p of allPostings) {
			const base = Math.abs(p.amount ?? 0) / 100;
			if (typeof p.creditAccount === 'number' && p.creditAccount >= 40000 && p.creditAccount < 50000) income += base;
			if (typeof p.debitAccount === 'number' && p.debitAccount >= 60000 && p.debitAccount < 80000) expenses += base;
		}

		_finCache = { income, expenses, year };
		_finCacheTime = Date.now();
		return _finCache;
	} catch (e) {
		console.error('[org finance summary]', e);
		return null;
	}
}

/* ─── Main load ────────────────────────────────────────────── */
export const load: PageServerLoad = async ({ fetch }) => {
	const directus = getDirectusInstance(fetch);

	async function tryFetch<T>(p: Promise<T>, fallback: T): Promise<T> {
		try {
			return await p;
		} catch (e) {
			console.error('[org load]', e);
			return fallback;
		}
	}

	const [team, media, moments, projects, events, financeSummary] = await Promise.all([
		tryFetch(
			directus.request(
				readUsers({
					fields: ['first_name', 'last_name', 'title', 'avatar', 'description'],
					sort: ['last_name'] as any
				})
			) as Promise<any[]>,
			[]
		),
		tryFetch(
			directus.request(
				readItems('org_press_reports', {
					fields: ['id', 'title', 'summary', 'date', 'link', { medium: ['name', 'logo'] }],
					limit: 30,
					sort: ['-date']
				})
			) as Promise<any[]>,
			[]
		),
		tryFetch(
			directus.request(
				readItems('org_moments', {
					fields: ['id', 'title', 'copyright', { image: ['id'] }],
					limit: 40,
					sort: ['-id']
				})
			) as Promise<any[]>,
			[]
		),
		tryFetch(
			directus.request(
				readItems('org_projects', {
					fields: ['id', 'title', 'summary', 'link', 'featured', 'status'],
					sort: ['-featured', 'title'] as any
				})
			) as Promise<any[]>,
			[]
		),
		tryFetch(
			directus.request(
				readItems('org_events' as any, {
					fields: ['id', 'title', 'date', 'location', 'description'],
					filter: { date: { _gte: new Date().toISOString() } } as any,
					sort: ['date'] as any,
					limit: 20
				})
			) as Promise<any[]>,
			[]
		),
		fetchFinanceSummary(fetch)
	]);

	return {
		team,
		media,
		moments,
		projects,
		events,
		financeSummary,
		content: { title: 'Über uns' }
	};
};
