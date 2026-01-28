import { renderAndScreenshot } from '$lib/utils/screenshot';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import SocialImage from '$lib/components/SocialImage.svelte';
import { PUBLIC_VERSION } from '$env/static/public';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

	try {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('pages_translations', {
				filter: {
					_and: [{ languages_code: { _eq: 'de' } }, { slug: { _eq: params.slug } }]
				}
			})
		);

		const props = {
			eyebrow: 'Klimadashboard.' + PUBLIC_VERSION,
			title: data[0].title
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
