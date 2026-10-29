import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getChartEmbedOptions } from '$lib/utils/chartDataService';

// Chart-specific embed options (e.g. `mode=bestand|neuzulassungen`) for CMS plugins such as
// the TYPO3 extension. Declared statically in each chart's config.ts (`embedOptions`).
// Response: [{ key, label, choices: [{ value, label }], currentValue }]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	// Directus answers malformed uuids with a 500, so reject them here
	if (!UUID.test(params.id)) throw error(404, 'Chart not found');
	const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'de';

	let options;
	try {
		options = await getChartEmbedOptions(params.id, lang, fetch);
	} catch {
		throw error(503, 'Data backend unavailable — please try again shortly');
	}
	if (options === null) throw error(404, 'Chart not found');

	return json(options, {
		headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' }
	});
};
