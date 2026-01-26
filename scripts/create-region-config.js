/**
 * Script to create regions_config collection and seed initial configs
 *
 * Usage:
 *   DIRECTUS_TOKEN=your_token node scripts/create-region-config.js
 *
 * This script will:
 *   1. Create the regions_config collection (if it doesn't exist)
 *   2. Create the regions_config_translations collection
 *   3. Add default configs for Austria and Germany
 */

import {
	createDirectus,
	rest,
	staticToken,
	readItems,
	createItems,
	createCollection,
	createField
} from '@directus/sdk';

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/create-region-config.js');
	process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// Region IDs
const REGION_AT = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81'; // Austria
const REGION_DE = '3d5acf1a-8120-44d1-966b-62c21fa5d331'; // Germany

// Default configs for Austria and Germany
const configs = [
	{
		region: REGION_AT,
		layout: {
			show_intro: true,
			show_map: true,
			show_illustrations: true,
			show_statistics: true
		},
		translations: [
			{
				languages_code: 'de',
				intro_text:
					'Das Klimadashboard {regionName} zeigt die Auswirkungen der Klimakrise in deiner Region und begleitet die Umsetzung der Energie- und Mobilitätswende und weitere Klimaschutzmaßnahmen bei dir vor Ort.',
				explore_map_label: 'Datenlandkarte erkunden',
				scroll_for_more_label: 'Scrollen für mehr Daten',
				how_would_it_be_better_label: "Wie wär's besser?"
			},
			{
				languages_code: 'en',
				intro_text:
					'The Klimadashboard {regionName} shows the effects of the climate crisis in your region and accompanies the implementation of the energy and mobility transition and other climate protection measures in your area.',
				explore_map_label: 'Explore data map',
				scroll_for_more_label: 'Scroll for more data',
				how_would_it_be_better_label: 'How could it be better?'
			}
		]
	},
	{
		region: REGION_DE,
		layout: {
			show_intro: true,
			show_map: true,
			show_illustrations: true,
			show_statistics: true
		},
		translations: [
			{
				languages_code: 'de',
				intro_text:
					'Das Klimadashboard {regionName} zeigt die Auswirkungen der Klimakrise in deiner Region und begleitet die Umsetzung der Energie- und Mobilitätswende und weitere Klimaschutzmaßnahmen bei dir vor Ort.',
				explore_map_label: 'Datenlandkarte erkunden',
				scroll_for_more_label: 'Scrollen für mehr Daten',
				how_would_it_be_better_label: "Wie wär's besser?"
			},
			{
				languages_code: 'en',
				intro_text:
					'The Klimadashboard {regionName} shows the effects of the climate crisis in your region and accompanies the implementation of the energy and mobility transition and other climate protection measures in your area.',
				explore_map_label: 'Explore data map',
				scroll_for_more_label: 'Scroll for more data',
				how_would_it_be_better_label: 'How could it be better?'
			}
		]
	}
];

async function collectionExists(collectionName) {
	try {
		const response = await fetch(`${DIRECTUS_URL}/collections/${collectionName}`, {
			headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
		});
		return response.ok;
	} catch {
		return false;
	}
}

