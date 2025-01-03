import { renderAndScreenshot } from '$lib/utils/screenshot';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import Chart from '$lib/components/charts/index.svelte';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

	try {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItem('charts', params.id, {
				fields: ['*.*']
			})
		);

		// 1. Render the component on the server
		const props = {
			chart: data
		};

		// Generate the screenshot
		const screenshotBuffer = await renderAndScreenshot(Chart.render, props);

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
