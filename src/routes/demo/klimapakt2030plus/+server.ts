import type { RequestHandler } from './$types';

// TEMPORARY client preview: the live Klimapakt2030plus monitoring page with its static chart
// images swapped for our skinned embeds. Their HTML/CSS/images stay on their server (<base>);
// their scripts (tracking, cookie banner) are stripped. noindex — remove after sign-off.
const SOURCE_ORIGIN = 'https://www.klimapakt2030plus.de';
const SOURCE_URL = `${SOURCE_ORIGIN}/umsetzung/monitoring`;
const SKIN = 'metropolregion-nuernberg';
const REGION = '28a44176-b4e4-441e-9566-335366666fb9'; // Metropolregion Nürnberg

// Section on their page (TYPO3 content element id) → our chart
const CHARTS: Record<string, string> = {
	c9906: '9a9153ea-7f9a-4109-afda-4c71b6b06664', // 1. Zielpfad Klimaneutralität → emissionsRegion
	c9988: '83da4187-5bc5-4a5d-8624-559364db7a32', // 2.1 Erneuerbare Stromerzeugung → renewableShareRegions
	c9989: '4c15342e-c329-4ab2-9748-205f35613a7e', // 2.2 EE im interkommunalen Vergleich → PV-Ausbau
	c9990: '8267b6b9-605d-4603-a8b4-4ad9e6a3c553', // 3.1 Heizwärmebedarf → heatingRegions
	c9993: '4895ac82-30f2-4afa-9fc5-76ef2c6eec55', // 4.1 Modal Split → modalSplit
	c9995: 'bab99342-d1be-41ce-a1f9-93554e7f1f24', // 4.2 Ausbau des ÖPNV → ptSupply
	c9998: 'd9f6b8a7-36b0-4be2-95b1-d5d3cfedf7ae' // 5.1 Wirtschaft → greenJobAds
};

const CACHE_TTL = 60 * 60 * 1000;
let cache: { html: string; expires: number } | null = null;

function transform(source: string, origin: string): string {
	let html = source
		.replace(/<script\b[\s\S]*?<\/script>/gi, '')
		.replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
		.replace(
			/<head([^>]*)>/i,
			`<head$1><base href="${SOURCE_ORIGIN}/"><meta name="robots" content="noindex, nofollow">`
		);

	for (const [frameId, chartId] of Object.entries(CHARTS)) {
		const start = html.indexOf(`<div id="${frameId}"`);
		if (start === -1) continue;
		const next = html.indexOf('<div id="c', start + 10);
		const end = next === -1 ? html.length : next;
		const frame = html.slice(start, end).replace(
			/<figure class="image">[\s\S]*?<\/figure>/,
			`<div id="kd-${frameId}"></div><script src="${origin}/embed.js" data-chart="${chartId}" data-target="kd-${frameId}" data-skin="${SKIN}" data-region="${REGION}" async></script>`
		);
		html = html.slice(0, start) + frame + html.slice(end);
	}

	const banner = `<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#18181b;color:#fff;font:13px/1.4 Arial,sans-serif;padding:6px 16px;text-align:center">Vorschau Klimadashboard-Einbindung auf klimapakt2030plus.de – nicht öffentlich</div>`;
	return html.replace(/<\/body>/i, `${banner}</body>`);
}

export const GET: RequestHandler = async ({ fetch, url }) => {
	if (!cache || cache.expires < Date.now()) {
		const res = await fetch(SOURCE_URL);
		if (!res.ok) return new Response('Source page unavailable', { status: 502 });
		cache = { html: await res.text(), expires: Date.now() + CACHE_TTL };
	}

	return new Response(transform(cache.html, url.origin), {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'X-Robots-Tag': 'noindex, nofollow',
			'Cache-Control': 'private, no-store'
		}
	});
};
