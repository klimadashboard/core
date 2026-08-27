import { env } from '$env/dynamic/public';

const SUBDOMAINS = ['a', 'b', 'c', 'd'];

function withApiKey(url: string): string {
	const apiKey = env.PUBLIC_CARTO_API_KEY;
	if (!apiKey) return url;
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}api_key=${apiKey}`;
}

/**
 * Single registry of CARTO raster basemap styles used across the app.
 * To switch basemap provider/style, change the paths here — every map picks it up.
 */
export const CARTO_STYLES = {
	voyager: 'rastertiles/voyager',
	light: 'light_all',
	dark: 'dark_all',
	lightNoLabels: 'light_nolabels',
	darkNoLabels: 'dark_nolabels',
	lightLabelsOnly: 'light_only_labels',
	darkLabelsOnly: 'dark_only_labels'
} as const;

export type CartoStyle = keyof typeof CARTO_STYLES;

/** Registry of CARTO GL (vector) basemap styles used across the app. */
export const CARTO_GL_STYLES = {
	voyager: 'voyager-gl-style',
	darkMatter: 'dark-matter-gl-style'
} as const;

export type CartoGlStyle = keyof typeof CARTO_GL_STYLES;

/** Raster XYZ tile URLs for a named CARTO basemap style. */
export function cartoRasterTiles(
	style: CartoStyle,
	opts: { subdomains?: string[]; retina?: boolean } = {}
): string[] {
	const { subdomains = SUBDOMAINS, retina = false } = opts;
	const path = CARTO_STYLES[style];
	return subdomains.map((s) =>
		withApiKey(`https://${s}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}${retina ? '@2x' : ''}.png`)
	);
}

/** Complete MapLibre raster source spec for a named CARTO basemap style. */
export function cartoRasterSource(
	style: CartoStyle,
	opts: {
		subdomains?: string[];
		retina?: boolean;
		tileSize?: number;
		maxzoom?: number;
		attribution?: string;
	} = {}
) {
	const { subdomains, retina, tileSize = 256, maxzoom, attribution } = opts;
	return {
		type: 'raster' as const,
		tiles: cartoRasterTiles(style, { subdomains, retina }),
		tileSize,
		...(maxzoom !== undefined ? { maxzoom } : {}),
		...(attribution ? { attribution } : {})
	};
}

/** CARTO GL style JSON URL for a named vector basemap style. */
export function cartoGlStyleUrl(style: CartoGlStyle): string {
	return withApiKey(`https://basemaps.cartocdn.com/gl/${CARTO_GL_STYLES[style]}/style.json`);
}
