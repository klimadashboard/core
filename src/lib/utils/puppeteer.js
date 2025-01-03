import puppeteer from 'puppeteer';
import { EventEmitter } from 'events';

const BROWSER_OPTIONS = {
	headless: true,
	args: ['--no-sandbox', '--disable-setuid-sandbox']
};

let browser;
const pagePool = [];
const MAX_PAGES = 10;
const queue = [];
const eventEmitter = new EventEmitter();
let isShuttingDown = false;

// Initialize or reuse a Puppeteer browser instance
export async function initBrowser() {
	if (!browser) {
		browser = await puppeteer.launch(BROWSER_OPTIONS);
		console.log('Puppeteer browser instance initialized.');
	}
	return browser;
}

// Create a new page or reuse an existing one
export async function getPage() {
	await initBrowser();

	if (isShuttingDown) {
		throw new Error('Cannot allocate new pages while shutting down.');
	}

	// Use an existing page from the pool
	if (pagePool.length > 0) {
		return pagePool.pop();
	}

	// Enforce page limit
	if ((await browser.pages()).length >= MAX_PAGES) {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Request for a page timed out.'));
			}, 5000); // Timeout to prevent infinite waiting

			queue.push({ resolve, reject, timeout });
		});
	}

	const page = await browser.newPage();

	// Set a timeout for navigation and content loading
	await page.setDefaultNavigationTimeout(3000); // 15 seconds
	await page.setDefaultTimeout(1000); // 10 seconds for other operations

	return page;
}
const PAGE_IDLE_TIMEOUT = 30000; // Close idle pages after 30 seconds

export function releasePage(page) {
	if (isShuttingDown) {
		page.close().catch((err) => console.error('Error closing page:', err));
		return;
	}

	// Schedule page closure if not reused
	setTimeout(() => {
		if (!pagePool.includes(page)) {
			page.close().catch((err) => console.error('Error closing idle page:', err));
		}
	}, PAGE_IDLE_TIMEOUT);

	if (pagePool.length < MAX_PAGES) {
		pagePool.push(page);
	} else {
		page.close().catch((err) => console.error('Error closing page (pool full):', err));
	}
}

// Gracefully shut down the browser
export async function closeBrowser() {
	isShuttingDown = true;

	// Close all remaining pages in the pool
	while (pagePool.length > 0) {
		const page = pagePool.pop();
		await page.close().catch((err) => console.error('Error closing page:', err));
	}

	// Close the browser
	if (browser) {
		await browser.close().catch((err) => console.error('Error closing browser:', err));
		browser = null;
		console.log('Puppeteer browser instance closed.');
	}
}

// Automatically close browser on server shutdown
process.on('SIGINT', async () => {
	console.log('SIGINT received. Shutting down Puppeteer...');
	await closeBrowser();
	process.exit();
});

process.on('SIGTERM', async () => {
	console.log('SIGTERM received. Shutting down Puppeteer...');
	await closeBrowser();
	process.exit();
});
