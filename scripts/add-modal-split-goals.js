/**
 * Script to add Modal Split Goals to Directus
 *
 * This script:
 * 1. Creates the mobility_modal_split_goals collection if it doesn't exist
 * 2. Adds the Stuttgart goal (region: dd4fd7ac-aa2b-4762-8902-1be6ef2fcdb2)
 *
 * Usage:
 *   DIRECTUS_TOKEN=your_token node scripts/add-modal-split-goals.js
 *
 * Prerequisites:
 *   - Set DIRECTUS_TOKEN environment variable with an admin token
 *
 * Schema:
 *   - id: uuid (auto)
 *   - region: relation to regions (M2O)
 *   - target_year: integer
 *   - goal_type: string ('sustainable_total' | 'category_specific' | 'multi_year_path')
 *   - sustainable_target: decimal (nullable) - % for sustainable transport
 *   - category_targets: JSON (nullable) - specific targets per category
 *   - goal_path: JSON (nullable) - multi-year milestone path
 *   - source: string
 *   - update: date
 */

import {
	createDirectus,
	rest,
	staticToken,
	createCollection,
	createField,
	createItems,
	readItems,
	readCollections
} from '@directus/sdk';

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/add-modal-split-goals.js');
	process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

const COLLECTION_NAME = 'mobility_modal_split_goals';

// Region IDs
const STUTTGART_REGION_ID = 'dd4fd7ac-aa2b-4762-8902-1be6ef2fcdb2';
const VIENNA_REGION_ID = '3cb1aa0a-e18d-47c0-8019-1baa67175b0f';

// Goals to add
const goals = [
	{
		name: 'Stuttgart',
		region: STUTTGART_REGION_ID,
		target_year: 2035,
		goal_type: 'sustainable_total',
		sustainable_target: 66,
		category_targets: null,
		goal_path: null,
		source: 'Klimamobilitätsplan Stuttgart',
		update: new Date().toISOString().split('T')[0]
	},
	{
		name: 'Vienna',
		region: VIENNA_REGION_ID,
		target_year: 2030,
		goal_type: 'sustainable_total',
		sustainable_target: 85,
		category_targets: null,
		goal_path: null,
		source: 'Stadt Wien',
		update: new Date().toISOString().split('T')[0]
	}
];

async function collectionExists() {
	try {
		const collections = await directus.request(readCollections());
		return collections.some((c) => c.collection === COLLECTION_NAME);
	} catch (error) {
		console.error('Error checking collections:', error);
		return false;
	}
}

