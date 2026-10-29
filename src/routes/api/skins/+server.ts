import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listSkins } from '$lib/skins';

// Public list of embed skins, e.g. for the TYPO3 extension's skin select
export const GET: RequestHandler = () =>
	json(listSkins(), {
		headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' }
	});
