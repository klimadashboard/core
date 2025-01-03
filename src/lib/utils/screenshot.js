import { getPage, releasePage } from '$lib/utils/browser';

async function retrySetContent(page, htmlContent, retries = 3) {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
			return;
		} catch (error) {
			console.warn(`Retrying setContent (${attempt + 1}/${retries}) due to error:`, error);
			if (attempt === retries - 1) throw error;
		}
	}
}

export async function renderAndScreenshot(renderFunction, props) {
	const { html, head, css } = renderFunction(props);

	const htmlContent = `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>${props.title || 'Image'}</title>
				${head}
				<style>${css.code}</style>
			</head>
			<body>
				${html}
			</body>
		</html>
	`;

	const page = await getPage();

	try {
		// Ensure the page is valid and retry on failure
		if (!page || page.isClosed()) {
			throw new Error('Page is invalid or has been closed.');
		}

		await retrySetContent(page, htmlContent);

		const screenshotBuffer = await page.screenshot({
			type: 'jpeg',
			fullPage: true
		});

		return screenshotBuffer;
	} finally {
		releasePage(page);
	}
}
