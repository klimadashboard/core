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

	// Create a new page if limit not reached
	return browser.newPage();
}

// Return a page to the pool
export function releasePage(page) {
	if (isShuttingDown) {
		// Close pages immediately during shutdown
		page.close().catch((err) => console.error('Error closing page:', err));
		return;
	}

	if (pagePool.length < MAX_PAGES) {
		pagePool.push(page);
	} else {
		// Close pages if the pool is full
		page.close().catch((err) => console.error('Error closing page:', err));
	}

	// Process the next item in the queue
	if (queue.length > 0) {
		const { resolve, reject, timeout } = queue.shift();
		clearTimeout(timeout);
		getPage().then(resolve).catch(reject);
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
