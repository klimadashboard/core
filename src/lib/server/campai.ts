import { CAMP_API_KEY, CAMP_ORG_ID, CAMP_MANDATE_ID } from '$env/static/private';

export function assertEnvCampai() {
	if (!CAMP_API_KEY || !CAMP_ORG_ID || !CAMP_MANDATE_ID) {
		throw new Error('Server misconfiguration: Campai env vars missing');
	}
}

const campaiBase = () => `https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}`;
const campaiHeaders = () => ({ 'X-API-Key': CAMP_API_KEY, 'Content-Type': 'application/json' });

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

async function campaiPost(
	fetchFn: typeof globalThis.fetch,
	path: string,
	body: unknown,
	dbg: string,
	label: string
) {
	const res = await fetchFn(`${campaiBase()}${path}`, {
		method: 'POST',
		headers: campaiHeaders(),
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const { text } = await readBodySafe(res);
		console.error(`[${dbg}] Campai ${label} failed`, {
			status: res.status,
			statusText: res.statusText,
			body: text.slice(0, 2000)
		});
		throw new Error(`Campai ${label} failed`);
	}
	return res.json();
}

export interface Address {
	country: string;
	state?: string;
	zip: string;
	city: string;
	addressLine: string;
	details1?: string;
	details2?: string;
}

/**
 * Creates a debtor. Address is optional (confirmed live against Campai — a debtor
 * needs no address at all); birthdate is a structured field, not free text.
 */
export async function createDebtor(args: {
	fetch: typeof globalThis.fetch;
	name: string;
	email: string;
	birthdate?: string; // "YYYY-MM-DD"
	address?: Address;
	dbg: string;
}) {
	assertEnvCampai();
	const { fetch, name, email, birthdate, address, dbg } = args;

	const debtor = await campaiPost(
		fetch,
		'/finance/accounts/debtors',
		{
			type: 'person',
			name,
			email,
			receiptSendMethod: 'none',
			...(birthdate ? { birthdate } : {}),
			...(address ? { address } : {})
		},
		dbg,
		'debtor create'
	);
	return debtor as { _id: string; account: number };
}

/**
 * Books a donation with no address requirement — confirmed live: creates a real
 * open item against the debtor's account (visible in "Offene Posten"), no printed
 * document, no formal receipt. This org's chart of accounts uses cost-center
 * "Sphären" accounting, so costCenter1 must be set on every position.
 */
export async function createRevenueReceipt(args: {
	fetch: typeof globalThis.fetch;
	debtorAccount: number;
	accountName: string;
	amountEUR: number;
	description: string;
	dbg: string;
}) {
	assertEnvCampai();
	const { fetch, debtorAccount, accountName, amountEUR, description, dbg } = args;

	const today = new Date();
	const toISO = (d: Date) => d.toISOString().slice(0, 10);
	const due = new Date(today.getTime());
	due.setDate(today.getDate() + 10);
	const amountCents = Math.round(amountEUR * 100);

	const receipt = await campaiPost(
		fetch,
		'/receipts/revenue',
		{
			account: debtorAccount,
			receiptNumber: `SPENDE-${Date.now()}`,
			totalGrossAmount: amountCents,
			receiptDate: toISO(today),
			dueDate: toISO(due),
			accountName,
			description,
			positions: [{ account: 40400, amount: amountCents, description, costCenter1: 1 }]
		},
		dbg,
		'revenue receipt create'
	);
	return receipt as { _id: string };
}

/** Marks a revenue receipt as paid immediately — used for the card path, where payment is already confirmed by the time we book it. */
export async function markReceiptPaid(args: {
	fetch: typeof globalThis.fetch;
	receiptId: string;
	debtorAccount: number;
	amountEUR: number;
	dbg: string;
}) {
	assertEnvCampai();
	const { fetch, receiptId, debtorAccount, amountEUR, dbg } = args;
	const today = new Date().toISOString().slice(0, 10);
	await campaiPost(
		fetch,
		`/finance/receipts/${receiptId}/payments`,
		{ account: debtorAccount, date: today, amount: Math.round(amountEUR * 100) },
		dbg,
		'mark receipt paid'
	);
}

/**
 * The classic formal donation receipt (Spendenbescheinigung) — always requires a
 * full address (confirmed live, even for country: 'AT'). Only used when a donor
 * explicitly opts into a formal receipt.
 */
export async function createDonationReceipt(args: {
	fetch: typeof globalThis.fetch;
	debtorAccount: number;
	debtorName: string;
	name: string;
	email: string;
	birthdate?: string;
	amountEUR: number;
	address: Address;
	intro: string;
	sendEmail: boolean;
	dbg: string;
}) {
	assertEnvCampai();
	const { fetch, debtorAccount, debtorName, name, email, birthdate, amountEUR, address, intro, sendEmail, dbg } =
		args;

	const today = new Date();
	const toISO = (d: Date) => d.toISOString().slice(0, 10);
	const due = new Date(today.getTime());
	due.setDate(today.getDate() + 10);
	const amountCents = Math.round(amountEUR * 100);

	const receipt = await campaiPost(
		fetch,
		'/receipts/donation',
		{
			address: {
				...address,
				details1: debtorName,
				details2: birthdate ? `Geburtsdatum: ${birthdate}` : ''
			},
			title: 'Deine Spende | Klimadashboard',
			intro,
			account: debtorAccount,
			accountName: name,
			receiptDate: toISO(today),
			dueDate: toISO(due),
			donationType: 'cash',
			email,
			sendMethod: sendEmail ? 'email' : 'none',
			positions: [
				{
					description: 'Spende an den Verein Klimadashboard',
					details: birthdate ? `Geburtsdatum: ${birthdate}` : '',
					amount: amountCents,
					account: 40400,
					costCenter1: 1
				}
			],
			queueReceiptDocument: false,
			...(sendEmail
				? {
						emailTexts: {
							subject: 'Deine Spende ans Klimadashboard',
							message: `Hallo ${name}, vielen Dank, dass du mit deiner Spende das Klimadashboard unterstützt. Anbei findest du alle Informationen, die du zur Bezahlung benötigst.`
						}
					}
				: {})
		},
		dbg,
		'donation receipt create'
	);
	const receiptId = receipt?.receipt ?? receipt?.id ?? receipt?._id ?? null;
	return { receiptId };
}

/**
 * Austria's automatic Finanzamt donation reporting is keyed off name + birthdate
 * (matched via the ZMR to a vbPK), not address — confirmed via the API's
 * `donation/austrianDonationSubmissions/listDonatorsForVBPK` endpoint and the fact
 * that `donator.address` is nullable here. This is the address-free tax-reporting
 * path for AT donors, decoupled from the formal receipt document above.
 *
 * NOT YET EMPIRICALLY VERIFIED end-to-end against the real Finanzamt submission
 * batch — validate with a real test / Campai support before relying on this for a
 * live tax season.
 */
export async function createAustrianDonationRecord(args: {
	fetch: typeof globalThis.fetch;
	debtorAccount: number;
	name: string;
	email: string;
	amountEUR: number;
	date: string; // "YYYY-MM-DD"
	description: string;
	dbg: string;
}) {
	assertEnvCampai();
	const { fetch, debtorAccount, name, email, amountEUR, date, description, dbg } = args;
	const amountCents = Math.round(amountEUR * 100);

	const donation = await campaiPost(
		fetch,
		'/donation/donations',
		{
			positions: [{ type: 'cash', value: amountCents, date, description }],
			confirmationSendMethod: 'none',
			donator: {
				name,
				address: null,
				email,
				account: debtorAccount,
				type: 'person'
			}
		},
		dbg,
		'austrian donation record create'
	);
	return donation as { _id: string };
}
