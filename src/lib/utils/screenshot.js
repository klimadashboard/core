import { getPage, releasePage } from '$lib/utils/browser';
import path from 'path';
import fs from 'fs/promises';

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

async function loadAllCSS() {
	const cssDir = path.resolve('build/client/_app/immutable/assets'); // Adjust path as needed
	try {
		// Read the directory and find all .css files
		const files = await fs.readdir(cssDir);
		const cssFiles = files.filter((file) => file.endsWith('.css'));

		// Read and concatenate all CSS file contents
		const cssContents = await Promise.all(
			cssFiles.map((file) => fs.readFile(path.join(cssDir, file), 'utf-8'))
		);

		return cssContents.join('\n'); // Combine all CSS into a single string
	} catch (error) {
		console.error('Error loading CSS files:', error);
		return '';
	}
}

export async function renderAndScreenshot(renderFunction, props) {
	// Load all CSS files from the assets folder
	const allCSS = await loadAllCSS();

	// Render the Svelte component
	const { html, head, css } = renderFunction(props);

	// Combine loaded CSS with the component's scoped CSS
	const htmlContent = `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>${props.title || 'Image'}</title>
				${head}
				<style>${allCSS}</style>
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
