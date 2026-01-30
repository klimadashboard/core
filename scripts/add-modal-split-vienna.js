/**
 * Script to add Modal Split data for Vienna to Directus
 *
 * Usage:
 *   DIRECTUS_TOKEN=your_token node scripts/add-modal-split-vienna.js
 *
 * Prerequisites:
 *   - Set DIRECTUS_TOKEN environment variable with an admin token
 *
 * Data source: Vienna modal split data (miv = motorized individual traffic)
 * Note: miv is split into car_driver (assuming all as driver for simplicity)
 */

import { createDirectus, rest, staticToken, createItems, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/add-modal-split-vienna.js');
	process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// Vienna region ID
const VIENNA_REGION_ID = '3cb1aa0a-e18d-47c0-8019-1baa67175b0f';

// Vienna modal split data
// miv = Motorisierter Individualverkehr (car_driver in our schema)
// Note: If you need to split miv into car_driver/car_passenger, adjust the mapping below
const viennaData = [
	{ year: 2024, miv: 25, bike: 11, public: 34, foot: 30 },
	{ year: 2023, miv: 26, bike: 10, public: 32, foot: 32 },
	{ year: 2022, miv: 26, bike: 9, public: 30, foot: 35 },
	{ year: 2021, miv: 26, bike: 9, public: 30, foot: 35 },
	{ year: 2020, miv: 27, bike: 9, public: 27, foot: 37 }
];

// Transform data into the format expected by mobility_modal_split table
function transformData(rawData) {
	const records = [];
	const today = new Date().toISOString().split('T')[0];

	for (const row of rawData) {
		// Map each category to a separate record
		records.push({
			year: row.year,
			region: VIENNA_REGION_ID,
			category: 'on_foot',
			value: row.foot,
			update: today,
			source: 'Stadt Wien'
		});

		records.push({
			year: row.year,
			region: VIENNA_REGION_ID,
			category: 'bicycle',
			value: row.bike,
			update: today,
			source: 'Stadt Wien'
		});

		records.push({
			year: row.year,
			region: VIENNA_REGION_ID,
			category: 'public_transport',
			value: row.public,
			update: today,
			source: 'Stadt Wien'
		});

		// miv (motorized individual traffic) - stored as car_driver
		// If you need to split into driver/passenger, adjust this
		records.push({
			year: row.year,
			region: VIENNA_REGION_ID,
			category: 'car_driver',
			value: row.miv,
			update: today,
			source: 'Stadt Wien'
		});
	}

	return records;
}

async function checkExistingData() {
	try {
		const existing = await directus.request(
			readItems('mobility_modal_split', {
				filter: { region: { _eq: VIENNA_REGION_ID } },
				fields: ['year', 'category'],
				limit: -1
			})
		);
		return existing;
	} catch (error) {
		console.error('Error checking existing data:', error);
		return [];
	}
}

async function addModalSplitData() {
	console.log('Checking for existing Vienna data...');
	const existing = await checkExistingData();

	if (existing.length > 0) {
		console.log(`Found ${existing.length} existing records for Vienna.`);
		console.log('Existing data:');
		const years = [...new Set(existing.map((r) => r.year))].sort();
		console.log(`  Years: ${years.join(', ')}`);
		console.log('\nTo avoid duplicates, please delete existing data first if you want to replace it.');
		console.log('Or modify this script to skip existing year/category combinations.\n');

		const readline = await import('readline');
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const answer = await new Promise((resolve) => {
			rl.question('Continue anyway and add new records? (y/N): ', resolve);
		});
		rl.close();

		if (answer.toLowerCase() !== 'y') {
			console.log('Aborted.');
			process.exit(0);
		}
	}

	const records = transformData(viennaData);
	console.log(`\nPrepared ${records.length} records to insert:`);
	console.log('Sample record:', JSON.stringify(records[0], null, 2));

	try {
		// Insert in batches
		const batchSize = 50;
		for (let i = 0; i < records.length; i += batchSize) {
			const batch = records.slice(i, i + batchSize);
			await directus.request(createItems('mobility_modal_split', batch));
			console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
		}

		console.log('\nSuccessfully added all Vienna modal split data!');
	} catch (error) {
		console.error('Error inserting data:', error);
		process.exit(1);
	}
}

// Run the script
addModalSplitData();
