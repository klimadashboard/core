/**
 * Central server-side chart data service.
 *
 * Auto-discovers config.ts modules from chart directories via import.meta.glob.
 * For each chart, calls its fetchChartData() to get full ChartData (table, placeholders, meta).
 * Builds serializable ChartSnapshot with pre-formatted table rows and fully resolved text.
 * Results are cached in an LRU cache (fresh 60 min, stale-servable 24h, max 10000 entries).
 *
 * Protections against Directus overload:
 * - Stale-while-revalidate: expired snapshots served instantly for up to 24h
 * - Global concurrency cap: max 4 data fetches system-wide; excess get text-only snapshots
 * - HTTP response cache: Directus API responses cached for 4 hours (shared across all charts)
 * - In-flight deduplication: concurrent requests for the same snapshot share one promise
 * - Per-page concurrency limiter: max 2 chart data fetches per page load
 *
 * Pages call getChartSnapshots(chartIds, regionId, lang, fetch) — one line per page type.
 */

import getDirectusInstance from './directus';
import { readItems, readTranslations } from '@directus/sdk';
import { resolvePlaceholders } from './placeholderUtils';
import type { ChartData, ChartFetchParams } from '$lib/components/charts/types';

export interface SnapshotTableColumn {
	key: string;
	label: string;
}

export interface ChartSnapshot {
	title: string;
	heading: string;
	text: string;
	methods: string;
	source: string;
	table?: {
		columns: SnapshotTableColumn[];
		rows: Record<string, string>[];
	};
}

// ---------------------------------------------------------------------------
// LRU Cache (snapshot level)
// ---------------------------------------------------------------------------

interface CacheValue {
	snapshot: ChartSnapshot;
	expires: number;     // Fresh until (60 min) — within this window, entry is fully valid
	staleUntil: number;  // Usable until (24h) — past expires but within staleUntil, served as-is
}

class LRUCache {
	private map = new Map<string, CacheValue>();
	constructor(private maxSize: number) {}

	get(key: string): CacheValue | undefined {
		const entry = this.map.get(key);
		if (!entry) return undefined;
		if (Date.now() > entry.staleUntil) {
			this.map.delete(key);
			return undefined;
		}
		// Move to end (most recently used)
		this.map.delete(key);
		this.map.set(key, entry);
		return entry;
	}

	set(key: string, value: CacheValue): void {
		this.map.delete(key); // remove old position if exists
		if (this.map.size >= this.maxSize) {
			// Evict oldest (first entry)
			const firstKey = this.map.keys().next().value;
			if (firstKey !== undefined) this.map.delete(firstKey);
		}
		this.map.set(key, value);
	}
}

const cache = new LRUCache(10_000);
const DEFAULT_TTL = 60 * 60 * 1000; // 60 minutes
const STALE_TTL = 24 * 60 * 60 * 1000; // 24 hours — stale snapshots still served to avoid Directus load

// ---------------------------------------------------------------------------
// HTTP Response Cache (Directus data level)
//
// Caches raw HTTP responses by URL for 4 hours. This is the key layer that
// prevents Directus overload:
// - Two chart types querying the same collection share one cached response
// - Consecutive page loads reuse data without hitting Directus
// - No changes needed to individual config.ts files — transparent via fetch wrapper
// ---------------------------------------------------------------------------

const httpCache = new Map<string, { body: string; expires: number }>();
const HTTP_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const HTTP_CACHE_MAX = 2000;

/** In-flight HTTP requests — prevents duplicate fetches for the same URL */
const httpInflight = new Map<string, Promise<string>>();

/**
 * Wrap a fetch function with an HTTP response cache.
 * Only caches GET requests to base.klimadashboard.org.
 * Chart configs receive this transparently via ChartFetchParams.fetch.
 */
