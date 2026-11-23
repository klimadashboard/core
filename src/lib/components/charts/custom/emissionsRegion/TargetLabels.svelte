<!-- Reduction annotations for the climate-target columns ("−65 %", "−95 % Klimaneutralität"):
     text sits just above its column, beside it, and a curved leader line with an arrowhead
     points down to the column's top. Text gets a halo in the card background so it stays
     readable over grid lines and paths.
     Also draws a dashed path from the latest actual total to the first target
     (only for targets that declare a reference year, see targetLabels.ts). -->
<script lang="ts">
	import type { ScaleLinear } from 'd3-scale';
	import type { EmissionsRawData } from './config';
	import type { TargetLabel } from './targetLabels';

	export let labels: TargetLabel[] = [];
	export let targets: EmissionsRawData[] = []; // in display units, same as the bars
	export let xScale: ScaleLinear<number, number>;
	export let yScale: ScaleLinear<number, number>;
	export let innerWidth = 0;
	export let marginRight = 0;
	export let hoveredYear: number | null = null;
	export let latestYear: number | null = null; // last year with actual data
	export let latestTotal = 0; // its total, in display units
	// Pixel y of a line the labels must stay above (e.g. the trend), or null where it has none
	export let avoid: ((x: number) => number | null) | null = null;

	const LINE_HEIGHT = 14;
	const RISE = 26; // vertical distance from the column top to the text's last baseline
	const RUN = 12; // horizontal offset of the text from the column centre
	const CHAR_W = 6.4; // rough width of a 12px character, enough for layout decisions

	$: firstTarget = targets.find((t) => t.year === labels[0]?.year && latestYear !== null && t.year > latestYear);

	type Placed = {
		year: number;
		lines: { text: string; strong: boolean }[];
		tipX: number; // column centre
		tipY: number; // column top
		side: 'left' | 'right';
		textX: number;
		baseline: number; // baseline of the last line
		width: number;
	};

	// Arguments only tell Svelte which props to react to
	function layout(..._deps: unknown[]): Placed[] {
		const out: Placed[] = [];
		for (const label of labels) {
			const target = targets.find((t) => t.year === label.year);
			if (!target) continue;
			const lines = [
				{ text: `−${label.reductionPercent} %`, strong: true },
				...(label.netZero ? [{ text: 'Klimaneutralität', strong: false }] : [])
			];
			const width = Math.max(...lines.map((l) => l.text.length)) * CHAR_W;
			const tipX = xScale(label.year);
			const tipY = yScale(target.value);
			// Text to the right of the column if it fits, otherwise to the left
			const side = tipX + RUN + width <= innerWidth + marginRight ? 'right' : 'left';
			const textX = side === 'right' ? tipX + RUN : tipX - RUN;
			// Stay clear of the avoided line across the text's whole width (and the tip)
			const x0 = side === 'right' ? textX : textX - width;
			let lineTop = Infinity;
			for (let x = Math.min(x0, tipX); x <= Math.max(x0 + width, tipX); x += 3) {
				const y = avoid?.(x);
				if (y != null) lineTop = Math.min(lineTop, y);
			}
			// Keep the first line inside the plot (the top margin leaves a little room)
			const minBaseline = -8 + (lines.length - 1) * LINE_HEIGHT;
			const baseline = Math.max(minBaseline, Math.min(tipY - RISE, lineTop - 12));
			out.push({ year: label.year, lines, tipX, tipY, side, textX, baseline, width });
		}

		// Resolve overlaps: lift the earlier (higher) label above the later one
		for (let i = out.length - 1; i > 0; i--) {
			const a = out[i - 1];
			const b = out[i];
			const box = (p: Placed) => ({
				x0: p.side === 'right' ? p.textX : p.textX - p.width,
				x1: p.side === 'right' ? p.textX + p.width : p.textX,
				y0: p.baseline - p.lines.length * LINE_HEIGHT,
				y1: p.baseline + 4
			});
			const ba = box(a);
			const bb = box(b);
			const overlapX = ba.x0 < bb.x1 && bb.x0 < ba.x1;
			const overlapY = ba.y0 < bb.y1 && bb.y0 < ba.y1;
			if (overlapX && overlapY) a.baseline -= ba.y1 - bb.y0 + 2;
		}
		return out;
	}

	$: placed = layout(labels, targets, xScale, yScale, innerWidth, marginRight, avoid);

	// Leader: leaves the text horizontally, bends, and arrives vertically at the column top
	function leader(p: Placed): string {
		const sx = p.side === 'right' ? p.textX - 3 : p.textX + 3;
		const sy = p.baseline - 4;
		const ex = p.tipX;
		const ey = p.tipY - 4;
		return `M ${sx},${sy} Q ${ex},${sy} ${ex},${ey}`;
	}

	function arrowhead(p: Placed): string {
		const x = p.tipX;
		const y = p.tipY - 3;
		return `M ${x - 3},${y - 4} L ${x},${y} L ${x + 3},${y - 4}`;
	}
</script>

{#if firstTarget && latestYear !== null && latestTotal > 0}
	<line
		x1={xScale(latestYear)}
		y1={yScale(latestTotal)}
		x2={xScale(firstTarget.year)}
		y2={yScale(firstTarget.value)}
		stroke="currentColor"
		stroke-width={2}
		stroke-dasharray="4 4"
		opacity={0.5}
		class="pointer-events-none"
	/>
{/if}

{#each placed as p (p.year)}
	<g
		class="pointer-events-none text-xs transition-opacity"
		opacity={hoveredYear === null || hoveredYear === p.year ? 1 : 0.5}
	>
		<!-- Halo under the leader so it reads as one stroke where it crosses other lines -->
		<path
			d={leader(p)}
			fill="none"
			stroke-width="4"
			stroke-linecap="round"
			class="stroke-white dark:stroke-black"
		/>
		<path
			d={leader(p)}
			fill="none"
			stroke-width="1"
			class="stroke-gray-700 dark:stroke-gray-300"
		/>
		<path
			d={arrowhead(p)}
			fill="none"
			stroke-width="1"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="stroke-gray-700 dark:stroke-gray-300"
		/>
		<text
			x={p.textX}
			y={p.baseline - (p.lines.length - 1) * LINE_HEIGHT}
			text-anchor={p.side === 'right' ? 'start' : 'end'}
			stroke-width="4"
			stroke-linejoin="round"
			class="fill-gray-800 stroke-white [paint-order:stroke] dark:fill-gray-100 dark:stroke-black"
		>
			{#each p.lines as line, i}
				<tspan
					x={p.textX}
					dy={i === 0 ? 0 : LINE_HEIGHT}
					font-weight={line.strong ? 600 : 400}>{line.text}</tspan
				>
			{/each}
		</text>
	</g>
{/each}
