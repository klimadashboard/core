/**
 * Script to fix relationship field configurations in Directus
 *
 * Usage:
 *   DIRECTUS_TOKEN=your_token node scripts/fix-sections-relation.js
 */

const DIRECTUS_URL = 'https://base.klimadashboard.org';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
	console.error('Error: DIRECTUS_TOKEN environment variable is required');
	console.error('Usage: DIRECTUS_TOKEN=your_token node scripts/fix-sections-relation.js');
	process.exit(1);
}

// Helper to safely parse JSON response
async function safeJsonParse(response) {
	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		console.log(`Response status: ${response.status}`);
		console.log(`Response (first 200 chars): ${text.substring(0, 200)}`);
		return null;
	}
}

// Helper to add delay between requests
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixRegionsConfigRegionField() {
	console.log('Fixing regions_config.region field relationship...');

	try {
		// First, check if the relation already exists
		const relationsResponse = await fetch(`${DIRECTUS_URL}/relations`, {
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`
			}
		});

		if (relationsResponse.ok) {
			const relations = await relationsResponse.json();
			const existingRelation = relations.data?.find(
				(r) => r.collection === 'regions_config' && r.field === 'region'
			);

			if (existingRelation) {
				console.log('Relation already exists, updating field meta only...');
			} else {
				// Create the relation
				console.log('Creating M2O relation to regions...');
				const createRelationResponse = await fetch(`${DIRECTUS_URL}/relations`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${DIRECTUS_TOKEN}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						collection: 'regions_config',
						field: 'region',
						related_collection: 'regions',
						meta: {
							one_field: null,
							sort_field: null,
							one_deselect_action: 'nullify'
						},
						schema: {
							on_delete: 'SET NULL'
						}
					})
				});

				if (!createRelationResponse.ok) {
					const error = await createRelationResponse.json();
					console.log('Relation creation response:', JSON.stringify(error, null, 2));
				} else {
					console.log('Relation created successfully');
				}
			}
		}

		// Update the field meta to display properly
		const response = await fetch(`${DIRECTUS_URL}/fields/regions_config/region`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
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
					},
					hidden: false
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Error updating field:', JSON.stringify(error, null, 2));
			return;
		}

		console.log('Successfully updated regions_config.region field!');
	} catch (error) {
		console.error('Error:', error);
	}
}

async function fixRegionsConfigTranslationsField() {
	console.log('\nFixing regions_config.translations field...');

	try {
		// Check if relation exists
		const relationsResponse = await fetch(`${DIRECTUS_URL}/relations`, {
			headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
		});

		if (relationsResponse.ok) {
			const relations = await relationsResponse.json();
			const existingRelation = relations.data?.find(
				(r) =>
					r.collection === 'regions_config_translations' &&
					r.field === 'regions_config_id'
			);

			if (!existingRelation) {
				console.log('Creating O2M relation for regions_config translations...');
				const createResponse = await fetch(`${DIRECTUS_URL}/relations`, {
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

				if (!createResponse.ok) {
					const error = await createResponse.json();
					console.log('Relation creation response:', JSON.stringify(error, null, 2));
				} else {
					console.log('Translations relation created successfully');
				}
			} else {
				console.log('Translations relation already exists, updating meta...');
				// Update the relation meta to ensure one_field is set
				const updateResponse = await fetch(
					`${DIRECTUS_URL}/relations/regions_config_translations/regions_config_id`,
					{
						method: 'PATCH',
						headers: {
							Authorization: `Bearer ${DIRECTUS_TOKEN}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							meta: {
								one_field: 'translations',
								sort_field: null,
								one_deselect_action: 'nullify'
							}
						})
					}
				);
				if (updateResponse.ok) {
					console.log('Relation meta updated');
				}
			}
		}

		// Update the translations alias field on regions_config
		const response = await fetch(`${DIRECTUS_URL}/fields/regions_config/translations`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				meta: {
					interface: 'translations',
					special: ['translations'],
					options: {
						languageField: 'languages_code',
						languageDirectionField: null,
						defaultLanguage: 'de',
						userLanguage: true
					},
					display: 'translations',
					display_options: {
						template: '{{intro_text}}',
						languageField: 'languages_code'
					},
					hidden: false,
					width: 'full'
				}
			})
		});

		if (!response.ok) {
			const error = await safeJsonParse(response);
			console.error('Error updating translations field:', error ? JSON.stringify(error, null, 2) : 'See above');
			return;
		}

		console.log('Successfully updated regions_config.translations field!');
	} catch (error) {
		console.error('Error:', error);
	}
}

