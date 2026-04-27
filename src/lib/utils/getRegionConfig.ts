/**
 * Fetch region page configuration with hierarchy inheritance
 *
 * Walks up the region hierarchy (e.g., Vienna → Austria) until it finds a config.
 * Returns null if no config is found anywhere in the hierarchy.
 */

import { readItems, readItem } from '@directus/sdk';
import getDirectusInstance from './directus';

export interface RegionPageConfigTranslation {
	languages_code: string;
	intro_text: string | null;
	explore_map_label: string | null;
	scroll_for_more_label: string | null;
	how_would_it_be_better_label: string | null;
}

export interface RegionPageConfigLayout {
	show_intro?: boolean;
	show_map?: boolean;
	show_illustrations?: boolean;
	show_statistics?: boolean;
}

export interface SectionTranslation {
	languages_code: string;
	title: string | null;
	description: string | null;
}

export interface SectionChart {
	charts_id: string;
	span: number;
	sort: number;
}

export interface Section {
	id: number;
	section_id: string;
	sort: number;
	icon: string | null;
	block: string | null;
	translations: SectionTranslation[];
	charts: SectionChart[];
}

export interface RegionPageConfig {
	id: string;
	region: string;
	layout: RegionPageConfigLayout;
	translations: RegionPageConfigTranslation[];
	sections?: Section[];
}

export interface ResolvedSection {
	id: string;
	title: string;
	description: string;
	icon: string | null;
	block: string | null;
	charts: Array<{ id: string; span: number }>;
}

export interface ResolvedRegionConfig {
	intro_text: string;
	explore_map_label: string;
	scroll_for_more_label: string;
	how_would_it_be_better_label: string;
	layout: RegionPageConfigLayout;
	sections: ResolvedSection[];
	/** The region ID where the config was found (for debugging) */
	source_region: string;
}

// ---------------------------------------------------------------------------
// In-memory TTL cache for region configs.
// Region configs rarely change and the hierarchy walk is expensive.
// ---------------------------------------------------------------------------
const configCache = new Map<string, { data: ResolvedRegionConfig | null; expires: number }>();
const CONFIG_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get the region page config for a given region, walking up the hierarchy if needed
 */
