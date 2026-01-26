/**
 * Script to add sections to regions_config
 *
 * Usage:
 *   DIRECTUS_TOKEN=your_token node scripts/add-region-sections.js
 *
 * This script will:
 *   1. Create regions_config_sections collection
 *   2. Create regions_config_sections_translations collection
 *   3. Create regions_config_sections_charts junction table
 *   4. Seed sections for Austria and Germany configs
 */

import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/add-region-sections.js');
	process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// Region IDs (same as in create-region-config.js)
const REGION_AT = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81'; // Austria
const REGION_DE = '3d5acf1a-8120-44d1-966b-62c21fa5d331'; // Germany

// Map region IDs to country codes
const regionToCountry = {
	[REGION_AT]: 'at',
	[REGION_DE]: 'de'
};

// Section definitions with translations and charts
// Icons are SVG strings from Tabler Icons
const sectionDefinitions = {
	emissions: {
		id: 'emissions',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878' /></svg>",
		translations: {
			de: {
				title: 'Emissionen',
				description:
					'Die Reduktion von Treibhausgasemissionen ist von entscheidender Bedeutung. Doch wie sieht es in deiner Region aus? Erkunde, wie sich die Emissionen auf verschiedene Sektoren verteilen und wie sich diese über die letzten Jahre verändert haben.'
			},
			en: {
				title: 'Emissions',
				description:
					'Reducing greenhouse gas emissions is crucial. But what does it look like in your region? Explore how emissions are distributed across different sectors and how they have changed over recent years.'
			}
		},
		charts: {
			at: [
				{ id: 'cae6032b-86a9-45d0-bc11-17343845b25a', span: 6 },
				{ id: '19ad92e0-430d-4ba9-8009-f7add39c85bb', span: 6 }
			],
			de: [
				{ id: 'cae6032b-86a9-45d0-bc11-17343845b25a', span: 6 },
				{ id: '19ad92e0-430d-4ba9-8009-f7add39c85bb', span: 6 }
			]
		}
	},
	energy: {
		id: 'energy',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11' /></svg>",
		translations: {
			de: {
				title: 'Energie',
				description:
					'Erneuerbare Energien spielen eine zentrale Rolle für die Energiewende – doch wie weit ist der Ausbau vor Ort? Erkunde, wie viel Solar- und Windenergie in {regionName} bereits installiert ist.'
			},
			en: {
				title: 'Energy',
				description:
					'Renewable energies play a central role in the energy transition – but how far has the expansion progressed locally? Explore how much solar and wind energy is already installed in {regionName}.'
			}
		},
		charts: {
			at: [],
			de: [
				{ id: '4c15342e-c329-4ab2-9748-205f35613a7e', span: 6 },
				{ id: '5987865b-488b-44ed-87fe-b9fe54d965b8', span: 6 },
				{ id: 'ecb058fc-06c6-4092-b1a7-dccdf6736d46', span: 6 },
				{ id: '1e135ce2-06d2-4eae-b8f8-fdb4cbae910c', span: 6 }
			]
		}
	},
	mobility: {
		id: 'mobility',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' /><path d='M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' /><path d='M12 14l0 7' /><path d='M10 12l-6.75 -2' /><path d='M14 12l6.75 -2' /></svg>",
		translations: {
			de: {
				title: 'Mobilität',
				description:
					'Der Verkehrsbereich verursacht einen großen Teil der Treibhausgasemissionen. Wie klimafreundlich Mobilität in {regionName} ist, hängt unter anderem von Infrastruktur, Verkehrsangebot und Alltagsgewohnheiten ab – und hat direkten Einfluss auf das Klima.'
			},
			en: {
				title: 'Mobility',
				description:
					'The transport sector causes a large part of greenhouse gas emissions. How climate-friendly mobility is in {regionName} depends on infrastructure, transport options and daily habits – and has a direct impact on the climate.'
			}
		},
		charts: {
			at: [
				{ id: '4895ac82-30f2-4afa-9fc5-76ef2c6eec55', span: 12 },
				{ id: '68b0f853-b1b1-4120-aedd-87de58ea3209', span: 6 },
				{ id: 'e8c13d08-089f-4782-844a-06b8f19e4d54', span: 6 },
				{ id: '1b519edc-a120-4519-a008-0e0cec99fe91', span: 6 }
			],
			de: [
				{ id: '4895ac82-30f2-4afa-9fc5-76ef2c6eec55', span: 12 },
				{ id: '68b0f853-b1b1-4120-aedd-87de58ea3209', span: 6 },
				{ id: 'e8c13d08-089f-4782-844a-06b8f19e4d54', span: 6 },
				{ id: '1b519edc-a120-4519-a008-0e0cec99fe91', span: 6 }
			]
		}
	},
	heating: {
		id: 'heating',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 8.04v-5.04' /><path d='M15.5 10l4.5 -2.5' /><path d='M15.5 14l4.5 2.5' /><path d='M12 15.96v5.04' /><path d='M8.5 14l-4.5 2.5' /><path d='M8.5 10l-4.5 -2.505' /></svg>",
		translations: {
			de: {
				title: 'Heizungen',
				description: ''
			},
			en: {
				title: 'Heating',
				description: ''
			}
		},
		charts: {
			at: [],
			de: [{ id: '8267b6b9-605d-4603-a8b4-4ad9e6a3c553', span: 12 }]
		}
	},
	temperature: {
		id: 'temperature',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5' /><path d='M10 9l4 0' /></svg>",
		translations: {
			de: {
				title: 'Temperatur',
				description:
					'Die Aufzeichnungen von Wetterstationen in deiner Nähe zeigen, wie sich die Temperaturen in der Region in den vergangenen Jahrzehnten entwickelt haben. Die Daten stammen von der geografisch nächstgelegenen Wetterstation für {regionName} mit weitgehend vollständigen Aufzeichnungen seit 1960. Sie liegt nicht zwingend in der ausgewählten Region, erlaubt aber eine Einschätzung der regionalen Entwicklung.'
			},
			en: {
				title: 'Temperature',
				description:
					'Weather station records near you show how temperatures in the region have developed over past decades. The data comes from the geographically closest weather station for {regionName} with largely complete records since 1960. It is not necessarily located in the selected region, but allows an assessment of regional development.'
			}
		},
		charts: {
			at: [{ id: '8378b7bc-10db-4373-9941-1ca014e70353', span: 12 }],
			de: [{ id: '8378b7bc-10db-4373-9941-1ca014e70353', span: 12 }]
		}
	},
	snow: {
		id: 'snow',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a4 4 0 0 1 2.906 6.75a6 6 0 1 1 -5.81 0a4 4 0 0 1 2.904 -6.75z' /><path d='M17.5 11.5l2.5 -1.5' /><path d='M6.5 11.5l-2.5 -1.5' /><path d='M12 13h.01' /><path d='M12 16h.01' /></svg>",
		translations: {
			de: {
				title: 'Schnee',
				description:
					'Im Zusammenhang mit abnehmenden Frost- und Schneetagen lohnt auch ein Blick auf die Entwicklung der Tage, an denen mindestens 1 cm Schnee am Morgen gemessen wurde, den sogenannten Schneedeckentagen.'
			},
			en: {
				title: 'Snow',
				description:
					'In connection with decreasing frost and snow days, it is also worth looking at the development of days when at least 1 cm of snow was measured in the morning, the so-called snow cover days.'
			}
		},
		charts: {
			at: [{ id: 'd88601f8-40de-4753-beb1-a0e824aa048c', span: 12 }],
			de: [{ id: 'd88601f8-40de-4753-beb1-a0e824aa048c', span: 12 }]
		}
	},
	scenarios: {
		id: 'scenarios',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18' /><path d='M16 12l-4 -4' /><path d='M16 12h-8' /><path d='M12 16l4 -4' /></svg>",
		translations: {
			de: {
				title: 'Klimazukunft',
				description:
					'Auf welche Veränderungen müssen wir uns in {regionName} für die Zukunft einstellen? Klimaszenarien zeigen, welche Auswirkungen die globale Erwärmung in unserer Region hat.'
			},
			en: {
				title: 'Climate Future',
				description:
					'What changes do we need to prepare for in {regionName} in the future? Climate scenarios show the effects of global warming in our region.'
			}
		},
		charts: {
			at: [], // Coming soon placeholder - handled differently
			de: []
		}
	},
	actions: {
		id: 'actions',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5' /></svg>",
		translations: {
			de: {
				title: 'Handlungen',
				description: ''
			},
			en: {
				title: 'Actions',
				description: ''
			}
		},
		charts: {
			at: [],
			de: []
		},
		block: 'policies' // Special handling for component blocks
	}
};