async function fixSectionsConfigIdField() {
	console.log('\nFixing regions_config_sections.regions_config_id field...');

	try {
		const response = await fetch(
			`${DIRECTUS_URL}/fields/regions_config_sections/regions_config_id`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					meta: {
						interface: 'select-dropdown-m2o',
						special: ['m2o'],
						options: {
							template: '{{region.name}}'
						},
						display: 'related-values',
						display_options: {
							template: '{{region.name}}'
						},
						hidden: false
					}
				})
			}
		);

		if (!response.ok) {
			const error = await safeJsonParse(response);
			console.error('Error updating field:', error ? JSON.stringify(error, null, 2) : 'See above');
			return;
		}

		console.log('Successfully updated regions_config_sections.regions_config_id field!');
	} catch (error) {
		console.error('Error:', error);
	}
}

async function fixSectionsTranslationsField() {
	console.log('\nFixing regions_config_sections.translations field...');

	try {
		// Check if relation exists
		const relationsResponse = await fetch(`${DIRECTUS_URL}/relations`, {
			headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
		});

		if (relationsResponse.ok) {
			const relations = await relationsResponse.json();
			const existingRelation = relations.data?.find(
				(r) =>
					r.collection === 'regions_config_sections_translations' &&
					r.field === 'regions_config_sections_id'
			);

			if (!existingRelation) {
				console.log('Creating O2M relation for translations...');
				const createResponse = await fetch(`${DIRECTUS_URL}/relations`, {
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
							on_delete: 'SET NULL'
						}
					})
				});

				if (!createResponse.ok) {
					const error = await createResponse.json();
					console.log('Relation creation response:', JSON.stringify(error, null, 2));
				} else {
					console.log('Translations relation created successfully');
				}
			} else {
				console.log('Translations relation already exists');
			}
		}

		// Update the translations alias field on sections
		const response = await fetch(
			`${DIRECTUS_URL}/fields/regions_config_sections/translations`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					meta: {
						interface: 'translations',
						special: ['translations'],
						options: {
							languageField: 'languages_code'
						},
						hidden: false
					}
				})
			}
		);

		if (!response.ok) {
			const error = await safeJsonParse(response);
			console.error('Error updating translations field:', error ? JSON.stringify(error, null, 2) : 'See above');
			return;
		}

		console.log('Successfully updated translations field!');
	} catch (error) {
		console.error('Error:', error);
	}
}

async function fixSectionsChartsField() {
	console.log('\nFixing regions_config_sections.charts field (M2M to charts)...');

	try {
		// Check if relation exists
		const relationsResponse = await fetch(`${DIRECTUS_URL}/relations`, {
			headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
		});

		if (relationsResponse.ok) {
			const relations = await relationsResponse.json();
			const existingRelation = relations.data?.find(
				(r) =>
					r.collection === 'regions_config_sections_charts' &&
					r.field === 'regions_config_sections_id'
			);

			if (!existingRelation) {
				console.log('Creating O2M relation for charts junction...');
				const createResponse = await fetch(`${DIRECTUS_URL}/relations`, {
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
							on_delete: 'SET NULL'
						}
					})
				});

				if (!createResponse.ok) {
					const error = await createResponse.json();
					console.log('Relation creation response:', JSON.stringify(error, null, 2));
				} else {
					console.log('Charts junction relation created successfully');
				}
			} else {
				console.log('Charts junction relation already exists');
			}

			// Also check/create the M2O to charts table
			const chartsRelation = relations.data?.find(
				(r) =>
					r.collection === 'regions_config_sections_charts' && r.field === 'charts_id'
			);

			if (!chartsRelation) {
				console.log('Creating M2O relation to charts...');
				const createChartsResponse = await fetch(`${DIRECTUS_URL}/relations`, {
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
							one_field: null,
							sort_field: null,
							one_deselect_action: 'nullify'
						},
						schema: {
							on_delete: 'SET NULL'
						}
					})
				});

				if (!createChartsResponse.ok) {
					const error = await createChartsResponse.json();
					console.log('Charts M2O relation response:', JSON.stringify(error, null, 2));
				} else {
					console.log('Charts M2O relation created successfully');
				}
			} else {
				console.log('Charts M2O relation already exists');
			}
		}

		// Update the charts alias field on sections
		const response = await fetch(`${DIRECTUS_URL}/fields/regions_config_sections/charts`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				meta: {
					interface: 'list-m2m',
					special: ['m2m'],
					options: {
						template: '{{charts_id.title}}',
						enableCreate: false,
						enableSelect: true
					},
					display: 'related-values',
					display_options: {
						template: '{{charts_id.title}}'
					},
					hidden: false
				}
			})
		});

		if (!response.ok) {
			const error = await safeJsonParse(response);
			console.error('Error updating charts field:', error ? JSON.stringify(error, null, 2) : 'See above');
			return;
		}

		console.log('Successfully updated charts field!');

		// Update the charts_id field in junction table
		const chartsIdResponse = await fetch(
			`${DIRECTUS_URL}/fields/regions_config_sections_charts/charts_id`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					meta: {
						interface: 'select-dropdown-m2o',
						special: ['m2o'],
						options: {
							template: '{{title}}'
						},
						display: 'related-values',
						display_options: {
							template: '{{title}}'
						},
						hidden: false
					}
				})
			}
		);

		if (!chartsIdResponse.ok) {
			const error = await safeJsonParse(chartsIdResponse);
			console.error('Error updating charts_id field:', error ? JSON.stringify(error, null, 2) : 'See above');
		} else {
			console.log('Successfully updated charts_id field in junction table!');
		}
	} catch (error) {
		console.error('Error:', error);
	}
}

