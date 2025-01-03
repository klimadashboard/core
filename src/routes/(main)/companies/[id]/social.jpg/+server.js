import { renderAndScreenshot } from '$lib/utils/screenshot';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import SocialImage from '$lib/components/SocialImage.svelte';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

	try {
		// Fetch data from Directus
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItem('companies', params.id, {
				fields: ['*.*']
			})
		);

		// Prepare props for the Svelte component
		const props = {
			imageUrl: `https://base.klimadashboard.org/assets/${data.logo.id}`,
			imageCenter: true
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