// Which sections each country gets (in order)
const countrySections = {
	at: ['emissions', 'mobility', 'temperature', 'snow', 'scenarios', 'actions'],
	de: ['emissions', 'energy', 'mobility', 'heating', 'temperature', 'snow', 'actions']
};

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

async function createSectionsCollection() {
	console.log('Checking if sections collection exists...');

	if (await collectionExists('regions_config_sections')) {
		console.log('Collection regions_config_sections already exists, skipping creation');
		return;
	}

	console.log('Creating regions_config_sections collection...');

	// Create sections collection
	try {
		await fetch(`${DIRECTUS_URL}/collections`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections',
				meta: {
					collection: 'regions_config_sections',
					icon: 'view_list',
					note: 'Sections for region pages',
					display_template: '{{section_id}}',
					hidden: false
				},
				schema: {
					name: 'regions_config_sections'
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
						field: 'section_id',
						type: 'string',
						meta: {
							interface: 'input',
							required: true,
							note: 'Unique identifier for the section (e.g., emissions, energy, mobility)'
						},
						schema: {}
					},
					{
						field: 'sort',
						type: 'integer',
						meta: {
							interface: 'input',
							hidden: true
						},
						schema: {}
					},
					{
						field: 'icon',
						type: 'text',
						meta: {
							interface: 'input-code',
							options: { language: 'html' },
							note: 'SVG icon for the section'
						},
						schema: {}
					},
					{
						field: 'block',
						type: 'string',
						meta: {
							interface: 'input',
							note: 'Optional: component block to render instead of charts (e.g., policies)'
						},
						schema: {}
					}
				]
			})
		});
		console.log('Created regions_config_sections collection');
	} catch (error) {
		console.error('Error creating sections collection:', error);
		throw error;
	}

	// Add relationship from sections to regions_config
	console.log('Adding sections relationship to regions_config...');
	try {
		await fetch(`${DIRECTUS_URL}/relations`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections',
				field: 'regions_config_id',
				related_collection: 'regions_config',
				meta: {
					one_field: 'sections',
					sort_field: 'sort',
					one_deselect_action: 'nullify'
				},
				schema: {
					on_delete: 'CASCADE'
				}
			})
		});
		console.log('Added sections relationship');
	} catch (error) {
		console.error('Error adding sections relationship:', error);
	}

	// Add sections alias field to regions_config
	console.log('Adding sections alias field to regions_config...');
	try {
		await fetch(`${DIRECTUS_URL}/fields/regions_config`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				field: 'sections',
				type: 'alias',
				meta: {
					interface: 'list-o2m',
					special: ['o2m'],
					options: {
						template: '{{section_id}}'
					}
				},
				schema: null
			})
		});
		console.log('Added sections alias field');
	} catch (error) {
		console.error('Error adding sections alias field:', error);
	}
}

