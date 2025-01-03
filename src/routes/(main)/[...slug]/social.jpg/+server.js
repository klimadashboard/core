import { getPage, releasePage } from '$lib/utils/puppeteer';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import SocialImage from '$lib/components/SocialImage.svelte';
import { PUBLIC_VERSION } from '$env/static/public';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=60'
	});

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

	const { html, head, css } = SocialImage.render(props);

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
