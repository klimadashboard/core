import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { CAMP_API_KEY, CAMP_ORG_ID, CAMP_MANDATE_ID } from '$env/static/private';

// ----- Config -----
const ACCOUNT_NAME_MAP: Record<number, string> = {
	40400: 'Spenden',
	40900: 'Erlöse (Workshops, Leistungen,..)',
	60200: 'Gehälter',
	61000: 'Sozialversicherung',
	59000: 'Externe Leistungen | Honorare',
	68250: 'Rechtsanwalt & Steuerberatung',
	68110: 'Server & Infrastruktur',
	68550: 'Bankspesen & Kontoführung'
};

// Pseudo accounts for grouping uncategorised postings
const OTHER_INCOME_ID = 99998; // 5 digits to pass the filter
const OTHER_EXPENSE_ID = 99999; // 5 digits to pass the filter

export type CampaiPosting = {
	_id: string;
	mandate: string | null;
	receiptDate: string | null;
	amount: number | null; // in cents from API (absolute)
	debitAccount: number | null;
	creditAccount: number | null;
	debitAccountName?: string | null;
	creditAccountName?: string | null;
	text?: string | null;
	source?: string | null;
	sourceId?: string | null;
};

export type CampaiListResponse = {
	count: number;
	postings: CampaiPosting[];
};

export type SubItem = {
	accountName: string | null;
	date: string | null;
	amount: number; // in EUR, signed
	label: string; // "Buchung <accountName>" except for income >= 1000 EUR => use original text
};

export type AccountGroup = {
	accountId: number;
	accountName: string | null;
	total: number; // EUR, signed
	items: SubItem[];
};

export type GroupedResult = {
	totalsByAccount: AccountGroup[];
	meta: {
		yearsCovered: number[];
		totalPostings: number;
		fetchedBatches: number;
	};
};

// ---------- Helpers ----------
function isFiveDigit(id: number | null | undefined): id is number {
	return typeof id === 'number' && id >= 10000 && id <= 99999;
}

function amountEUR(cents: number | null | undefined): number {
	// Treat API amount as absolute cents; side (debit/credit + account class) determines sign later.
	const n = typeof cents === 'number' ? Math.abs(cents) : 0;
	return n / 100;
}

function isIncomeAccount(id: number | null | undefined): boolean {
	return isFiveDigit(id) && id! >= 40000 && id! < 50000;
}
function isExpenseAccount(id: number | null | undefined): boolean {
	return isFiveDigit(id) && id! >= 60000 && id! < 80000;
}
function isPnLAccount(id: number | null | undefined): boolean {
	// Count only P&L accounts (class 4 = income, class 6/7 = expenses) or anything explicitly mapped.
	// This excludes bank (e.g., 18000), clearing/vendor (e.g., 14930, 700001), etc.
	return isIncomeAccount(id) || isExpenseAccount(id) || (!!id && id in ACCOUNT_NAME_MAP);
}

type Side = {
	type: 'debit' | 'credit';
	accId: number | null;
	name: string | null;
	// 'income' | 'expense' | null (null for non-P&L)
	kind: 'income' | 'expense' | null;
};

// Compute signed amount for a chosen P&L side.
// - Income accounts: credit increases income (+), debit decreases income (-)
// - Expense accounts: debit increases expense (-), credit decreases expense (+)
function signedBySide(
	kind: 'income' | 'expense',
	sideType: 'debit' | 'credit',
	base: number
): number {
	if (kind === 'income') {
		return sideType === 'credit' ? +base : -base;
	}
	// expense
	return sideType === 'debit' ? -base : +base;
}

// ---------- Fetch ----------
async function fetchPostingsForYear(fetchFn: typeof fetch, year: number): Promise<CampaiPosting[]> {
	if (!CAMP_ORG_ID || !CAMP_MANDATE_ID || !CAMP_API_KEY) {
		throw error(500, 'Missing Campai environment variables');
	}

	const url = `https://cloud.campai.com/api/${CAMP_ORG_ID}/${CAMP_MANDATE_ID}/finance/accounting/postings/list`;

	const start = new Date(Date.UTC(year, 0, 1));
	const end = new Date(Date.UTC(year + 1, 0, 1));

	const limit = 100;
	let offset = 0;
	let all: CampaiPosting[] = [];

	while (true) {
		const body = {
			limit,
			offset,
			fromDate: start.toISOString(),
			toDate: end.toISOString()
		};

		const res = await fetchFn(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': `${CAMP_API_KEY}`
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			throw error(res.status, `Campai API error (${res.statusText})`);
		}

		const json = (await res.json()) as CampaiListResponse;
		all = all.concat(json.postings ?? []);

		if (!json.postings || json.postings.length < limit) break;
		offset += limit;
	}

	return all;
}

