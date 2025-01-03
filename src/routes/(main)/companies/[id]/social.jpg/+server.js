import { getPage, releasePage } from '$lib/utils/puppeteer';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import SocialImage from '$lib/components/SocialImage.svelte';
import { PUBLIC_VERSION } from '$env/static/public';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

	const directus = getDirectusInstance(fetch);
	const data = await directus.request(
		readItem('companies', params.id, {
			fields: ['*.*']
		})
	);

	// 1. Render the component on the server
	const props = {
		imageUrl: 'https://base.klimadashboard.org/assets/' + data.logo.id,
		imageCenter: true
	};

	const { html, head, css } = SocialImage.render(props);

	// 2. Build minimal HTML to feed into Puppeteer
	const htmlContent = `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8">
					<title>${props.title}</title>
          ${head}
					<style>${css.code}</style>
				</head>
				<body>
					${html}
				</body>
			</html>
		`;

	try {
		const page = await getPage();
		await page.setContent(htmlContent, {});

		const screenshotBuffer = await page.screenshot({
			type: 'jpeg',
			fullPage: true
		});

		releasePage(page);

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
