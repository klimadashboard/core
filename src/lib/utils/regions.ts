// src/lib/cache/regionCache.ts
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';
import { readItems } from '@directus/sdk';

let memoryCache: any[] | null = null;
const DB_NAME = 'RegionCacheDB';
const STORE_NAME = 'regions';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function getFromDB<T>(key: string): Promise<T | null> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readonly');
				const store = tx.objectStore(STORE_NAME);
				const request = store.get(key);
				request.onsuccess = () => resolve(request.result ?? null);
				request.onerror = () => reject(request.error);
			})
	);
}

function setInDB<T>(key: string, value: T): Promise<void> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				store.put(value, key);
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			})
	);
}

export async function getRegions(forceRefresh = false): Promise<any[]> {
	if (typeof window === 'undefined') return []; // SSR guard

	// Return memory cache unless forcing refresh
	if (memoryCache && !forceRefresh) return memoryCache;

	if (!forceRefresh) {
		try {
			const [cached, timestamp] = await Promise.all([
				getFromDB<any[]>('data'),
				getFromDB<number>('timestamp')
			]);

			const now = Date.now();
			if (cached && timestamp && now - timestamp < CACHE_DURATION) {
				memoryCache = cached;
				return cached;
			}
		} catch (err) {
			console.warn('Failed to read regions from indexedDB:', err);
		}
	}

	const directus = getDirectusInstance();

	let filter;

	if (PUBLIC_VERSION == 'org') {
		filter = {};
	} else {
		filter = {
			country: {
				_eq: PUBLIC_VERSION.toUpperCase()
			}
		};
	}

	// Fetch from Directus
	const regions = await directus.request(
		readItems('regions', {
			limit: -1,
			filter: filter,
			fields: [
				'id',
				'name',
				'code',
				'code_short',
				'country',
				'outline_simple',
				'population',
				'area',
				'center',
				'parents',
				'layer',
				'layer_label',
				'visible'
			]
		})
	);

	// Save to memory and IndexedDB
	memoryCache = regions;
	try {
		await Promise.all([setInDB('data', regions), setInDB('timestamp', Date.now())]);
	} catch (err) {
		console.warn('Failed to write regions to indexedDB:', err);
	}

	return regions;
}
