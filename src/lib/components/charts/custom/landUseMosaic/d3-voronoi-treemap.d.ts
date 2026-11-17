// Minimal types for d3-voronoi-treemap (the package ships none)
declare module 'd3-voronoi-treemap' {
	type Polygon = Array<[number, number]>;
	interface VoronoiTreemap {
		(root: unknown): void;
		clip(polygon: Polygon): VoronoiTreemap;
		prng(random: () => number): VoronoiTreemap;
		maxIterationCount(n: number): VoronoiTreemap;
		convergenceRatio(r: number): VoronoiTreemap;
		minWeightRatio(r: number): VoronoiTreemap;
	}
	export function voronoiTreemap(): VoronoiTreemap;
}

// Minimal types for the part of d3-hierarchy used here (no @types package installed)
declare module 'd3-hierarchy' {
	interface HierarchyNode<T> {
		data: T;
		value?: number;
		children?: HierarchyNode<T>[];
		sum(value: (d: T) => number): HierarchyNode<T>;
	}
	export function hierarchy<T>(data: T): HierarchyNode<T>;
}