async function fixRegionsConfigSectionsField() {
	console.log('\nFixing regions_config.sections field (O2M to sections)...');

	try {
		// Check if relation exists
		const relationsResponse = await fetch(`${DIRECTUS_URL}/relations`, {
			headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
		});

		if (relationsResponse.ok) {
			const relations = await relationsResponse.json();
			const existingRelation = relations.data?.find(
				(r) =>
					r.collection === 'regions_config_sections' &&
					r.field === 'regions_config_id'
			);

			if (!existingRelation) {
				console.log('Creating O2M relation for sections...');
				const createResponse = await fetch(`${DIRECTUS_URL}/relations`, {
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
							on_delete: 'SET NULL'
						}
					})
				});

				if (!createResponse.ok) {
					const error = await createResponse.json();
					console.log('Relation creation response:', JSON.stringify(error, null, 2));
				} else {
					console.log('Sections relation created successfully');
				}
			} else {
				console.log('Sections relation already exists, updating meta...');
				const updateResponse = await fetch(
					`${DIRECTUS_URL}/relations/regions_config_sections/regions_config_id`,
					{
						method: 'PATCH',
						headers: {
							Authorization: `Bearer ${DIRECTUS_TOKEN}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							meta: {
								one_field: 'sections',
								sort_field: 'sort',
								one_deselect_action: 'nullify'
							}
						})
					}
				);
				if (updateResponse.ok) {
					console.log('Relation meta updated');
				}
			}
		}

		// Update the sections alias field on regions_config
		const response = await fetch(`${DIRECTUS_URL}/fields/regions_config/sections`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				meta: {
					interface: 'list-o2m',
					special: ['o2m'],
					options: {
						template: '{{section_id}} - {{translations}}',
						enableCreate: true,
						enableSelect: false
					},
					display: 'related-values',
					display_options: {
						template: '{{section_id}}'
					},
					hidden: false,
					width: 'full'
				}
			})
		});

		if (!response.ok) {
			const error = await safeJsonParse(response);
			console.error('Error updating sections field:', error ? JSON.stringify(error, null, 2) : 'See above');
			return;
		}

		console.log('Successfully updated regions_config.sections field!');
	} catch (error) {
		console.error('Error:', error);
	}
}

async function main() {
	await fixRegionsConfigRegionField();
	await delay(2000);
	await fixRegionsConfigTranslationsField();
	await delay(2000);
	await fixRegionsConfigSectionsField();
	await delay(2000);
	await fixSectionsConfigIdField();
	await delay(2000);
	await fixSectionsTranslationsField();
	await delay(2000);
	await fixSectionsChartsField();
	console.log('\nDone! All fields should now display properly in Directus.');
}

main();