function createCachedFetch(baseFetch: typeof globalThis.fetch): typeof globalThis.fetch {
	return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const method = (init?.method || 'GET').toUpperCase();
		if (method !== 'GET') return baseFetch(input, init);

		const url =
			typeof input === 'string'
				? input
				: input instanceof URL
					? input.toString()
					: input.url;

		// Only cache calls to our Directus backend
		if (!url.includes('base.klimadashboard.org')) {
			return baseFetch(input, init);
		}

		// 1. Check memory cache
		const cached = httpCache.get(url);
		if (cached && Date.now() < cached.expires) {
			return new Response(cached.body, {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// 2. Check if there's already an in-flight request for this URL
		const existing = httpInflight.get(url);
		if (existing) {
			try {
				const body = await existing;
				return new Response(body, {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} catch {
				// In-flight request failed — fall through to make our own
			}
		}

		// 3. Fetch, cache, and return
		const bodyPromise = (async () => {
			const response = await baseFetch(input, init);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const body = await response.text();

			// Store in cache
			httpCache.set(url, { body, expires: Date.now() + HTTP_CACHE_TTL });

			// LRU eviction
			if (httpCache.size > HTTP_CACHE_MAX) {
				const oldest = httpCache.keys().next().value;
				if (oldest) httpCache.delete(oldest);
			}

			return body;
		})();

		httpInflight.set(url, bodyPromise);
		bodyPromise.catch(() => {}).finally(() => httpInflight.delete(url));

		try {
			const body = await bodyPromise;
			return new Response(body, {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch {
			// Cache miss and fetch failed — pass through to original fetch
			return baseFetch(input, init);
		}
	}) as typeof globalThis.fetch;
}

// ---------------------------------------------------------------------------
// In-flight deduplication (snapshot level)
// ---------------------------------------------------------------------------

/** Map of cacheKey → in-flight promise. Prevents thundering herd on cold cache. */
const inflight = new Map<string, Promise<[string, ChartSnapshot] | null>>();

/** Deduplication for translations loading */
let translationsInflight: Promise<Record<string, string>> | null = null;

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

const MAX_CONCURRENT_FETCHES = 2;

// ---------------------------------------------------------------------------
// Global concurrency cap (across ALL requests)
//
// Limits the total number of chart data fetches running simultaneously across
// the entire process. When crawlers trigger many region pages at once, this
// prevents a burst of Directus calls. Excess requests gracefully degrade to
// text-only snapshots (no data fetch, no table — just CMS text).
// ---------------------------------------------------------------------------

let globalActiveFetches = 0;
const MAX_GLOBAL_FETCHES = 4;

async function runWithConcurrency<T>(
	tasks: (() => Promise<T>)[],
	limit: number
): Promise<T[]> {
	const results: T[] = [];
	let index = 0;

	async function runNext(): Promise<void> {
		while (index < tasks.length) {
			const i = index++;
			results[i] = await tasks[i]();
		}
	}

	const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
	await Promise.all(workers);
	return results;
}

// ---------------------------------------------------------------------------
// Translations cache (separate from snapshot cache)
// ---------------------------------------------------------------------------

let translationsCache: { data: Record<string, string>; lang: string; expires: number } | null =
	null;
const TRANSLATIONS_TTL = 60 * 60 * 1000; // 60 minutes

async function loadTranslations(
	lang: string,
	fetch: typeof globalThis.fetch
): Promise<Record<string, string>> {
	if (translationsCache && translationsCache.lang === lang && Date.now() < translationsCache.expires) {
		return translationsCache.data;
	}

	// Deduplicate concurrent translation requests
	if (translationsInflight) return translationsInflight;

	translationsInflight = (async () => {
		const directus = getDirectusInstance(fetch);
		const localeLong = lang === 'de' ? 'de-DE' : 'en-US';

		try {
			const translationsData = await directus.request(
				readTranslations({
					filter: { language: localeLong },
					limit: -1
				})
			);
			const translations = (translationsData as any[]).reduce(
				(acc: Record<string, string>, { key, value }: { key: string; value: string }) => {
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string>
			);
			translationsCache = { data: translations, lang, expires: Date.now() + TRANSLATIONS_TTL };
			return translations;
		} catch {
			return {};
		} finally {
			translationsInflight = null;
		}
	})();

	return translationsInflight;
}

// ---------------------------------------------------------------------------
// Auto-discover config.ts modules
// ---------------------------------------------------------------------------

const dataModules: Record<string, () => Promise<any>> = import.meta.glob(
	'/src/lib/components/charts/custom/*/config.ts'
);

/**
 * Extract the chart type name from a glob path.
 * e.g. "/src/lib/components/charts/custom/co2PriceHistory/config.ts" → "co2PriceHistory"
 */
function chartTypeFromPath(path: string): string {
	const parts = path.split('/');
	return parts[parts.length - 2];
}

/** Build a map: chartType → module loader */
const moduleByType = new Map<string, () => Promise<any>>();
for (const [path, loader] of Object.entries(dataModules)) {
	moduleByType.set(chartTypeFromPath(path), loader);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get chart snapshots for a set of chart IDs.
 * Fetches data server-side via each chart's config.ts, caches results.
 * Charts without a config.ts fall back to text-only snapshots.
 */
export async function getChartSnapshots(
	chartIds: string[],
	regionId: string | null,
	parentIds: string[],
	lang: string,
	fetch: typeof globalThis.fetch
): Promise<Record<string, ChartSnapshot>> {
	if (chartIds.length === 0) return {};

	// Wrap fetch with HTTP response cache — all Directus calls share this cache.
	// Chart configs receive this transparently via ChartFetchParams.fetch.
	const cachedFetch = createCachedFetch(fetch);

	// Check which charts are already cached or in-flight
	const result: Record<string, ChartSnapshot> = {};
	const uncachedIds: string[] = [];
	const inflightWaits: Promise<void>[] = [];

	for (const id of chartIds) {
		const cacheKey = `${id}-${regionId || 'national'}-${lang}`;
		const cached = cache.get(cacheKey);
		if (cached) {
			result[id] = cached.snapshot;
		} else if (inflight.has(cacheKey)) {
			// Another request is already generating this snapshot — wait for it
			const chartId = id;
			inflightWaits.push(
				inflight.get(cacheKey)!.then((entry) => {
					if (entry) result[chartId] = entry[1];
				})
			);
		} else {
			uncachedIds.push(id);
		}
	}

	// Wait for any in-flight snapshots we're piggy-backing on
	if (inflightWaits.length > 0) {
		await Promise.all(inflightWaits);
	}

	if (uncachedIds.length === 0) return result;

	// Load translations for i18n resolution in chart data modules
	const translations = await loadTranslations(lang, cachedFetch);

	// Fetch chart configs from Directus for uncached charts (single batch request)
	const directus = getDirectusInstance(cachedFetch);
	let charts: any[] = [];
	try {
		charts = (await directus.request(
			readItems('charts', {
				filter: { id: { _in: uncachedIds } },
				fields: [
					'id',
					'type',
					'custom_sveltestring',
					'translations.*',
					'translations.variables.*'
				],
				deep: {
					translations: {
						_filter: { languages_code: { _eq: lang } }
					}
				},
				limit: -1
			})
		)) as any[];
	} catch (e) {
		console.warn('[chartDataService] Failed to fetch chart configs:', (e as Error)?.message || e);
		return result;
	}

	// Generate snapshots with concurrency limit and in-flight deduplication
	const tasks = charts.map((chart) => {
		const cacheKey = `${chart.id}-${regionId || 'national'}-${lang}`;

		return () => {
			// Register in-flight promise so concurrent requests can piggy-back
			const promise = generateChartSnapshot(chart, regionId, parentIds, lang, translations, cachedFetch);
			inflight.set(cacheKey, promise);
			return promise.finally(() => inflight.delete(cacheKey));
		};
	});

	const entries = await runWithConcurrency(tasks, MAX_CONCURRENT_FETCHES);

	for (const entry of entries) {
		if (entry) {
			result[entry[0]] = entry[1];
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Snapshot generation
// ---------------------------------------------------------------------------

async function generateChartSnapshot(
	chart: any,
	regionId: string | null,
	parentIds: string[],
	lang: string,
	translations: Record<string, string>,
	fetch: typeof globalThis.fetch
): Promise<[string, ChartSnapshot] | null> {
	const content = chart.translations?.[0];
	if (!content) return null;

	try {
		// Step 1: Resolve global placeholders in CMS text
		const resolvedText = (await resolvePlaceholders({
			title: content.title || '',
			heading: content.heading || '',
			text: content.text || '',
			methods: content.methods || '',
			source: content.source || ''
		})) as Record<string, string>;

		// Step 2: Try server-side data fetch via config.ts (respects global concurrency cap)
		const chartType = chart.custom_sveltestring || chart.type;
		let chartData: ChartData | null = null;

		// Global concurrency gate — only fetch data if under the system-wide limit.
		// When crawlers hit many region pages simultaneously, excess requests
		// gracefully degrade to text-only snapshots instead of overloading Directus.
		if (globalActiveFetches < MAX_GLOBAL_FETCHES) {
			globalActiveFetches++;
			try {
				chartData = await fetchChartDataWithTimeout(chartType, {
					regionId,
					parentIds,
					lang,
					fetch,
					translations
				});
			} finally {
				globalActiveFetches--;
			}
		}

		let snapshot: ChartSnapshot;

		if (chartData) {
			// Step 3: Resolve chart-specific placeholders in text
			const resolved = resolveChartPlaceholders(resolvedText, chartData.placeholders);

			// Step 4: Build serialized table
			const table = buildSnapshotTable(chartData);

			// Step 5: Use chart data source if available
			snapshot = {
				title: stripUnresolved(resolved.title),
				heading: stripUnresolved(resolved.heading),
				text: stripUnresolved(resolved.text),
				methods: stripUnresolved(resolved.methods),
				source: chartData.meta?.source || stripUnresolved(resolved.source),
				table
			};
		} else {
			// Fallback: text-only snapshot with unresolved placeholders stripped
			snapshot = {
				title: stripUnresolved(resolvedText.title),
				heading: stripUnresolved(resolvedText.heading),
				text: stripUnresolved(resolvedText.text),
				methods: stripUnresolved(resolvedText.methods),
				source: stripUnresolved(resolvedText.source)
			};
		}

		// Step 6: Cache with appropriate TTL
		const ttl = chartData ? await getChartTTL(chartType) : DEFAULT_TTL;
		const cacheKey = `${chart.id}-${regionId || 'national'}-${lang}`;
		cache.set(cacheKey, {
			snapshot,
			expires: Date.now() + ttl,
			staleUntil: Date.now() + STALE_TTL
		});

		return [chart.id, snapshot];
	} catch (e) {
		console.warn(
			`[chartDataService] Failed to generate snapshot for ${chart.id}:`,
			(e as Error)?.message || e
		);
		return null;
	}
}

/**
 * Call a chart's config.ts fetchChartData() with a timeout.
 * Returns null if no config.ts exists, fetch fails, or times out.
 */
async function fetchChartDataWithTimeout(
	chartType: string,
	params: ChartFetchParams,
	timeoutMs = 5000
): Promise<ChartData | null> {
	const loader = moduleByType.get(chartType);
	if (!loader) return null;

	try {
		const mod = await loader();
		if (typeof mod.fetchChartData !== 'function') return null;

		const result = await Promise.race([
			mod.fetchChartData(params),
			new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
		]);

		return result;
	} catch {
		return null;
	}
}

/**
 * Get the cache TTL for a chart type from its config.ts module.
 * Falls back to DEFAULT_TTL if not specified.
 */
async function getChartTTL(chartType: string): Promise<number> {
	const loader = moduleByType.get(chartType);
	if (!loader) return DEFAULT_TTL;
	try {
		const mod = await loader();
		return typeof mod.cacheTTL === 'number' ? mod.cacheTTL : DEFAULT_TTL;
	} catch {
		return DEFAULT_TTL;
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve chart-specific placeholders ({{key}}) in text fields */
function resolveChartPlaceholders(
	text: Record<string, string>,
	placeholders: Record<string, string | number | boolean | null> | undefined
): Record<string, string> {
	if (!placeholders) return text;

	const result: Record<string, string> = {};
	for (const [field, value] of Object.entries(text)) {
		let resolved = value;
		// Resolve conditional blocks: {{#if key}}...{{/if}} and {{#if not key}}...{{/if}}
		resolved = resolved.replace(
			/\{\{#if\s+(not\s+)?(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
			(_: string, negation: string | undefined, key: string, content: string) => {
				const val = placeholders[key];
				const show = negation ? !val : !!val;
				return show ? content : '';
			}
		);
		// Resolve {{placeholder}} values
		resolved = resolved.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => {
			const v = placeholders[k];
			return v !== undefined && v !== null ? String(v) : `{{${k}}}`;
		});
		result[field] = resolved;
	}
	return result;
}

/** Strip unresolved {{placeholder}} patterns from text */
function stripUnresolved(text: string): string {
	let result = text.replace(/\{\{#if\s+(not\s+)?\w+\}\}[\s\S]*?\{\{\/if\}\}/g, '');
	result = result.replace(/\{\{\w+\}\}/g, '');
	return result.trim();
}

/** Build a serializable snapshot table from ChartData */
function buildSnapshotTable(
	chartData: ChartData
): { columns: SnapshotTableColumn[]; rows: Record<string, string>[] } | undefined {
	if (!chartData.table || chartData.table.rows.length === 0) return undefined;

	const cols = chartData.table.columns;
	const rows = chartData.table.rows.slice(0, 50).map((row: Record<string, any>) => {
		const formatted: Record<string, string> = {};
		for (const col of cols) {
			const raw = row[col.key];
			formatted[col.key] = col.format ? col.format(raw) : raw != null ? String(raw) : '';
		}
		return formatted;
	});

	return {
		columns: cols.map((c) => ({ key: c.key, label: c.label })),
		rows
	};
}
