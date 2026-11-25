/**
 * OpenFreeMap basemaps (https://openfreemap.org) – vector tiles, no API key.
 *
 * Every map in the app gets its basemap from here. The basemap is merged into the map's own style
 * with MapLibre's `transformStyle`, so the map is created synchronously and the app's own sources
 * and layers live next to the basemap ones:
 *
 * ```ts
 * map = new maplibregl.Map({
 *   container,
 *   ...basemapMapOptions('light', { labels: 'none', sources: { … }, layers: [ … ] }),
 *   center, zoom
 * });
 * ```
 *
 * Basemap sources and layers are prefixed with `basemap-`, so `setBasemap` (dark mode),
 * `setBasemapOpacity` and `raiseBasemapLabels` can find them again – own ids must not use it.
 * (Not tagged via `metadata`: MapLibre's style diff in `setStyle` doesn't update metadata.)
 */
import type {
	LayerSpecification,
	Map as MaplibreMap,
	SourceSpecification,
	StyleSpecification,
	TransformStyleFunction
} from 'maplibre-gl';

const OFM = 'https://tiles.openfreemap.org';

/** Glyphs for every map. Serves Noto Sans Regular / Bold / Italic. */
export const BASEMAP_GLYPHS = `${OFM}/fonts/{fontstack}/{range}.pbf`;

/**
 * Basemap themes → OpenFreeMap styles. To switch style for the whole app, change it here.
 * `colorful` replaces CARTO Voyager, `light`/`dark` replace CARTO Positron/Dark Matter.
 */
export const BASEMAP_STYLES = {
	light: 'positron',
	dark: 'dark',
	colorful: 'liberty'
} as const;

export type BasemapTheme = keyof typeof BASEMAP_STYLES;

/**
 * Where the basemap's labels (all symbol layers) go:
 * - `inline` – with the basemap, below the app's layers (like a raster basemap with labels)
 * - `none`   – no labels
 * - `top`    – above the app's layers; call `raiseBasemapLabels` after adding layers later
 */
export type BasemapLabels = 'inline' | 'none' | 'top';

export interface BasemapOptions {
	labels?: BasemapLabels;
	/** 0–1, multiplied into every basemap layer's opacity. */
	opacity?: number;
	/** Hides the basemap (and skips loading its tiles) below this zoom. */
	minzoom?: number;
	/**
	 * Own glyphs instead of OpenFreeMap's, with the font the basemap labels use from them
	 * (a style has one glyphs URL – needed when own layers use fonts OpenFreeMap doesn't serve).
	 */
	fonts?: { glyphs: string; textFont: string[] };
}

export interface BasemapMapOptions extends BasemapOptions {
	/** The map's own sources. */
	sources?: Record<string, SourceSpecification>;
	/** The map's own layers, drawn above the basemap (and below its labels with `labels: 'top'`). */
	layers?: LayerSpecification[];
}

const PREFIX = 'basemap-';
/** Style metadata key for the options a map was created with. */
const TAG = 'kd:basemap';
/** Layer metadata key for the style's own opacities, valid until the first `setBasemap`. */
const ORIGINAL = 'kd:basemap-paint';

type Originals = Record<string, Record<string, unknown>>;
/** The style's own opacities per basemap layer, after a `setBasemap`. */
const originalPaint = new WeakMap<MaplibreMap, Originals>();

type Role = 'base' | 'labels';

const OPACITY_PROPS: Record<string, string[]> = {
	background: ['background-opacity'],
	fill: ['fill-opacity'],
	line: ['line-opacity'],
	symbol: ['text-opacity', 'icon-opacity'],
	raster: ['raster-opacity'],
	'fill-extrusion': ['fill-extrusion-opacity'],
	circle: ['circle-opacity', 'circle-stroke-opacity'],
	heatmap: ['heatmap-opacity']
};

export function basemapStyleUrl(theme: BasemapTheme): string {
	return `${OFM}/styles/${BASEMAP_STYLES[theme]}`;
}

const styleCache = new Map<BasemapTheme, Promise<StyleSpecification>>();

function fetchStyle(theme: BasemapTheme): Promise<StyleSpecification> {
	let p = styleCache.get(theme);
	if (!p) {
		p = fetch(basemapStyleUrl(theme)).then((res) => {
			if (!res.ok) throw new Error(`Basemap style ${theme}: HTTP ${res.status}`);
			return res.json();
		});
		p.catch(() => styleCache.delete(theme));
		styleCache.set(theme, p);
	}
	return p;
}

