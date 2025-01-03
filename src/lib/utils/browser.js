import { chromium } from 'playwright';
import { EventEmitter } from 'events';

const BROWSER_OPTIONS = {
	headless: true,
	args: [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--disable-dev-shm-usage',
		'--disable-background-timer-throttling',
		'--disable-renderer-backgrounding',
		'--disable-backgrounding-occluded-windows'
	]
};

let browser;
const pagePool = [];
const MAX_PAGES = 10;
let isShuttingDown = false;

// Initialize Playwright browser instance
export async function initBrowser() {
	if (!browser) {
		try {
			browser = await chromium.launch({
				headless: BROWSER_OPTIONS.headless,
				args: BROWSER_OPTIONS.args
			});
			console.log('Playwright browser instance initialized.');
		} catch (error) {
			console.error('Failed to initialize Playwright browser:', error);
			throw error;
		}
	}
	return browser;
}

// Get a reusable page
export async function getPage() {
	try {
		await initBrowser();

		if (isShuttingDown) {
			throw new Error('Cannot allocate new pages while shutting down.');
		}

		// Ensure at least one context exists
		let context;
		if (browser.contexts().length > 0) {
			context = browser.contexts()[0];
		} else {
			context = await browser.newContext();
		}

		// Reuse an existing page if available
		if (pagePool.length > 0) {
			const page = pagePool.pop();
			if (!page.isClosed()) {
				return page;
			}
		}

		// Create a new page if the pool is empty
		const page = await context.newPage();
		page.setDefaultNavigationTimeout(10000);
		page.setDefaultTimeout(5000);
		return page;
	} catch (error) {
		console.error('Error retrieving page:', error);
		throw error;
	}
}

// Release a page back to the pool
export function releasePage(page) {
	if (isShuttingDown) {
		page.close().catch((err) => console.error('Error closing page:', err));
		return;
	}

	if (!page.isClosed() && pagePool.length < MAX_PAGES) {
		pagePool.push(page);
	} else {
		page.close().catch((err) => console.error('Error closing page (pool full):', err));
	}
}

// Gracefully shut down the browser
export async function closeBrowser() {
	isShuttingDown = true;

	// Close all pages in the pool
	while (pagePool.length > 0) {
		const page = pagePool.pop();
		if (!page.isClosed()) {
			await page.close().catch((err) => console.error('Error closing page:', err));
		}
	}

	// Close the browser
	if (browser) {
		try {
			await browser.close();
			browser = null;
			console.log('Playwright browser instance closed.');
		} catch (error) {
			console.error('Error closing browser:', error);
		}
	}
}

// Automatically close browser on server shutdown
process.on('SIGINT', async () => {
	console.log('SIGINT received. Shutting down Playwright...');
	await closeBrowser();
	process.exit();
});

process.on('SIGTERM', async () => {
	console.log('SIGTERM received. Shutting down Playwright...');
	await closeBrowser();
	process.exit();
});
