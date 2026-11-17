// Circle split into wedges (angle = share of the total), each wedge a Voronoi treemap of its parts
import { hierarchy } from 'd3-hierarchy';
import { voronoiTreemap } from 'd3-voronoi-treemap';

export type Point = [number, number];

export interface MosaicInput {
	key: string;
	name: string;
	parts: Array<{ id: string; name: string; value: number }>;
}

export interface MosaicCell {
	id: string;
	name: string;
	value: number;
	rank: number;
	polygon: Point[];
	centroid: Point;
	/** Area in layout units, for deciding which cells get a label */
	area: number;
}

export interface MosaicWedge {
	key: string;
	name: string;
	value: number;
	a0: number;
	a1: number;
	cells: MosaicCell[];
}

/** Seeded random numbers, so the same data always gives the same mosaic */
function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function polygonArea(p: Point[]) {
	let a = 0;
	for (let i = 0; i < p.length; i++) {
		const [x0, y0] = p[i],
			[x1, y1] = p[(i + 1) % p.length];
		a += x0 * y1 - x1 * y0;
	}
	return a / 2;
}

function polygonCentroid(p: Point[]): Point {
	let x = 0,
		y = 0;
	for (let i = 0; i < p.length; i++) {
		const [x0, y0] = p[i],
			[x1, y1] = p[(i + 1) % p.length];
		const k = x0 * y1 - x1 * y0;
		x += (x0 + x1) * k;
		y += (y0 + y1) * k;
	}
	const a = polygonArea(p) * 6;
	return a ? [x / a, y / a] : p[0];
}

type Part = MosaicInput['parts'][number];

/** Voronoi treemap of `parts` inside the wedge a0 → a1 (must be under 180°: the clip has to be convex) */
function layoutWedge(
	parts: Part[],
	a0: number,
	a1: number,
	r: number,
	seed: number
): Array<Part & { polygon: Point[] }> {
	const steps = Math.max(6, Math.ceil(((a1 - a0) / (2 * Math.PI)) * 160));
	const clip: Point[] = [[r, r]];
	for (let i = 0; i <= steps; i++) {
		const a = a0 + ((a1 - a0) * i) / steps;
		clip.push([r + r * Math.cos(a), r + r * Math.sin(a)]);
	}
	if (parts.length === 1) return [{ ...parts[0], polygon: clip }];
	const root = hierarchy<{ children?: Part[]; value?: number }>({ children: parts }).sum(
		(d) => d.value ?? 0
	);
	voronoiTreemap()
		.clip(clip)
		.prng(mulberry32(seed))
		.maxIterationCount(400)
		.convergenceRatio(0.005)
		.minWeightRatio(0.001)(root);
	return (root.children ?? []).map((c, i) => ({
		...parts[i],
		polygon: (c as unknown as { polygon: Point[] }).polygon
	}));
}

/**
 * Splits parts into `n` piles of similar sum (largest first onto the lightest pile), so a wedge
 * wider than 180° can be laid out as convex slices without cutting any part in two.
 */
function splitParts(parts: Part[], n: number): Part[][] {
	const piles: Part[][] = Array.from({ length: n }, () => []);
	const sums = new Array(n).fill(0);
	for (const p of parts) {
		const i = sums.indexOf(Math.min(...sums));
		piles[i].push(p);
		sums[i] += p.value;
	}
	return piles.filter((p) => p.length);
}

/**
 * Lays out the groups as wedges of a circle with radius `r` centred at (r, r), starting at the
 * top and going clockwise; only positive parts are drawn. Wedge angles follow the group totals.
 */
export function layoutMosaic(groups: MosaicInput[], r: number): MosaicWedge[] {
	const positive = groups.map((g) => ({ ...g, parts: g.parts.filter((p) => p.value > 0) }));
	const total = positive.reduce((a, g) => a + g.parts.reduce((s, p) => s + p.value, 0), 0);
	if (!total) return [];

	const wedges: MosaicWedge[] = [];
	let a0 = -Math.PI / 2;
	positive.forEach((g, gi) => {
		const value = g.parts.reduce((s, p) => s + p.value, 0);
		if (!value) return;
		const a1 = a0 + (2 * Math.PI * value) / total;
		const sorted = [...g.parts].sort((a, b) => b.value - a.value);

		// Wedges over ~170° are not convex enough for the Voronoi clip: lay them out in slices
		const slices = splitParts(sorted, Math.ceil((a1 - a0) / (Math.PI * 0.95)));
		const placed: Array<Part & { polygon: Point[] }> = [];
		let s0 = a0;
		slices.forEach((slice, si) => {
			const s1 = s0 + (2 * Math.PI * slice.reduce((s, p) => s + p.value, 0)) / total;
			placed.push(...layoutWedge(slice, s0, s1, r, gi * 10 + si + 1));
			s0 = s1;
		});

		wedges.push({
			key: g.key,
			name: g.name,
			value,
			a0,
			a1,
			cells: placed
				.sort((a, b) => b.value - a.value)
				.map((p, i) => ({
					id: p.id,
					name: p.name,
					value: p.value,
					rank: i + 1,
					polygon: p.polygon,
					centroid: polygonCentroid(p.polygon),
					area: Math.abs(polygonArea(p.polygon))
				}))
		});
		a0 = a1;
	});
	return wedges;
}