function role(layer: { id: string; type: string }): Role | undefined {
	if (!layer.id.startsWith(PREFIX)) return undefined;
	return layer.type === 'symbol' ? 'labels' : 'base';
}

const isBasemapSource = (id: string) => id.startsWith(PREFIX);

/** Multiplies an opacity paint value (number, zoom curve, legacy stops or expression) by k. */
function scaleOpacity(value: any, k: number): any {
	if (k === 1) return value;
	if (value === undefined) return k;
	if (typeof value === 'number') return value * k;
	if (Array.isArray(value)) {
		// ['interpolate', type, input, z0, v0, z1, v1, …] – outputs at even indices from 4
		if (String(value[0]).startsWith('interpolate'))
			return value.map((x, i) => (i >= 4 && i % 2 === 0 && typeof x === 'number' ? x * k : x));
		// ['step', input, v0, z1, v1, …] – outputs at even indices from 2
		if (value[0] === 'step')
			return value.map((x, i) => (i >= 2 && i % 2 === 0 && typeof x === 'number' ? x * k : x));
		return ['*', value, k];
	}
	if (value && Array.isArray(value.stops))
		return {
			...value,
			stops: value.stops.map(([z, v]: [unknown, unknown]) => [z, typeof v === 'number' ? v * k : v])
		};
	return value;
}

/** Labels in German where OSM has a German name, the local name otherwise (instead of English). */
function germanNames(value: any): any {
	if (!Array.isArray(value)) return value;
	if (value[0] === 'get' && value[1] === 'name_en' && value.length === 2) return ['get', 'name:de'];
	return value.map(germanNames);
}

/** Prefixed copies of an OpenFreeMap style's sources and layers, and their own opacities. */
function basemapParts(
	style: StyleSpecification,
	opacity: number,
	minzoom?: number,
	fonts?: BasemapOptions['fonts']
) {
	const sources: Record<string, SourceSpecification> = {};
	for (const [id, src] of Object.entries(style.sources)) sources[PREFIX + id] = src;

	const base: LayerSpecification[] = [];
	const labels: LayerSpecification[] = [];
	const originals: Originals = {};
	for (const layer of style.layers) {
		const r: Role = layer.type === 'symbol' ? 'labels' : 'base';
		const paint: Record<string, unknown> = { ...((layer as any).paint ?? {}) };
		const original: Record<string, unknown> = {};
		for (const prop of OPACITY_PROPS[layer.type] ?? []) {
			original[prop] = paint[prop];
			if (opacity !== 1) paint[prop] = scaleOpacity(paint[prop], opacity);
		}
		const copy: any = {
			...layer,
			id: PREFIX + layer.id,
			paint,
			metadata: { ...((layer as any).metadata ?? {}), [ORIGINAL]: original }
		};
		originals[copy.id] = original;
		if ('source' in layer && typeof layer.source === 'string') copy.source = PREFIX + layer.source;
		if (minzoom !== undefined) copy.minzoom = Math.max(layer.minzoom ?? 0, minzoom);
		if (layer.type === 'symbol' && copy.layout?.['text-field'])
			copy.layout = {
				...copy.layout,
				'text-field': germanNames(copy.layout['text-field']),
				...(fonts && { 'text-font': fonts.textFont })
			};
		(r === 'labels' ? labels : base).push(copy);
	}
	return { sources, base, labels, originals };
}

function styleMeta(style: StyleSpecification | undefined): BasemapOptions | undefined {
	return (style?.metadata as Record<string, any> | undefined)?.[TAG];
}

/**
 * Map options (`style` + `transformStyle`) for a new map with an OpenFreeMap basemap below the
 * given own sources and layers. Spread into the `maplibregl.Map` constructor options.
 */
