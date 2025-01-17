import { renderAndScreenshot } from '$lib/utils/screenshot';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import SocialImage from '$lib/components/SocialImage.svelte';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ url, params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

	try {
		// Fetch data from Directus
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItem('charts', params.id, {
				fields: ['*.*']
			})
		);

		// Prepare props for the Svelte component
		const props = {
			eyebrow: 'Klimadashboard.' + PUBLIC_VERSION,
			imageUrl: `${url.origin}/charts/${params.id}/chart.jpg`
		};

		// Generate the screenshot
		const screenshotBuffer = await renderAndScreenshot(SocialImage.render, props);

		return new Response(screenshotBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'image/jpeg',
				'Content-Disposition': 'inline; filename="social.jpg"'
			}
		});
	} catch (error) {
		console.error('Error generating image:', error);
		return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
			status: 500
		});
	}
}