// ---------- Grouping ----------
function groupByAccount(postings: CampaiPosting[], years: number[]): GroupedResult {
	const map = new Map<number, AccountGroup>();
	const othersIncome: AccountGroup = {
		accountId: OTHER_INCOME_ID,
		accountName: 'Andere Einnahmen',
		total: 0,
		items: []
	};
	const othersExpense: AccountGroup = {
		accountId: OTHER_EXPENSE_ID,
		accountName: 'Andere Ausgaben',
		total: 0,
		items: []
	};

	const pickDate = (p: CampaiPosting) => p.receiptDate ?? p.mandate ?? null;
	const ensureGroup = (id: number, name: string | null) => {
		if (!map.has(id)) map.set(id, { accountId: id, accountName: name, total: 0, items: [] });
		return map.get(id)!;
	};

	// Optional: aggregate duplicates across postings of the same invoice+account
	// (helps if an invoice splits into multiple lines of the same category).
	const agg = new Map<
		string,
		{ date: string | null; accId: number; accName: string | null; amount: number; label: string }
	>();

	for (const p of postings) {
		const base = amountEUR(p.amount); // EUR magnitude (no sign)
		const date = pickDate(p);

		// Build sides and classify whether they are P&L (income/expense)
		const sides: Side[] = [
			{
				type: 'debit',
				accId: p.debitAccount,
				name: ACCOUNT_NAME_MAP[p.debitAccount ?? -1] ?? p.debitAccountName ?? null,
				kind: isIncomeAccount(p.debitAccount)
					? 'income'
					: isExpenseAccount(p.debitAccount)
						? 'expense'
						: p.debitAccount && p.debitAccount in ACCOUNT_NAME_MAP
							? p.debitAccount! >= 40000 && p.debitAccount! < 50000
								? 'income'
								: 'expense'
							: null
			},
			{
				type: 'credit',
				accId: p.creditAccount,
				name: ACCOUNT_NAME_MAP[p.creditAccount ?? -1] ?? p.creditAccountName ?? null,
				kind: isIncomeAccount(p.creditAccount)
					? 'income'
					: isExpenseAccount(p.creditAccount)
						? 'expense'
						: p.creditAccount && p.creditAccount in ACCOUNT_NAME_MAP
							? p.creditAccount! >= 40000 && p.creditAccount! < 50000
								? 'income'
								: 'expense'
							: null
			}
		];

		// Keep only P&L sides — this drops bank/clearing/vendor legs (e.g., 18000, 14930, 700001)
		const pnlSides = sides.filter((s) => isPnLAccount(s.accId) && s.kind !== null);

		if (pnlSides.length === 0) {
			// nothing P&L to record for this posting (e.g., bank <-> clearing only)
			continue;
		}

		// Choose exactly ONE side to avoid double counting.
		// Preference order:
		// 1) A side whose account is explicitly mapped in ACCOUNT_NAME_MAP
		// 2) If exactly one P&L side exists, take it
		// 3) Otherwise prefer debit for expenses, credit for income
		let chosen = pnlSides.find((s) => s.accId != null && s.accId in ACCOUNT_NAME_MAP);
		if (!chosen) {
			if (pnlSides.length === 1) {
				chosen = pnlSides[0];
			} else {
				// Try to pick a "natural" side based on kind
				chosen =
					pnlSides.find((s) => s.kind === 'expense' && s.type === 'debit') ??
					pnlSides.find((s) => s.kind === 'income' && s.type === 'credit') ??
					pnlSides[0];
			}
		}

		const accId = chosen.accId!;
		const accName = ACCOUNT_NAME_MAP[accId] ?? chosen.name ?? null;
		const amt = signedBySide(chosen.kind!, chosen.type, base);

		// Label: for income >= 1000 EUR use original text; else generic
		const isIncome = amt > 0;
		const label =
			isIncome && Math.abs(amt) >= 1000 && p.text ? p.text : `Buchung ${accName ?? accId}`;

		// Aggregate by invoice+account (sourceId preferred to tie all legs of same invoice)
		const key = `${p.sourceId ?? p._id}-${accId}`;
		const prev = agg.get(key);
		if (prev) {
			prev.amount += amt;
			// keep earliest date for ordering (or latest — arbitrary; we keep earliest)
			if (prev.date && date && date < prev.date) prev.date = date;
		} else {
			agg.set(key, { date, accId, accName, amount: amt, label });
		}
	}

	// Push aggregates into groups
	for (const { date, accId, accName, amount, label } of agg.values()) {
		const push = (group: AccountGroup) => {
			group.items.push({ accountName: accName, date, amount, label });
			group.total += amount;
		};

		if (accId in ACCOUNT_NAME_MAP) {
			push(ensureGroup(accId, accName));
		} else {
			// Unmapped but still P&L → Others buckets
			if (amount > 0) push(othersIncome);
			else push(othersExpense);
		}
	}

	if (othersIncome.items.length) map.set(othersIncome.accountId, othersIncome);
	if (othersExpense.items.length) map.set(othersExpense.accountId, othersExpense);

	// Sort items within each account by date ascending
	for (const g of map.values()) {
		g.items.sort((a, b) => {
			if (!a.date && !b.date) return 0;
			if (!a.date) return 1;
			if (!b.date) return -1;
			return a.date.localeCompare(b.date);
		});
	}

	// Order accounts by absolute total desc, then by accountId
	const totalsByAccount = Array.from(map.values()).sort((a, b) => {
		const d = Math.abs(b.total) - Math.abs(a.total);
		return d !== 0 ? d : a.accountId - b.accountId;
	});

	return {
		totalsByAccount,
		meta: {
			yearsCovered: years,
			totalPostings: postings.length,
			fetchedBatches: 0
		}
	};
}

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const currentYear = new Date().getUTCFullYear();
		const years: number[] = [];
		for (let y = 2025; y <= currentYear; y++) years.push(y);

		// Fetch and group PER YEAR
		const byYear: Record<number, GroupedResult> = {};
		for (const y of years) {
			const postings = await fetchPostingsForYear(fetch, y);
			byYear[y] = groupByAccount(postings, [y]);
		}

		// Return per-year structure so frontend can iterate years then accounts
		return { years, byYear };
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, message);
	}
};
