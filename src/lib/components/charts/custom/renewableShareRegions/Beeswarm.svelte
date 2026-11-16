<!-- $lib/components/charts/custom/renewableShareRegions/Beeswarm.svelte
	Distribution view, upright: one dot per member region on a vertical share axis, sized by
	population, spread sideways around the centre. Dots are placed without overlap (largest
	first, each as close to the centre as it fits); no d3-force needed for a few dozen dots.
	100 % is a dashed line, the region's own value a solid one, as in the ranking. -->
<script lang="ts">
	import { scaleLinear, scaleSqrt } from 'd3-scale';
	import { interpolateLab } from 'd3-interpolate';
	import { formatPercent, formatPopulation } from '$lib/utils/formatters';
	import type { ShareRow } from './config';

	export let members: ShareRow[];
	export let average: ShareRow | undefined = undefined;
	export let label = '';
	export let populationLabel = 'Einwohner';

	interface Dot {
		row: ShareRow;
		/** screen position */
		x: number;
		y: number;
		/** sideways offset from the centre line */
		offset: number;
		r: number;
	}

	const GAP = 1.5; // px between dots
	const HEIGHT = 440;
	const AXIS_LEFT = 40; // room for the tick labels
	const CHAR = 6.5; // rough px per character of text-xs, to keep labels inside

	// Colour by distance to 100 %: green at 100 % and above (green-600), shading towards blue
	// (blue-700) the further a region stays below it. The position on the axis carries the same
	// information, so colour is never the only cue.
	const AT_TARGET = '#41AB5D';
	const FAR = '#2171B5';
	const toBlue = interpolateLab(AT_TARGET, FAR);
	const dotColor = (share: number) => toBlue(Math.min(Math.max((100 - share) / 100, 0), 1));

	let width = 0;
	let hovered: Dot | null = null;

	$: maxPop = Math.max(1, ...members.map((m) => m.population ?? 0));
	$: rMax = Math.max(9, Math.min(20, width / 22));
	$: rScale = scaleSqrt().domain([0, maxPop]).range([0, rMax]);
	$: radius = (m: ShareRow) => Math.max(3, rScale(m.population ?? 0));
	$: yScale = scaleLinear()
		.domain([0, Math.max(100, average?.share ?? 0, ...members.map((m) => m.share))])
		.nice()
		.range([HEIGHT - rMax - 4, rMax + 16]);
	$: centerX = AXIS_LEFT + (width - AXIS_LEFT) / 2;

	function swarm(rows: ShareRow[], y: (v: number) => number, rad: (m: ShareRow) => number): Dot[] {
		const placed: Dot[] = [];
		for (const row of [...rows].sort((a, b) => rad(b) - rad(a))) {
			const dot: Dot = { row, x: 0, y: y(Math.max(row.share, 0)), offset: 0, r: rad(row) };
			// Candidate offsets: the centre line, or touching a dot already placed
			const candidates = [0];
			for (const p of placed) {
				const d = dot.r + p.r + GAP;
				const dy = dot.y - p.y;
				if (Math.abs(dy) < d) {
					const dx = Math.sqrt(d * d - dy * dy);
					candidates.push(p.offset + dx, p.offset - dx);
				}
			}
			candidates.sort((a, b) => Math.abs(a) - Math.abs(b));
			dot.offset =
				candidates.find((o) =>
					placed.every(
						(p) => (dot.y - p.y) ** 2 + (o - p.offset) ** 2 >= (dot.r + p.r + GAP - 0.01) ** 2
					)
				) ?? 0;
			placed.push(dot);
		}
		return placed;
	}

	// Highlighted with a permanent label: the most populous member (the core city, e.g. Nürnberg)
	// and the member with the highest share
	$: highlightIds = new Set(
		[
			[...members].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0],
			[...members].sort((a, b) => b.share - a.share)[0]
		]
			.filter(Boolean)
			.map((m) => m.id)
	);

	// Highlighted dots drawn last, so they sit on top
	$: dots = width
		? swarm(members, yScale, radius)
				.map((d) => ({ ...d, x: centerX + d.offset }))
				.sort((a, b) => +highlightIds.has(a.row.id) - +highlightIds.has(b.row.id))
		: [];
	$: ticks = yScale.ticks(6);

	const labelText = (dot: Dot) => `${dot.row.name} ${formatPercent(dot.row.share, 1)}`;

	// Label beside the dot, preferably on the side it sits on; when it fits on neither side,
	// above the dot (below near the top), centred but kept inside the chart
	function labelPos(dot: Dot) {
		const len = labelText(dot).length * CHAR;
		const fitsRight = dot.x + dot.r + 4 + len <= width;
		const fitsLeft = dot.x - dot.r - 4 - len >= AXIS_LEFT;
		if (fitsRight || fitsLeft) {
			const right = fitsRight && (dot.offset >= 0 || !fitsLeft);
			return {
				x: dot.x + (right ? dot.r + 4 : -dot.r - 4),
				y: dot.y,
				anchor: right ? 'start' : 'end'
			};
		}
		const above = dot.y - dot.r - 14 > 0;
		return {
			x: Math.min(Math.max(dot.x, AXIS_LEFT + len / 2), width - len / 2),
			y: above ? dot.y - dot.r - 8 : dot.y + dot.r + 10,
			anchor: 'middle'
		};
	}

	// Size legend: a large and a small round population figure
	const round = (v: number) => {
		const p = 10 ** Math.floor(Math.log10(v));
		return Math.round(v / p) * p;
	};
	$: legend = [...new Set([round(maxPop / 5), round(maxPop)])].filter((v) => v > 0);

	$: tooltipLeft = hovered ? Math.min(Math.max(hovered.x, 90), width - 90) : 0;