export function basemapMapOptions(
	theme: BasemapTheme,
	{
		labels = 'inline',
		opacity = 1,
		minzoom,
		fonts,
		sources = {},
		layers = []
	}: BasemapMapOptions = {}
): { style: string; transformStyle: TransformStyleFunction } {
	return {
		style: basemapStyleUrl(theme),
		transformStyle: (_previous, next) => {
			const parts = basemapParts(next, opacity, minzoom, fonts);
			return {
				...next,
				glyphs: fonts?.glyphs ?? BASEMAP_GLYPHS,
				metadata: { [TAG]: { labels, opacity, minzoom, fonts } },
				sources: { ...parts.sources, ...sources },
				layers: [
					...parts.base,
					...(labels === 'inline' ? parts.labels : []),
					...layers,
					...(labels === 'top' ? parts.labels : [])
				]
			};
		}
	};
}

/** Options last applied per map – style metadata can't be updated in place. */
const mapOptions = new WeakMap<MaplibreMap, BasemapOptions>();

/**
 * Swaps the basemap of an existing map (e.g. light ↔ dark) and keeps all own sources and layers,
 * their order and the position of the basemap labels. Resolves once the style is fetched and the
 * swap is handed to MapLibre (which applies it right away, or after the current style has loaded).
 */
export async function setBasemap(
	map: MaplibreMap,
	theme: BasemapTheme,
	options: BasemapOptions = {}
): Promise<void> {
	const next = await fetchStyle(theme);
	const {
		labels = 'inline',
		opacity = 1,
		minzoom,
		fonts
	} = {
		...styleMeta(map.getStyle()),
		...mapOptions.get(map),
		...options
	};
	mapOptions.set(map, { labels, opacity, minzoom, fonts });
	map.setStyle(next, {
		transformStyle: (previous, incoming) => {
			const prev = previous ?? map.getStyle();
			const parts = basemapParts(incoming, opacity, minzoom, fonts);
			originalPaint.set(map, parts.originals);
			const withLabels = labels !== 'none';
			const layers: LayerSpecification[] = [];
			let baseDone = false;
			let labelsDone = false;
			// Basemap layers go where the old ones were; own layers keep their order
			for (const layer of prev.layers) {
				const r = role(layer);
				if (!r) layers.push(layer);
				else if (r === 'base' && !baseDone) {
					baseDone = true;
					layers.push(...parts.base);
					if (labels === 'inline' && !labelsDone) {
						labelsDone = true;
						layers.push(...parts.labels);
					}
				} else if (r === 'labels' && !labelsDone && withLabels) {
					labelsDone = true;
					layers.push(...parts.labels);
				}
			}
			if (!baseDone) {
				const inline = labels === 'inline' && !labelsDone;
				if (inline) labelsDone = true;
				layers.unshift(...parts.base, ...(inline ? parts.labels : []));
			}
			if (!labelsDone && withLabels) layers.push(...parts.labels);

			const sources: Record<string, SourceSpecification> = { ...parts.sources };
			for (const [id, src] of Object.entries(prev.sources))
				if (!isBasemapSource(id)) sources[id] = src;

			return {
				...prev,
				glyphs: fonts?.glyphs ?? BASEMAP_GLYPHS,
				sprite: incoming.sprite,
				metadata: { ...(prev.metadata as object), [TAG]: { labels, opacity, minzoom, fonts } },
				sources,
				layers
			};
		}
	});
}

/** Sets the opacity (0–1) of every basemap layer, relative to the style's own opacities. */
export function setBasemapOpacity(map: MaplibreMap, opacity: number): void {
	const style = map.getStyle();
	for (const layer of style.layers) {
		if (!role(layer)) continue;
		const original = (originalPaint.get(map)?.[layer.id] ??
			(layer.metadata as any)?.[ORIGINAL] ??
			{}) as Record<string, unknown>;
		for (const prop of OPACITY_PROPS[layer.type] ?? [])
			map.setPaintProperty(layer.id, prop as any, scaleOpacity(original[prop], opacity));
	}
	mapOptions.set(map, { ...styleMeta(style), ...mapOptions.get(map), opacity });
}

/** Moves the basemap labels above all other layers (after adding own layers with `labels: 'top'`). */
export function raiseBasemapLabels(map: MaplibreMap): void {
	for (const layer of map.getStyle().layers) if (role(layer) === 'labels') map.moveLayer(layer.id);
}

/** Id of the lowest basemap label layer, e.g. as `beforeId` to keep own layers below the labels. */
export function basemapLabelsBeforeId(map: MaplibreMap): string | undefined {
	return map.getStyle().layers.find((l) => role(l) === 'labels')?.id;
}
