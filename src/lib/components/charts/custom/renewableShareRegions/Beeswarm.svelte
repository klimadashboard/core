<!-- $lib/components/charts/custom/renewableShareRegions/Beeswarm.svelte
	Distribution view: one equal-sized dot per district on a horizontal share axis, stacked
	without overlap around a centre line (a beeswarm / dot histogram), so clusters and gaps read
	directly and each dot is still one district.

	- 100 % splits the axis: the area above is shaded and the dots there are green, the ones
	  below blue. Position and shading carry the same information, so colour is never the only cue.
	- Reference values (the page region's average, its parents) are labelled vertical lines.
	- One district is emphasised: the page's own district by default, or any district picked in
	  the dropdown or by tapping its dot. It gets a larger dot with a ring and a label with a
	  leader line; the highest and lowest districts are labelled too.
	- A far outlier (e.g. 293 % when the next is 184 %) would squeeze everything else: the axis
	  then ends after the regular values, with a break mark, and the outlier sits at its end
	  (its label still gives the real value).
	- Labels sit in rows above the swarm, packed so they never overlap, with halos (white in
	  light, black in dark mode) where they cross lines. -->
<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { formatPercent } from '$lib/utils/formatters';
	import { AxisX, Legend } from '$lib/components/charts/primitives';
	import { wipe } from '$lib/components/charts/primitives/motion';
	import type { ShareRow } from './config';

	/** the districts shown as dots */
	export let rows: ShareRow[];
	/** reference values drawn as lines (the page region's average, its parents) */
	export let lines: ShareRow[] = [];
	/** id of the emphasised district ('' = none) */
	export let selected = '';
	export let label = '';
	/** plural noun for the dots, e.g. "Kreise" */
	export let unit = 'Kreise';

	interface Dot {
		row: ShareRow;
		x: number;
		/** offset from the centre line */
		offset: number;
		r: number;
		rank: number;
	}
	interface LabelItem {
		key: string;
		text: string;
		x: number;
		strong: boolean;
		kind: 'line' | 'dot';
		dot?: Dot;
		left?: number;
		row?: number;
	}

	// ColorBrewer blue-600 / green-700 from the Tailwind theme, ≥ 3:1 against both card backgrounds
	const BELOW = '#4292C6';
	const ABOVE = '#238B45';
	const GAP = 1; // px between dots
	const ROW = 15; // px per label row
	const MARGIN = { left: 14, right: 20 };
	const CHAR = 6.4; // rough px per character of text-xs, semibold a bit wider

	let width = 0;
	let hovered: Dot | null = null;
	let svgEl: SVGSVGElement;

	$: innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
	/** Axis end: the highest value, unless the top one to three are far above the rest */
	function axisMax(values: number[]): number {
		const v = [...values].sort((a, b) => b - a);
		let cap = v[0] ?? 100;
		for (let i = 0; i < Math.min(3, v.length - 1); i++)
			if (v[i] > 1.4 * v[i + 1] && v[i + 1] >= 100) cap = v[i + 1] * 1.08;
		return Math.max(100, cap);
	}
	$: xScale = scaleLinear()
		.domain([0, axisMax([...rows.map((r) => r.share), ...lines.map((l) => l.share)])])
		.range([0, innerWidth])
		.nice();
	$: xMax = xScale.domain()[1];
	/** x position, outliers beyond the axis end pinned to it */
	$: xPos = (v: number) => xScale(Math.min(Math.max(v, 0), xMax));
	$: broken = rows.some((r) => r.share > xMax);
	$: tickCount = Math.max(2, Math.floor(innerWidth / 60));
	$: ticks = xScale.ticks(tickCount);
	$: r = Math.min(6, Math.max(3.5, (innerWidth / rows.length) * 0.75));
	$: rBig = r + 2.5;

	// Ranks by share, highest first (rows come sorted, but don't rely on it)
	$: ranked = [...rows].sort((a, b) => b.share - a.share);

	function swarm(
		list: ShareRow[],
		emphasised: string,
		x: (v: number) => number,
		rSmall: number,
		rLarge: number,
		order: ShareRow[]
	): Dot[] {
		const placed: Dot[] = [];
		for (const row of [...list].sort((a, b) => a.share - b.share)) {
			const dot: Dot = {
				row,
				x: x(row.share),
				offset: 0,
				r: row.id === emphasised ? rLarge : rSmall,
				rank: order.indexOf(row) + 1
			};
			// Candidate offsets: the centre line, or touching a dot already placed
			const candidates = [0];
			for (const p of placed) {
				const d = dot.r + p.r + GAP;
				const dx = dot.x - p.x;
				if (Math.abs(dx) < d) {
					const dy = Math.sqrt(d * d - dx * dx);
					candidates.push(p.offset + dy, p.offset - dy);
				}
			}
			candidates.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
			dot.offset =
				candidates.find((o) =>
					placed.every(
						(p) => (dot.x - p.x) ** 2 + (o - p.offset) ** 2 >= (dot.r + p.r + GAP - 0.01) ** 2
					)
				) ?? 0;
			placed.push(dot);
		}
		return placed;
	}

	$: dots = innerWidth ? swarm(rows, selected, xPos, r, rBig, ranked) : [];
	$: emphasised = dots.find((d) => d.row.id === selected);
	$: half = Math.max(r, ...dots.map((d) => Math.abs(d.offset) + d.r));

	// Labels: the emphasised district, the reference lines, then the highest and lowest district
	$: labels = (() => {
		const items: LabelItem[] = [];
		const dotLabel = (d: Dot | undefined, strong: boolean) => {
			if (!d || items.some((i) => i.key === d.row.id)) return;
			items.push({
				key: d.row.id,
				text: `${d.row.name} ${formatPercent(d.row.share, 1)}${strong ? ` · Platz ${d.rank} von ${dots.length}` : ''}`,
				x: d.x,
				strong,
				kind: 'dot',
				dot: d
			});
		};
		dotLabel(emphasised, true);
		for (const l of lines)
			items.push({
				key: `line-${l.id}`,
				text: `${l.computed ? 'Ø ' : ''}${l.name} ${formatPercent(l.share, 1)}`,
				x: xPos(l.share),
				strong: l.kind === 'self',
				kind: 'line'
			});
		const byShare = [...dots].sort((a, b) => b.row.share - a.row.share);
		dotLabel(byShare[0], false);
		dotLabel(byShare.at(-1), false);

		// Greedy packing into rows: each label centred on its x, kept inside the chart
		const taken: Array<Array<[number, number]>> = [];
		for (const item of items) {
			const w = item.text.length * (item.strong ? CHAR + 0.4 : CHAR);
			const left = Math.min(Math.max(item.x - w / 2, -MARGIN.left + 2), innerWidth + MARGIN.right - w - 2);
			let row = taken.findIndex((spans) => spans.every(([a, b]) => left + w + 8 < a || left > b + 8));
			if (row === -1) row = taken.push([]) - 1;
			taken[row].push([left, left + w]);
			item.left = left;
			item.row = row;
		}
		return { items, rows: taken.length };
	})();

	$: labelsHeight = labels.rows * ROW;
	$: centerY = labelsHeight + 10 + half;
	$: axisY = centerY + half + 8;
	$: height = axisY + 26;

	$: above = rows.filter((r) => r.share >= 100).length;
	$: legendItems = [
		{ key: 'below', label: `unter ${formatPercent(100, 0)} (${rows.length - above} ${unit})`, color: BELOW },
		{
			key: 'above',
			label: `ab ${formatPercent(100, 0)}: mehr erneuerbarer Strom erzeugt als verbraucht (${above} ${unit})`,
			color: ABOVE
		}
	];
	$: summary = (() => {
		if (!ranked.length) return label;
		const fmt = (r: ShareRow) => `${r.name} ${formatPercent(r.share, 1)}`;
		const parts = [
			`${label}: ${rows.length} ${unit}, davon ${above} ab ${formatPercent(100, 0)}`,
			`höchster Wert ${fmt(ranked[0])}`,
			`niedrigster Wert ${fmt(ranked.at(-1)!)}`
		];
		if (emphasised) parts.push(`hervorgehoben ${fmt(emphasised.row)}, Platz ${emphasised.rank} von ${rows.length}`);
		return parts.join('; ');
	})();

	// Nearest dot to the pointer, generous on touch
	function nearest(e: PointerEvent | MouseEvent): Dot | null {
		const box = svgEl.getBoundingClientRect();
		const px = e.clientX - box.left - MARGIN.left;
		const py = e.clientY - box.top;
		let best: Dot | null = null;
		let bestDist = Math.max(14, r * 2.5);
		for (const d of dots) {
			const dist = Math.hypot(d.x - px, centerY + d.offset - py);
			if (dist < bestDist) {
				best = d;
				bestDist = dist;
			}
		}
		return best;
	}

	$: tooltipLeft = hovered ? Math.min(Math.max(MARGIN.left + hovered.x, 90), width - 90) : 0;
</script>

<div class="relative" bind:clientWidth={width}>
	{#if width}
		<!-- Tapping a dot is a pointer shortcut; keyboard and screen reader users pick a district
			in the dropdown above, and the summary is in the aria-label -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<svg
			bind:this={svgEl}
			{width}
			{height}
			role="img"
			aria-label={summary}
			class="block overflow-visible cursor-pointer"
			on:pointermove={(e) => (hovered = e.pointerType === 'mouse' ? nearest(e) : hovered)}
			on:pointerleave={() => (hovered = null)}
			on:click={(e) => {
				const d = nearest(e);
				if (d) selected = d.row.id === selected ? '' : d.row.id;
			}}
		>
			<g transform="translate({MARGIN.left},0)">
				<!-- Above 100 %: shaded area -->
				<rect
					x={xScale(100)}
					y={labelsHeight + 2}
					width={Math.max(0, innerWidth - xScale(100))}
					height={axisY - labelsHeight - 2}
					class="fill-green-200/50 dark:fill-green-900/30"
				/>
				{#each ticks as tick}
					<line
						x1={xScale(tick)}
						x2={xScale(tick)}
						y1={labelsHeight + 2}
						y2={axisY}
						class="stroke-gray-100 dark:stroke-gray-800"
					/>
				{/each}
				<line
					x1={xScale(100)}
					x2={xScale(100)}
					y1={labelsHeight + 2}
					y2={axisY}
					stroke-dasharray="4 3"
					class="stroke-gray-500 dark:stroke-gray-400"
				/>

				<!-- Reference lines from their label down to the axis -->
				{#each labels.items.filter((i) => i.kind === 'line') as item (item.key)}
					<line
						x1={item.x}
						x2={item.x}
						y1={(item.row! + 1) * ROW}
						y2={axisY}
						class={item.strong
							? 'stroke-gray-800 dark:stroke-gray-100'
							: 'stroke-gray-500 dark:stroke-gray-400'}
						stroke-width={item.strong ? 1.5 : 1}
						stroke-dasharray={item.strong ? undefined : '1 2'}
					/>
				{/each}
				<!-- Leader lines from dot labels down to their dot (drawn under the dots) -->
				{#each labels.items.filter((i) => i.kind === 'dot') as item (item.key)}
					<line
						x1={item.x}
						x2={item.x}
						y1={(item.row! + 1) * ROW}
						y2={centerY + item.dot!.offset - item.dot!.r}
						class="stroke-gray-400 dark:stroke-gray-500"
					/>
				{/each}

				<!-- Dots, revealed left to right; the emphasised one last so it sits on top -->
				<g in:wipe|global>
					{#each [...dots].sort((a, b) => +(a === emphasised) - +(b === emphasised)) as dot (dot.row.id)}
						<circle
							cx={dot.x}
							cy={centerY + dot.offset}
							r={dot.r}
							fill={dot.row.share >= 100 ? ABOVE : BELOW}
							class={dot === emphasised
								? 'stroke-gray-900 dark:stroke-white'
								: dot === hovered
									? 'stroke-gray-700 dark:stroke-gray-200'
									: 'stroke-white dark:stroke-gray-900'}
							stroke-width={dot === emphasised ? 2.5 : dot === hovered ? 2 : 1}
						/>
					{/each}
				</g>

				<AxisX
					{xScale}
					innerWidth={innerWidth}
					innerHeight={axisY}
					{tickCount}
					forceTicks={[100]}
					format={(v) => formatPercent(v, 0)}
				/>
				{#if broken}
					<!-- Axis break: the outliers at the end lie further out -->
					<g transform="translate({innerWidth - 10},{axisY})" aria-hidden="true">
						<path d="M-5,4 L-1,-4 M1,4 L5,-4" class="stroke-gray-500 dark:stroke-gray-400" />
					</g>
				{/if}

				<!-- Labels with a halo -->
				<g
					stroke-width="3"
					stroke-linejoin="round"
					class="pointer-events-none text-xs [paint-order:stroke] stroke-white dark:stroke-black"
					aria-hidden="true"
				>
					{#each labels.items as item (item.key)}
						<text
							x={item.left}
							y={(item.row! + 1) * ROW - 4}
							class="{item.strong ? 'font-semibold' : ''} {item.strong || item.kind === 'line'
								? 'fill-gray-900 dark:fill-gray-100'
								: 'fill-gray-600 dark:fill-gray-400'}">{item.text}</text
						>
					{/each}
				</g>
			</g>
		</svg>

		{#if hovered}
			<div
				class="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow px-2 py-1 text-xs whitespace-nowrap"
				style:left="{tooltipLeft}px"
				style:top="{centerY + hovered.offset - hovered.r - 6}px"
			>
				<div class="font-semibold text-gray-900 dark:text-gray-100">{hovered.row.name}</div>
				<div class="text-gray-700 dark:text-gray-300 tabular-nums">
					{formatPercent(hovered.row.share, 1)} · Platz {hovered.rank} von {rows.length}
				</div>
			</div>
		{/if}

		<div class="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
			<Legend items={legendItems} />
			<p>Ein Punkt je Kreis. Punkt antippen oder Kreis auswählen, um ihn hervorzuheben.</p>
		</div>
	{/if}
</div>