async function createSectionsTranslationsCollection() {
	console.log('Checking if sections translations collection exists...');

	if (await collectionExists('regions_config_sections_translations')) {
		console.log('Collection regions_config_sections_translations already exists, skipping');
		return;
	}

	console.log('Creating regions_config_sections_translations collection...');

	try {
		await fetch(`${DIRECTUS_URL}/collections`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections_translations',
				meta: {
					collection: 'regions_config_sections_translations',
					icon: 'translate',
					hidden: true
				},
				schema: {
					name: 'regions_config_sections_translations'
				},
				fields: [
					{
						field: 'id',
						type: 'integer',
						meta: { hidden: true, interface: 'input', readonly: true },
						schema: { is_primary_key: true, has_auto_increment: true }
					},
					{
						field: 'regions_config_sections_id',
						type: 'integer',
						meta: { hidden: true },
						schema: {
							foreign_key_column: 'id',
							foreign_key_table: 'regions_config_sections'
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
						field: 'title',
						type: 'string',
						meta: { interface: 'input' },
						schema: {}
					},
					{
						field: 'description',
						type: 'text',
						meta: {
							interface: 'input-multiline',
							note: 'Section description with {regionName} placeholder'
						},
						schema: {}
					}
				]
			})
		});
		console.log('Created sections translations collection');
	} catch (error) {
		console.error('Error creating sections translations collection:', error);
		throw error;
	}

	// Add translations relationship
	console.log('Adding sections translations relationship...');
	try {
		await fetch(`${DIRECTUS_URL}/relations`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections_translations',
				field: 'regions_config_sections_id',
				related_collection: 'regions_config_sections',
				meta: {
					one_field: 'translations',
					sort_field: null,
					one_deselect_action: 'nullify'
				},
				schema: {
					on_delete: 'CASCADE'
				}
			})
		});
		console.log('Added translations relationship');
	} catch (error) {
		console.error('Error adding translations relationship:', error);
	}

	// Add translations alias field
	console.log('Adding translations alias field to sections...');
	try {
		await fetch(`${DIRECTUS_URL}/fields/regions_config_sections`, {
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

async function createSectionsChartsCollection() {
	console.log('Checking if sections charts collection exists...');

	if (await collectionExists('regions_config_sections_charts')) {
		console.log('Collection regions_config_sections_charts already exists, skipping');
		return;
	}

	console.log('Creating regions_config_sections_charts junction collection...');

	try {
		await fetch(`${DIRECTUS_URL}/collections`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections_charts',
				meta: {
					collection: 'regions_config_sections_charts',
					icon: 'link',
					hidden: true
				},
				schema: {
					name: 'regions_config_sections_charts'
				},
				fields: [
					{
						field: 'id',
						type: 'integer',
						meta: { hidden: true, interface: 'input', readonly: true },
						schema: { is_primary_key: true, has_auto_increment: true }
					},
					{
						field: 'regions_config_sections_id',
						type: 'integer',
						meta: { hidden: true },
						schema: {
							foreign_key_column: 'id',
							foreign_key_table: 'regions_config_sections'
						}
					},
					{
						field: 'charts_id',
						type: 'uuid',
						meta: { hidden: true },
						schema: {
							foreign_key_column: 'id',
							foreign_key_table: 'charts'
						}
					},
					{
						field: 'sort',
						type: 'integer',
						meta: { interface: 'input', hidden: true },
						schema: {}
					},
					{
						field: 'span',
						type: 'integer',
						meta: {
							interface: 'select-dropdown',
							options: {
								choices: [
									{ text: 'Half width (6)', value: 6 },
									{ text: 'Full width (12)', value: 12 }
								]
							},
							note: 'Grid span (6 = half, 12 = full width)'
						},
						schema: { default_value: 12 }
					}
				]
			})
		});
		console.log('Created sections charts junction collection');
	} catch (error) {
		console.error('Error creating sections charts collection:', error);
		throw error;
	}

	// Add M2M relationships
	console.log('Adding charts M2M relationship to sections...');
	try {
		// Relation from junction to sections
		await fetch(`${DIRECTUS_URL}/relations`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections_charts',
				field: 'regions_config_sections_id',
				related_collection: 'regions_config_sections',
				meta: {
					one_field: 'charts',
					sort_field: 'sort',
					one_deselect_action: 'nullify'
				},
				schema: {
					on_delete: 'CASCADE'
				}
			})
		});
		console.log('Added junction to sections relationship');

		// Relation from junction to charts
		await fetch(`${DIRECTUS_URL}/relations`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				collection: 'regions_config_sections_charts',
				field: 'charts_id',
				related_collection: 'charts',
				meta: {
					one_field: null, // Don't add reverse relationship to charts
					sort_field: null,
					one_deselect_action: 'nullify'
				},
				schema: {
					on_delete: 'SET NULL'
				}
			})
		});
		console.log('Added junction to charts relationship');
	} catch (error) {
		console.error('Error adding charts M2M relationship:', error);
	}

	// Add charts alias field to sections
	console.log('Adding charts alias field to sections...');
	try {
		await fetch(`${DIRECTUS_URL}/fields/regions_config_sections`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				field: 'charts',
				type: 'alias',
				meta: {
					interface: 'list-m2m',
					special: ['m2m'],
					options: {
						template: '{{charts_id.name}}',
						junctionFieldLocation: 'bottom'
					}
				},
				schema: null
			})
		});
		console.log('Added charts alias field');
	} catch (error) {
		console.error('Error adding charts alias field:', error);
	}
}