async function createSchema() {
	console.log(`Creating collection: ${COLLECTION_NAME}...`);

	try {
		// Create the collection
		await directus.request(
			createCollection({
				collection: COLLECTION_NAME,
				meta: {
					collection: COLLECTION_NAME,
					icon: 'flag',
					note: 'Modal split goals/targets for regions',
					display_template: '{{region.name}} - {{target_year}}',
					archive_field: null,
					archive_value: null,
					unarchive_value: null,
					sort_field: null,
					singleton: false,
					translations: null
				},
				schema: {
					name: COLLECTION_NAME,
					comment: 'Modal split goals and targets for regions'
				},
				fields: [
					{
						field: 'id',
						type: 'uuid',
						meta: {
							hidden: true,
							readonly: true,
							interface: 'input',
							special: ['uuid']
						},
						schema: {
							is_primary_key: true,
							has_auto_increment: false
						}
					}
				]
			})
		);

		console.log('Collection created. Adding fields...');

		// Add region field (M2O relation)
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'region',
				type: 'uuid',
				meta: {
					interface: 'select-dropdown-m2o',
					special: ['m2o'],
					display: 'related-values',
					display_options: {
						template: '{{name}}'
					},
					required: true,
					note: 'The region this goal applies to'
				},
				schema: {
					is_nullable: false,
					foreign_key_table: 'regions',
					foreign_key_column: 'id'
				}
			})
		);
		console.log('  - Added: region');

		// Add target_year field
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'target_year',
				type: 'integer',
				meta: {
					interface: 'input',
					required: true,
					note: 'Target year for achieving the goal'
				},
				schema: {
					is_nullable: false
				}
			})
		);
		console.log('  - Added: target_year');

		// Add goal_type field
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'goal_type',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: 'Sustainable Total %', value: 'sustainable_total' },
							{ text: 'Category Specific', value: 'category_specific' },
							{ text: 'Multi-Year Path', value: 'multi_year_path' }
						]
					},
					required: true,
					note: 'Type of goal: overall sustainable %, per-category targets, or multi-year path'
				},
				schema: {
					is_nullable: false,
					default_value: 'sustainable_total'
				}
			})
		);
		console.log('  - Added: goal_type');

		// Add sustainable_target field
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'sustainable_target',
				type: 'decimal',
				meta: {
					interface: 'input',
					note: 'Target percentage for sustainable transport (on_foot + bicycle + e_bike + public_transport). Used when goal_type = sustainable_total'
				},
				schema: {
					is_nullable: true,
					numeric_precision: 5,
					numeric_scale: 2
				}
			})
		);
		console.log('  - Added: sustainable_target');

		// Add category_targets field (JSON)
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'category_targets',
				type: 'json',
				meta: {
					interface: 'input-code',
					options: {
						language: 'json'
					},
					note: 'JSON object with category-specific targets. Example: {"on_foot": 35, "bicycle": 15, "public_transport": 40, "car_driver": 10}'
				},
				schema: {
					is_nullable: true
				}
			})
		);
		console.log('  - Added: category_targets');

		// Add goal_path field (JSON)
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'goal_path',
				type: 'json',
				meta: {
					interface: 'input-code',
					options: {
						language: 'json'
					},
					note: 'JSON array with multi-year milestones. Example: [{"year": 2030, "sustainable": 60}, {"year": 2035, "sustainable": 66}]'
				},
				schema: {
					is_nullable: true
				}
			})
		);
		console.log('  - Added: goal_path');

		// Add source field
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'source',
				type: 'string',
				meta: {
					interface: 'input',
					note: 'Source of the goal (e.g., Klimamobilitätsplan Stuttgart)'
				},
				schema: {
					is_nullable: true
				}
			})
		);
		console.log('  - Added: source');

		// Add update field
		await directus.request(
			createField(COLLECTION_NAME, {
				field: 'update',
				type: 'date',
				meta: {
					interface: 'datetime',
					note: 'Date when this goal was last updated'
				},
				schema: {
					is_nullable: true
				}
			})
		);
		console.log('  - Added: update');

		console.log('\nSchema created successfully!');
		return true;
	} catch (error) {
		console.error('Error creating schema:', error);
		return false;
	}
}

async function checkExistingGoal(regionId) {
	try {
		const existing = await directus.request(
			readItems(COLLECTION_NAME, {
				filter: { region: { _eq: regionId } },
				limit: 1
			})
		);
		return existing.length > 0;
	} catch (error) {
		return false;
	}
}

async function addGoals() {
	console.log('\nAdding goals...');

	for (const goal of goals) {
		const { name, ...goalData } = goal;

		console.log(`\nChecking for existing ${name} goal...`);

		if (await checkExistingGoal(goal.region)) {
			console.log(`${name} goal already exists. Skipping.`);
			continue;
		}

		console.log(`Adding ${name} goal...`);

		try {
			await directus.request(createItems(COLLECTION_NAME, [goalData]));
			console.log(`${name} goal added successfully!`);
			console.log(`  - Region: ${name} (${goal.region})`);
			console.log(`  - Target Year: ${goal.target_year}`);
			console.log(`  - Goal Type: ${goal.goal_type}`);
			console.log(`  - Sustainable Target: ${goal.sustainable_target}%`);
			console.log(`  - Source: ${goal.source}`);
		} catch (error) {
			console.error(`Error adding ${name} goal:`, error);
		}
	}
}

async function main() {
	console.log('='.repeat(60));
	console.log('Modal Split Goals - Schema & Data Setup');
	console.log('='.repeat(60));

	// Check if collection exists
	if (await collectionExists()) {
		console.log(`Collection '${COLLECTION_NAME}' already exists.`);
	} else {
		console.log(`Collection '${COLLECTION_NAME}' does not exist. Creating...`);
		const success = await createSchema();
		if (!success) {
			console.error('Failed to create schema. Exiting.');
			process.exit(1);
		}
	}

	// Add goals
	await addGoals();

	console.log('\n' + '='.repeat(60));
	console.log('Done!');
	console.log('='.repeat(60));
}

main();