async function createCollections() {
	console.log('Checking if collections exist...');

	// Check if main collection exists
	if (await collectionExists('regions_config')) {
		console.log('Collection regions_config already exists, skipping creation');
		return;
	}

	console.log('Creating regions_config collection...');

	// Create main collection
	try {
		await fetch(`${DIRECTUS_URL}/collections`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config',
				meta: {
					collection: 'regions_config',
					icon: 'settings',
					note: 'Page configuration for region pages with hierarchy inheritance',
					display_template: '{{region.name}}',
					translations: [
						{ language: 'en-US', translation: 'Region Page Config' },
						{ language: 'de-DE', translation: 'Regionen-Seiten-Konfiguration' }
					]
				},
				schema: {
					name: 'regions_config'
				},
				fields: [
					{
						field: 'id',
						type: 'uuid',
						meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
						schema: { is_primary_key: true, has_auto_increment: false }
					},
					{
						field: 'date_created',
						type: 'timestamp',
						meta: {
							hidden: true,
							readonly: true,
							interface: 'datetime',
							special: ['date-created']
						},
						schema: {}
					},
					{
						field: 'date_updated',
						type: 'timestamp',
						meta: {
							hidden: true,
							readonly: true,
							interface: 'datetime',
							special: ['date-updated']
						},
						schema: {}
					}
				]
			})
		});
		console.log('Created regions_config collection');
	} catch (error) {
		console.error('Error creating regions_config:', error);
		throw error;
	}

	// Add region field (M2O relationship to regions)
	console.log('Adding region field...');
	try {
		await fetch(`${DIRECTUS_URL}/fields/regions_config`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				field: 'region',
				type: 'uuid',
				meta: {
					interface: 'select-dropdown-m2o',
					special: ['m2o'],
					required: true,
					options: {
						template: '{{name}}'
					},
					display: 'related-values',
					display_options: {
						template: '{{name}}'
					}
				},
				schema: {
					is_unique: true,
					foreign_key_column: 'id',
					foreign_key_table: 'regions'
				}
			})
		});
		console.log('Added region field');
	} catch (error) {
		console.error('Error adding region field:', error);
	}

	// Add layout field (JSON)
	console.log('Adding layout field...');
	try {
		await fetch(`${DIRECTUS_URL}/fields/regions_config`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				field: 'layout',
				type: 'json',
				meta: {
					interface: 'input-code',
					options: { language: 'json' },
					note: 'Layout configuration (show_intro, show_map, show_illustrations, show_statistics)'
				},
				schema: {}
			})
		});
		console.log('Added layout field');
	} catch (error) {
		console.error('Error adding layout field:', error);
	}

	// Create translations collection
	console.log('Creating regions_config_translations collection...');
	try {
		await fetch(`${DIRECTUS_URL}/collections`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_translations',
				meta: {
					collection: 'regions_config_translations',
					icon: 'translate',
					hidden: true
				},
				schema: {
					name: 'regions_config_translations'
				},
				fields: [
					{
						field: 'id',
						type: 'integer',
						meta: { hidden: true, interface: 'input', readonly: true },
						schema: { is_primary_key: true, has_auto_increment: true }
					},
					{
						field: 'regions_config_id',
						type: 'uuid',
						meta: { hidden: true },
						schema: {
							foreign_key_column: 'id',
							foreign_key_table: 'regions_config'
						}
					},
					{
						field: 'languages_code',
						type: 'string',
						meta: {
							interface: 'select-dropdown',
							options: {
								choices: [
									{ text: 'Deutsch', value: 'de' },
									{ text: 'English', value: 'en' }
								]
							},
							width: 'half'
						},
						schema: {}
					},
					{
						field: 'intro_text',
						type: 'text',
						meta: {
							interface: 'input-multiline',
							note: 'Intro text with {regionName} placeholder'
						},
						schema: {}
					},
					{
						field: 'explore_map_label',
						type: 'string',
						meta: { interface: 'input' },
						schema: {}
					},
					{
						field: 'scroll_for_more_label',
						type: 'string',
						meta: { interface: 'input' },
						schema: {}
					},
					{
						field: 'how_would_it_be_better_label',
						type: 'string',
						meta: { interface: 'input' },
						schema: {}
					}
				]
			})
		});
		console.log('Created regions_config_translations collection');
	} catch (error) {
		console.error('Error creating translations collection:', error);
	}

	// Add translations relationship via relations endpoint
	console.log('Adding translations relationship...');
	try {
		await fetch(`${DIRECTUS_URL}/relations`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_translations',
				field: 'regions_config_id',
				related_collection: 'regions_config',
				meta: {
					one_field: 'translations',
					sort_field: null,
					one_deselect_action: 'nullify'
				},
				schema: {
					on_delete: 'SET NULL'
				}
			})
		});
		console.log('Added translations relationship');
	} catch (error) {
		console.error('Error adding translations relationship:', error);
	}

	// Add translations alias field to main collection
	console.log('Adding translations alias field...');
	try {
		await fetch(`${DIRECTUS_URL}/fields/regions_config`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				field: 'translations',
				type: 'alias',
				meta: {
					interface: 'translations',
					special: ['translations'],
					options: {
						languageField: 'languages_code'
					}
				},
				schema: null
			})
		});
		console.log('Added translations alias field');
	} catch (error) {
		console.error('Error adding translations alias field:', error);
	}
}

async function seedConfigs() {
	console.log('\nSeeding region configs...');

	// Check if configs already exist
	try {
		const existing = await directus.request(
			readItems('regions_config', {
				filter: {
					region: { _in: [REGION_AT, REGION_DE] }
				},
				fields: ['id', 'region']
			})
		);

		if (existing.length > 0) {
			console.log(`Found ${existing.length} existing configs, skipping seed`);
			return;
		}
	} catch (error) {
		console.log('Could not check existing configs, proceeding with seed');
	}

	// Insert configs and translations separately
	for (const config of configs) {
		try {
			// First, create the main config without translations
			const response = await fetch(`${DIRECTUS_URL}/items/regions_config`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					region: config.region,
					layout: config.layout
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(JSON.stringify(error));
			}

			const result = await response.json();
			const configId = result.data.id;
			console.log(`Created config ${configId} for region ${config.region}`);

			// Then, create the translations linking to this config
			for (const translation of config.translations) {
				const transResponse = await fetch(`${DIRECTUS_URL}/items/regions_config_translations`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${DIRECTUS_TOKEN}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						regions_config_id: configId,
						...translation
					})
				});

				if (!transResponse.ok) {
					const error = await transResponse.json();
					console.error(`Error creating ${translation.languages_code} translation:`, error);
				} else {
					console.log(`  Added ${translation.languages_code} translation`);
				}
			}
		} catch (error) {
			console.error(`Error creating config for ${config.region}:`, error);
		}
	}

	console.log('Seeding complete!');
}

async function main() {
	try {
		await createCollections();
		await seedConfigs();
		console.log('\nDone!');
	} catch (error) {
		console.error('Script failed:', error);
		process.exit(1);
	}
}

main();
