import type { PageServerLoad } from './$types';
import { CAMP_API_KEY, CAMP_ORG_ID, CAMP_MANDATE_ID } from '$env/static/private';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus.server';
import { assertEnvCampai } from '$lib/server/campai';

const debugId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

async function readBodySafe(res: Response) {
	try {
		const text = await res.text();
		try {
			return { text, json: JSON.parse(text) };
		} catch {
			return { text, json: null };
		}
	} catch {
		return { text: '', json: null };
	}
}

// ────────────────────────────────────────────────────────────
// Page load (balances) — verbose errors. Bank-transfer donors get IBAN details via
// the FAQ (no in-app form); card donations go through
// /donate/api/create-payment-intent + the Stripe webhook, since the Campai booking
// must only happen once payment is actually confirmed.
// ────────────────────────────────────────────────────────────
export const load: PageServerLoad = async ({ fetch }) => {
	const dbg = debugId();
	try {
		const directus = getDirectusInstance();
		const projects = await directus.request(readItems('org_projects', {}));

		assertEnvCampai();
		const headers = {
			'X-API-Key': CAMP_API_KEY,
			'Content-Type': 'application/json'
		};

		const res = await fetch(
			`https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/finance/accounting/balances/list`,
			{ method: 'POST', headers, body: JSON.stringify({ range: { year: 2025 } }) }
		);

		if (!res.ok) {
			const { text } = await readBodySafe(res);
			console.error(`[${dbg}] load(): Campai balances error`, {
				status: res.status,
				statusText: res.statusText,
				body: text.slice(0, 2000)
			});
			return { projects, donationAccount: null, error: 'Failed to load balances', dbg };
		}

		const balances = await res.json();
		const donationAccount = balances.accountBalances?.find((b: any) => b.account === 40400) ?? null;
		return { projects, donationAccount, dbg, content: { title: 'Spenden' } };
	} catch (err: any) {
		console.error(`[${dbg}] load(): unexpected error`, err);
		return { projects: [], donationAccount: null, error: 'Unexpected load error', dbg };
	}
};
