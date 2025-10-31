// src/routes/your/page/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { CAMP_API_KEY, CAMP_ORG_ID, CAMP_MANDATE_ID } from '$env/static/private';

export const load: PageServerLoad = async ({ fetch }) => {
	const headers = {
		'X-API-Key': CAMP_API_KEY,
		'Content-Type': 'application/json'
	};

	const balancesRes = await fetch(
		`https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/finance/accounting/balances/list`,
		{ method: 'POST', headers, body: JSON.stringify({ range: { year: 2025 } }) } // POST required by Campai API
	);

	if (!balancesRes.ok) {
		console.error('Failed to fetch balances:', await balancesRes.text());
		return { balances: null, error: 'Failed to load balances' };
	}

	const balances = await balancesRes.json();
	const donationAccount = balances.accountBalances.find((b: any) => b.account === 8440);
	return { donationAccount };
};

export const actions: Actions = {
	donate: async ({ request, fetch }) => {
		const fd = await request.formData();

		const name = String(fd.get('name') ?? '');
		const email = String(fd.get('email') ?? '');
		const message = String(fd.get('message') ?? '');
		const dob = String(fd.get('dob') ?? '');
		const amount = Number(fd.get('amount') ?? 0);

		const country = String(fd.get('country') ?? 'AT');
		const state = String(fd.get('state') ?? '');
		const zip = String(fd.get('zip') ?? '');
		const city = String(fd.get('city') ?? '');
		const addressLine = String(fd.get('addressLine') ?? '');
		const details2 = String(fd.get('details2') ?? '');

		if (!name || !email || !dob || !amount || amount <= 0 || !zip || !city || !addressLine) {
			// tell the page it’s a validation error
			return {
				success: false,
				error: 'Missing or invalid fields.'
			};
		}

		const headers = {
			'X-API-Key': CAMP_API_KEY,
			'Content-Type': 'application/json'
		};

		const debtorRes = await fetch(
			`https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/finance/accounts/debtors`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					type: 'person',
					name,
					email,
					receiptSendMethod: 'email',
					address: {
						country,
						state,
						zip,
						city,
						addressLine,
						details1: `Geburtsdatum: ${dob}`,
						details2
					}
				})
			}
		);

		if (!debtorRes.ok) {
			return { success: false, error: `Campai debtor create failed: ${await debtorRes.text()}` };
		}
		const debtor = await debtorRes.json();

		const today = new Date();
		const toISO = (d: Date) => d.toISOString().slice(0, 10);
		const due = new Date();
		due.setDate(today.getDate() + 10);

		const receiptRes = await fetch(
			`https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/receipts/donation`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					address: {
						country,
						state,
						zip,
						city,
						addressLine,
						details1: `Geburtsdatum: ${dob}`,
						details2
					},
					title: 'Spendenquittung',
					intro: message || 'Vielen Dank für deine Unterstützung!',
					account: debtor.account,
					receiptDate: toISO(today),
					dueDate: toISO(due),
					donationType: 'cash',
					email,
					sendMethod: 'email',
					positions: [
						{ description: 'Spende Klimadashboard', details: message || '', amount, account: 4300 }
					],
					queueReceiptDocument: false,
					emailTexts: { subject: 'Deine Spende ans Klimadashboard', message: 'Vielen Dank!' }
				})
			}
		);

		if (!receiptRes.ok) {
			return { success: false, error: `Campai donation failed: ${await receiptRes.text()}` };
		}

		const receipt = await receiptRes.json();

		return {
			success: true,
			name,
			dob,
			amount,
			accountId: debtor.account ?? null,
			receiptId: receipt?.receipt ?? receipt?.id ?? null
		};
	}
};