export async function getRegionConfig(
	regionId: string,
	lang: string = 'de',
	fetch?: typeof globalThis.fetch
): Promise<ResolvedRegionConfig | null> {
	const cacheKey = `${regionId}-${lang}`;
	const cached = configCache.get(cacheKey);
	if (cached && Date.now() < cached.expires) return cached.data;

	const directus = getDirectusInstance(fetch);

	// Country IDs for fallback (states don't have country in their parents array)
	const COUNTRY_AT = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81';
	const COUNTRY_DE = '3d5acf1a-8120-44d1-966b-62c21fa5d331';

	let currentRegionId: string | null = regionId;
	const visitedRegions = new Set<string>();
	let lastRegionCountry: string | null = null;

	// Walk up the hierarchy
	while (currentRegionId && !visitedRegions.has(currentRegionId)) {
		visitedRegions.add(currentRegionId);

		try {
			// Try to find a config for this region
			const configs = await directus.request(
				readItems('regions_config', {
					filter: { region: { _eq: currentRegionId } },
					fields: [
						'id',
						'region',
						'layout',
						'translations.*',
						'sections.id',
						'sections.section_id',
						'sections.sort',
						'sections.icon',
						'sections.block',
						'sections.translations.*',
						'sections.charts.charts_id',
						'sections.charts.span',
						'sections.charts.sort'
					],
					limit: 1,
					deep: {
						sections: {
							_sort: ['sort']
						}
					}
				})
			);

			if (configs && configs.length > 0) {
				const config = configs[0] as RegionPageConfig;

				// Find translation for current language, fallback to first available
				const translation =
					config.translations?.find((t) => t.languages_code === lang) ||
					config.translations?.find((t) => t.languages_code?.startsWith(lang)) ||
					config.translations?.[0];

				// Resolve sections with translations
				const resolvedSections: ResolvedSection[] = (config.sections || []).map((section) => {
					const sectionTrans =
						section.translations?.find((t) => t.languages_code === lang) ||
						section.translations?.find((t) => t.languages_code?.startsWith(lang)) ||
						section.translations?.[0];

					// Sort charts by sort order and map to simple format
					const sortedCharts = [...(section.charts || [])]
						.sort((a, b) => (a.sort || 0) - (b.sort || 0))
						.map((c) => ({ id: c.charts_id, span: c.span || 12 }));

					return {
						id: section.section_id,
						title: sectionTrans?.title || section.section_id,
						description: sectionTrans?.description || '',
						icon: section.icon,
						block: section.block,
						charts: sortedCharts
					};
				});

				if (translation) {
					const result: ResolvedRegionConfig = {
						intro_text: translation.intro_text || '',
						explore_map_label: translation.explore_map_label || '',
						scroll_for_more_label: translation.scroll_for_more_label || '',
						how_would_it_be_better_label: translation.how_would_it_be_better_label || '',
						layout: config.layout || {},
						sections: resolvedSections,
						source_region: currentRegionId
					};
					configCache.set(cacheKey, { data: result, expires: Date.now() + CONFIG_TTL });
					return result;
				}
			}

			// No config found, get parent region(s) and country
			const region = (await directus.request(
				readItem('regions', currentRegionId, { fields: ['parents', 'country'] })
			)) as { parents: Array<{ id: string; layer: string }> | null; country: string | null } | null;

			// Track the country for fallback
			if (region?.country) {
				lastRegionCountry = region.country;
			}

			// Get the first parent's ID (if any)
			currentRegionId = region?.parents?.[0]?.id || null;

			// If no parent found but we have a country, try the country as final fallback
			if (!currentRegionId && lastRegionCountry) {
				const countryId =
					lastRegionCountry === 'AT' ? COUNTRY_AT : lastRegionCountry === 'DE' ? COUNTRY_DE : null;
				if (countryId && !visitedRegions.has(countryId)) {
					currentRegionId = countryId;
				}
			}
		} catch (error) {
			console.error(`Error fetching config for region ${currentRegionId}:`, error);
			// Try to continue with parent if possible
			try {
				const region = (await directus.request(
					readItem('regions', currentRegionId, { fields: ['parents', 'country'] })
				)) as { parents: Array<{ id: string; layer: string }> | null; country: string | null } | null;
				if (region?.country) {
					lastRegionCountry = region.country;
				}
				currentRegionId = region?.parents?.[0]?.id || null;
			} catch {
				currentRegionId = null;
			}
		}
	}

	// No config found anywhere in hierarchy — cache this too
	console.log(`No config found in hierarchy, returning null`);
	configCache.set(cacheKey, { data: null, expires: Date.now() + CONFIG_TTL });
	return null;
}

/**
 * Default config values (used as fallback when no config exists in Directus)
 */
export function getDefaultConfig(lang: string = 'de'): ResolvedRegionConfig {
	if (lang === 'en') {
		return {
			intro_text:
				'The Klimadashboard {regionName} shows the effects of the climate crisis in your region and accompanies the implementation of the energy and mobility transition and other climate protection measures in your area.',
			explore_map_label: 'Explore data map',
			scroll_for_more_label: 'Scroll for more data',
			how_would_it_be_better_label: 'How could it be better?',
			layout: {
				show_intro: true,
				show_map: true,
				show_illustrations: true,
				show_statistics: true
			},
			sections: [],
			source_region: 'default'
		};
	}

	return {
		intro_text:
			'Das Klimadashboard {regionName} zeigt die Auswirkungen der Klimakrise in deiner Region und begleitet die Umsetzung der Energie- und Mobilitätswende und weitere Klimaschutzmaßnahmen bei dir vor Ort.',
		explore_map_label: 'Datenlandkarte erkunden',
		scroll_for_more_label: 'Scrollen für mehr Daten',
		how_would_it_be_better_label: "Wie wär's besser?",
		layout: {
			show_intro: true,
			show_map: true,
			show_illustrations: true,
			show_statistics: true
		},
		sections: [],
		source_region: 'default'
	};
}

/**
 * Get region config with fallback to defaults
 */
export async function getRegionConfigWithFallback(
	regionId: string,
	lang: string = 'de',
	fetch?: typeof globalThis.fetch
): Promise<ResolvedRegionConfig> {
	const config = await getRegionConfig(regionId, lang, fetch);
	return config || getDefaultConfig(lang);
}
