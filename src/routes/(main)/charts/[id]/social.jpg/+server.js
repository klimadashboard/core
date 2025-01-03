import puppeteer from 'puppeteer';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import SocialImage from '$lib/components/SocialImage.svelte';
import { PUBLIC_VERSION } from '$env/static/public';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ url, params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

	const directus = getDirectusInstance(fetch);
	const data = await directus.request(
		readItem('charts', params.id, {
			fields: ['*.*']
		})
	);

	try {
		// 1. Render the component on the server
		const props = {
			eyebrow: 'Klimadashboard.' + PUBLIC_VERSION,
			imageUrl: `${url.origin}/charts/${params.id}/chart.jpg`
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

		// 3. Launch Puppeteer, set content, and take a screenshot
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.setContent(htmlContent, {});

		const screenshotBuffer = await page.screenshot({
			type: 'jpeg',
			fullPage: true
		});

		await browser.close();

		// 4. Return the JPEG image
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