</script>

<div class="relative" bind:clientWidth={width}>
	{#if width}
		<svg {width} height={HEIGHT} role="img" aria-label={label} class="block overflow-visible">
			<!-- Ticks -->
			{#each ticks as tick}
				<line
					x1={AXIS_LEFT}
					x2={width}
					y1={yScale(tick)}
					y2={yScale(tick)}
					class="stroke-gray-200 dark:stroke-gray-800"
				/>
				<text
					x={AXIS_LEFT - 6}
					y={yScale(tick)}
					dy="0.35em"
					text-anchor="end"
					class="fill-gray-600 dark:fill-gray-400 text-xs tabular-nums">{formatPercent(tick, 0)}</text
				>
			{/each}

			<!-- 100 % (dashed) and the region's own value (solid), labelled at the right end -->
			<line
				x1={AXIS_LEFT}
				x2={width}
				y1={yScale(100)}
				y2={yScale(100)}
				stroke-dasharray="4 3"
				class="stroke-gray-500 dark:stroke-gray-400"
			/>
			{#if average}
				<line
					x1={AXIS_LEFT}
					x2={width}
					y1={yScale(average.share)}
					y2={yScale(average.share)}
					class="stroke-gray-700 dark:stroke-gray-200"
				/>
			{/if}

			<!-- Dots -->
			{#each dots as dot (dot.row.id)}
				<circle
					cx={dot.x}
					cy={dot.y}
					r={dot.r}
					role="presentation"
					fill={dotColor(dot.row.share)}
					class="{highlightIds.has(dot.row.id)
						? 'stroke-gray-900 dark:stroke-white'
						: 'stroke-white dark:stroke-gray-900'} transition-opacity {hovered && hovered !== dot
						? 'opacity-50'
						: ''}"
					stroke-width={hovered === dot ? 2.5 : highlightIds.has(dot.row.id) ? 2 : 1}
					on:mouseenter={() => (hovered = dot)}
					on:mouseleave={() => (hovered = null)}
				>
					<title
						>{dot.row.name}: {formatPercent(dot.row.share, 1)}, {formatPopulation(
							dot.row.population ?? NaN
						)} {populationLabel}</title
					>
				</circle>
			{/each}

			<!-- Labels on top of the dots; the halo keeps them readable where they cross dots -->
			<g
				paint-order="stroke"
				stroke-width="3"
				stroke-linejoin="round"
				class="pointer-events-none text-xs stroke-white dark:stroke-gray-900"
				aria-hidden="true"
			>
				<text
					x={width}
					y={yScale(100) - 5}
					text-anchor="end"
					class="fill-gray-600 dark:fill-gray-400">{formatPercent(100, 0)}</text
				>
				{#if average}
					<text
						x={width}
						y={yScale(average.share) - 5}
						text-anchor="end"
						class="fill-gray-700 dark:fill-gray-200 font-semibold"
						>Ø {average.name} {formatPercent(average.share, 1)}</text
					>
				{/if}
				{#each dots.filter((d) => highlightIds.has(d.row.id)) as dot (dot.row.id)}
					{@const pos = labelPos(dot)}
					<text
						x={pos.x}
						y={pos.y}
						dy="0.35em"
						text-anchor={pos.anchor}
						class="font-semibold fill-gray-900 dark:fill-gray-100">{labelText(dot)}</text
					>
				{/each}
			</g>
		</svg>

		{#if hovered}
			<div
				class="absolute pointer-events-none -translate-x-1/2 -translate-y-full rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow px-2 py-1 text-xs whitespace-nowrap"
				style:left="{tooltipLeft}px"
				style:top="{hovered.y - hovered.r - 6}px"
			>
				<div class="font-semibold text-gray-900 dark:text-gray-100">{hovered.row.name}</div>
				<div class="text-gray-700 dark:text-gray-300 tabular-nums">
					{formatPercent(hovered.row.share, 1)} · {formatPopulation(hovered.row.population ?? NaN)}
					{populationLabel}
				</div>
			</div>
		{/if}

		<!-- Size legend -->
		<div class="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
			<span>Kreisgröße: {populationLabel}</span>
			{#each legend as value}
				<span class="flex items-center gap-1.5">
					<svg width={2 * rScale(value) + 2} height={2 * rScale(value) + 2} aria-hidden="true">
						<circle
							cx={rScale(value) + 1}
							cy={rScale(value) + 1}
							r={rScale(value)}
							class="fill-gray-400 dark:fill-gray-500"
						/>
					</svg>
					{formatPopulation(value)}
				</span>
			{/each}
			<span class="flex items-center gap-1.5">
				Farbe: Abstand zu {formatPercent(100, 0)}
				<span class="tabular-nums">{formatPercent(0, 0)}</span>
				<span
					class="inline-block h-2.5 w-16 rounded-full"
					style:background="linear-gradient(to right, {FAR}, {AT_TARGET})"
					aria-hidden="true"
				></span>
				<span class="tabular-nums">≥ {formatPercent(100, 0)}</span>
			</span>
		</div>
	{/if}
</div>