async function seedSections() {
	console.log('\nSeeding sections for existing region configs...');

	// Get existing region configs
	let configs;
	try {
		configs = await directus.request(
			readItems('regions_config', {
				fields: ['id', 'region']
			})
		);
	} catch (error) {
		console.error('Could not fetch existing region configs:', error);
		return;
	}

	if (!configs || configs.length === 0) {
		console.log('No region configs found. Run create-region-config.js first.');
		return;
	}

	for (const config of configs) {
		// Get country from region ID using our mapping
		const regionId = config.region;
		const country = regionToCountry[regionId];
		if (!country || !countrySections[country]) {
			console.log(`Skipping config ${config.id} - unknown region: ${regionId}`);
			continue;
		}

		console.log(`\nSeeding sections for ${country.toUpperCase()} config ${config.id}...`);

		const sections = countrySections[country];
		for (let i = 0; i < sections.length; i++) {
			const sectionKey = sections[i];
			const sectionDef = sectionDefinitions[sectionKey];

			if (!sectionDef) {
				console.log(`  Unknown section: ${sectionKey}`);
				continue;
			}

			try {
				// Create the section
				const sectionResponse = await fetch(`${DIRECTUS_URL}/items/regions_config_sections`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${DIRECTUS_TOKEN}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						regions_config_id: config.id,
						section_id: sectionDef.id,
						sort: i + 1,
						icon: sectionDef.icon,
						block: sectionDef.block || null
					})
				});

				if (!sectionResponse.ok) {
					const error = await sectionResponse.json();
					throw new Error(JSON.stringify(error));
				}

				const sectionResult = await sectionResponse.json();
				const sectionId = sectionResult.data.id;
				console.log(`  Created section: ${sectionDef.id} (id: ${sectionId})`);

				// Add translations
				for (const lang of ['de', 'en']) {
					const trans = sectionDef.translations[lang];
					if (trans) {
						const transResponse = await fetch(
							`${DIRECTUS_URL}/items/regions_config_sections_translations`,
							{
								method: 'POST',
								headers: {
									Authorization: `Bearer ${DIRECTUS_TOKEN}`,
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									regions_config_sections_id: sectionId,
									languages_code: lang,
									title: trans.title,
									description: trans.description
								})
							}
						);

						if (!transResponse.ok) {
							const error = await transResponse.json();
							console.error(`    Error adding ${lang} translation:`, error);
						} else {
							console.log(`    Added ${lang} translation`);
						}
					}
				}

				// Add charts
				const charts = sectionDef.charts[country] || [];
				for (let j = 0; j < charts.length; j++) {
					const chart = charts[j];
					const chartResponse = await fetch(
						`${DIRECTUS_URL}/items/regions_config_sections_charts`,
						{
							method: 'POST',
							headers: {
								Authorization: `Bearer ${DIRECTUS_TOKEN}`,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								regions_config_sections_id: sectionId,
								charts_id: chart.id,
								sort: j + 1,
								span: chart.span
							})
						}
					);

					if (!chartResponse.ok) {
						const error = await chartResponse.json();
						console.error(`    Error adding chart ${chart.id}:`, error);
					} else {
						console.log(`    Added chart ${chart.id} (span: ${chart.span})`);
					}
				}
			} catch (error) {
				console.error(`  Error creating section ${sectionKey}:`, error);
			}
		}
	}

	console.log('\nSeeding complete!');
}

async function main() {
	try {
		await createSectionsCollection();
		await createSectionsTranslationsCollection();
		await createSectionsChartsCollection();
		await seedSections();
		console.log('\nDone!');
	} catch (error) {
		console.error('Script failed:', error);
		process.exit(1);
	}
}

main();
