// src/routes/your/page/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import Stripe from 'stripe';
import { CAMP_API_KEY, CAMP_ORG_ID, CAMP_MANDATE_ID, STRIPE_SECRET_KEY } from '$env/static/private';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus.server';
import dayjs from 'dayjs';

// ────────────────────────────────────────────────────────────
// Stripe init with explicit API version + env guard
// ────────────────────────────────────────────────────────────
const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2024-06-20';

if (!STRIPE_SECRET_KEY) {
	console.error('[INIT] STRIPE_SECRET_KEY is not set');
	throw new Error('Server misconfiguration: STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });

const calcFeeCents = (donCents: number) => {
	const rate = 0.015; // 1.5%
	const fixed = 25; // 0.25 €
	// raw fee so that net ≈ donCents
	const raw = (donCents + fixed) / (1 - rate) - donCents;
	// Round up so you never end up with *less* than the donation
	return Math.ceil(raw);
};
// Generate a tiny debug id for correlating logs ↔ UI
const debugId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ────────────────────────────────────────────────────────────
// Small helpers
// ────────────────────────────────────────────────────────────
function assertEnvCampai() {
	if (!CAMP_API_KEY || !CAMP_ORG_ID || !CAMP_MANDATE_ID) {
		throw new Error('Server misconfiguration: Campai env vars missing');
	}
}

function asIntEUR(amountEUR: number): number {
	return Math.round(amountEUR * 100);
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
	const out = {} as Pick<T, K>;
	for (const k of keys) out[k] = obj[k];
	return out;
}

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

function buildReturnUrls(current: URL) {
	// Build absolute URLs back to the SAME page (ignore Referer)
	const base = new URL(current.pathname, current.origin);
	const successUrl = new URL(base);
	successUrl.searchParams.set('status', 'success');

	// Use Stripe's documented pattern so it gets replaced properly:
	// ...?session_id={CHECKOUT_SESSION_ID}
	successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

	const cancelUrl = new URL(base);
	cancelUrl.searchParams.set('status', 'cancel');

	return { successUrl: successUrl.toString(), cancelUrl: cancelUrl.toString() };
}

// ────────────────────────────────────────────────────────────
// Page load (balances) — verbose errors
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

// ────────────────────────────────────────────────────────────
/** Campai helper: creates debtor + donation receipt; returns { debtorAccount, debtorName, receiptId } */
// ────────────────────────────────────────────────────────────
async function createCampaiDebtorAndReceipt(args: {
	fetch: typeof globalThis.fetch;
	name: string;
	email: string;
	dob: string;
	amountEUR: number;
	country: string;
	state: string;
	zip: string;
	city: string;
	addressLine: string;
	details1?: string;
	intro?: string;
	sendEmail?: boolean;
	dbg: string;
}) {
	assertEnvCampai();

	const {
		fetch,
		name,
		email,
		dob,
		amountEUR,
		country,
		state,
		zip,
		city,
		addressLine,
		details1 = '',
		intro = 'Bitte überweise den nachfolgenden Betrag. Danke, dass du mit deiner Spende die Arbeit des Klimadashboards unterstützt.',
		sendEmail = true,
		dbg
	} = args;

	const headers = { 'X-API-Key': CAMP_API_KEY, 'Content-Type': 'application/json' };

	// 1) Create debtor
	const debtorPayload = {
		type: 'person',
		name,
		email,
		details: `Geburtsdatum: ${dob}`,
		receiptSendMethod: sendEmail ? 'email' : 'none',
		address: { country, state, zip, city, addressLine, details1 }
	};

	const debtorRes = await fetch(
		`https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/finance/accounts/debtors`,
		{ method: 'POST', headers, body: JSON.stringify(debtorPayload) }
	);

	if (!debtorRes.ok) {
		const { text } = await readBodySafe(debtorRes);
		console.error(`[${dbg}] Campai debtor create failed`, {
			status: debtorRes.status,
			statusText: debtorRes.statusText,
			payload: pick(debtorPayload, ['name', 'email', 'address']),
			body: text.slice(0, 2000)
		});
		throw new Error('Campai debtor create failed');
	}
	const debtor = await debtorRes.json();
	console.log(debtor);

	// 2) Create donation receipt
	const today = new Date();
	const toISO = (d: Date) => d.toISOString().slice(0, 10);
	const due = new Date(today.getTime());
	due.setDate(today.getDate() + 10);

	const receiptPayload = {
		address: {
			country,
			state,
			zip,
			city,
			addressLine,
			details1: debtor.name,
			details2: 'Geburtsdatum: ' + dayjs(dob).format('DD.MM.YYYY')
		},
		title: 'Deine Spende | Klimadashboard',
		intro,
		account: debtor.account,
		accountName: name,
		receiptDate: toISO(today),
		dueDate: toISO(due),
		donationType: 'cash',
		email,
		sendMethod: 'none',
		positions: [
			{
				description: 'Spende an den Verein Klimadashboard',
				details: 'Geburtsdatum: ' + dayjs(dob).format('DD.MM.YYYY'),
				amount: asIntEUR(amountEUR),
				account: 40400,
				costCenter1: 1
			}
		],
		queueReceiptDocument: false,
		emailTexts: sendEmail
			? {
					subject: 'Deine Spende ans Klimadashboard',
					message: `Hallo ${name}, vielen Dank, dass du mit deiner Spende das Klimadashboard unterstützt. Anbei findest du alle Informationen, die du zur Bezahlung benötigst.`
				}
			: undefined
	};

	const receiptRes = await fetch(
		`https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/receipts/donation`,
		{ method: 'POST', headers, body: JSON.stringify(receiptPayload) }
	);

	if (!receiptRes.ok) {
		const { text } = await readBodySafe(receiptRes);
		console.error(`[${dbg}] Campai donation failed`, {
			status: receiptRes.status,
			statusText: receiptRes.statusText,
			payloadPreview: {
				account: receiptPayload.account,
				amountCents: receiptPayload.positions?.[0]?.amount
			},
			body: text.slice(0, 2000)
		});
		throw new Error('Campai donation failed');
	}

	const receipt = await receiptRes.json();
	const receiptId = receipt?.receipt ?? receipt?.id ?? null;
	return { debtorAccount: debtor.account ?? null, debtorName: debtor.name ?? name, receiptId };
}

// ────────────────────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────────────────────
export const actions: Actions = {
	// Single action for both flows. Branches by `paymentMethod`.
	donate: async ({ request, url, fetch }) => {
		const dbg = debugId();

		// Read form data
		const fd = await request.formData();

		const name = String(fd.get('name') ?? '').trim();
		const email = String(fd.get('email') ?? '').trim();
		const dob = String(fd.get('dob') ?? '').trim();
		const amount = Number(fd.get('amount') ?? 0);

		const country = String(fd.get('country') ?? 'AT').trim();
		const state = String(fd.get('state') ?? '').trim();
		const zip = String(fd.get('zip') ?? '').trim();
		const city = String(fd.get('city') ?? '').trim();
		const addressLine = String(fd.get('addressLine') ?? '').trim();
		const details1 = String(fd.get('details2') ?? '').trim();
		const message = String(fd.get('message') ?? '').trim();

		const paymentMethod = String(fd.get('paymentMethod') || 'bank') as 'bank' | 'card';

		// Basic server-side validation (mirror client)
		if (!name || !email || !dob || !zip || !city || !addressLine || !amount || amount <= 0) {
			console.warn(`[${dbg}] Validation failed`, {
				name: !!name,
				email: !!email,
				dob: !!dob,
				zip: !!zip,
				city: !!city,
				addressLine: !!addressLine,
				amount
			});
			return fail(400, { success: false, error: 'Missing or invalid fields.', dbg });
		}

		// Enforce your €20 minimum server-side too
		const donationCents = asIntEUR(amount);
		if (donationCents < 2000) {
			console.warn(`[${dbg}] Amount below minimum`, { amountEUR: amount, donationCents });
			return fail(400, { success: false, error: 'Mindestspende ist 20 €.', dbg });
		}

		try {
			// 1) Always create Campai first
			const { debtorAccount, receiptId } = await createCampaiDebtorAndReceipt({
				fetch,
				name,
				email,
				dob,
				amountEUR: amount,
				country,
				state,
				zip,
				city,
				addressLine,
				details1,
				intro:
					paymentMethod === 'bank'
						? 'Bitte überweise den nachfolgenden Betrag. Danke, dass du mit deiner Spende die Arbeit des Klimadashboards unterstützt.'
						: 'Vielen Dank für deine Unterstützung!',
				// optional: don't send Campai email before card payment clears
				sendEmail: paymentMethod === 'bank',
				dbg
			});

			// 2a) Bank → return data so the page shows bank details + QR
			if (paymentMethod === 'bank') {
				console.info(`[${dbg}] Flow=bank OK`, { receiptId, debtorAccount });
				return {
					success: true,
					name,
					dob,
					amount,
					accountId: debtorAccount,
					receiptId,
					dbg
				};
			}

			// 2b) Card → create Stripe Checkout Session and redirect
			const fee = calcFeeCents(donationCents);
			const total = donationCents + fee;

			// Stripe requires unit_amount >= 50 (EUR 0.50). You enforce >= 20 € already.
			if (total < 50) {
				console.warn(`[${dbg}] Stripe total below minimum`, { total });
				return fail(400, { success: false, error: 'Betrag zu niedrig für Stripe.', dbg });
			}

			const { successUrl, cancelUrl } = buildReturnUrls(new URL(url));

			let session: Stripe.Checkout.Session;
			try {
				session = await stripe.checkout.sessions.create({
					mode: 'payment',
					currency: 'eur',
					success_url: successUrl,
					cancel_url: cancelUrl,
					line_items: [
						{
							price_data: {
								currency: 'eur',
								product_data: {
									name: 'Spende Klimadashboard'
								},
								unit_amount: donationCents
							},
							quantity: 1
						},
						{
							price_data: {
								currency: 'eur',
								product_data: {
									name: 'Transaktionsgebühr (Stripe)',
									description: 'Gebühr für Zahlungsabwicklung'
								},
								unit_amount: fee
							},
							quantity: 1
						}
					],
					customer_email: email,
					metadata: {
						dbg,
						campai_receipt_id: String(receiptId ?? ''),
						campai_account: String(debtorAccount ?? ''),
						donor_name: name,
						donor_email: email,
						donor_dob: dob,
						donor_message: message,
						address_line: addressLine,
						zip,
						city,
						state,
						country,
						donation_amount_cents: String(donationCents),
						fee_amount_cents: String(fee),
						fees_added_extra: 'true'
					},
					payment_intent_data: {
						metadata: {
							dbg,
							campai_receipt_id: String(receiptId ?? ''),
							campai_account: String(debtorAccount ?? ''),
							donor_name: name,
							donor_email: email,
							donor_dob: dob,
							donor_message: message,
							address_line: addressLine,
							zip,
							city,
							state,
							country,
							donation_amount_cents: String(donationCents),
							fee_amount_cents: String(fee),
							fees_added_extra: 'true'
						}
					}
				});
			} catch (stripeErr: any) {
				console.error(`[${dbg}] Stripe session create failed`, {
					message: stripeErr?.message,
					code: stripeErr?.code,
					type: stripeErr?.type
				});
				return fail(500, { success: false, error: 'Stripe error (Checkout).', dbg });
			}

			if (!session?.url) {
				console.error(`[${dbg}] Stripe session returned no URL`, { sessionId: session?.id });
				return fail(500, { success: false, error: 'Stripe session missing URL.', dbg });
			}

			console.info(`[${dbg}] Flow=card redirecting to Stripe`, {
				sessionId: session.id,
				successUrl,
				cancelUrl
			});

			// IMPORTANT: do not swallow this Redirect in the outer catch
			throw redirect(303, session.url);
		} catch (err: any) {
			// Re-throw SvelteKit Redirects so they propagate to the client.
			// Redirect errors have `status` (3xx) and `location`.
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}

			console.error(`[${dbg}] donate(): unexpected`, err);
			return fail(500, { success: false, error: 'Campai/Stripe error', dbg });
		}
	}
};
