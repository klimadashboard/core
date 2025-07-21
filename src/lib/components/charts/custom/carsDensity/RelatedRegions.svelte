<script>
	import { scaleLinear } from 'd3-scale';
	import { forceSimulation, forceX, forceY, forceCollide } from 'd3-force';
	import { tick as svelteTick } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let regions;
	export let selectedPeriod;
	export let region;
	export let selectedView;

	let margin = 40;
	let chartWidth;
	let chartHeight;

	const defaultRadius = 2;
	const highlightRadius = 6;
	const collisionPadding = 0.5;

	let layoutPoints = [];
	let tooltip = null;
	let mouse = { x: 0, y: 0 };

	let xScale;
	let simulation;

	function format(value) {
		return Math.round(value) + ' Autos / 1000 EW';
	}

	$: if (regions && selectedPeriod && selectedView && chartWidth && chartHeight && region) {
		scheduleSimulation();
	}

	let computing = false;

	// Schedule simulation with async batching
	async function scheduleSimulation() {
		if (computing) return;
		computing = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const values = regions
			.map((r) => ({
				region: r,
				value: r[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value,
				highlight: r.code === region.code
			}))
			.filter((d) => d.value != null);

		if (values.length === 0) {
			layoutPoints = [];
			return;
		}

		const min = Math.min(...values.map((d) => d.value));
		const max = Math.max(...values.map((d) => d.value));

		xScale = scaleLinear()
			.domain([min, max])
			.range([margin, chartWidth - margin]);

		let nodes = values.map((d) => ({
			...d,
			x: xScale(d.value),
			y: chartHeight / 2
		}));

		if (simulation) simulation.stop();

		simulation = forceSimulation(nodes)
			.force('x', forceX((d) => xScale(d.value)).strength(1))
			.force('y', forceY(chartHeight / 2).strength(0.1))
			.force(
				'collide',
				forceCollide((d) =>
					d.highlight ? highlightRadius + collisionPadding : defaultRadius + collisionPadding
				)
			)
			.alphaDecay(0.05)
			.stop();

		// Run 100 ticks in small async batches to avoid blocking
		for (let i = 0; i < 100; i++) {
			simulation.tick();
			if (i % 10 === 0) await svelteTick(); // yield control
		}

		layoutPoints = nodes.map((d) => ({
			...d,
			y: Math.max(highlightRadius, Math.min(chartHeight - highlightRadius, d.y))
		}));
		computing = false;
	}

	let containerEl;

	function handleMouseMove(e) {
		const rect = containerEl.getBoundingClientRect();
		mouse = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	$: minRegion = regions.sort(
		(a, b) =>
			a[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value -
			b[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value
	)[0];

	$: maxRegion = regions.sort(
		(a, b) =>
			b[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value -
			a[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value
	)[0];

	$: console.log(minRegion);
</script>

<div
	class="relative w-full h-48 mt-12 {computing ? 'opacity-50' : ''}"
	bind:this={containerEl}
	bind:clientWidth={chartWidth}
	bind:clientHeight={chartHeight}
	on:mousemove={handleMouseMove}
>
	{#if chartWidth && chartHeight && layoutPoints.length}
		<svg class="absolute top-0 left-0 w-full h-full overflow-visible">
			<defs>
				<marker
					id="arrowhead"
					markerWidth="6"
					markerHeight="6"
					refX="5"
					refY="3"
					orient="auto"
					markerUnits="strokeWidth"
				>
					<path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
				</marker>
			</defs>

			<!-- X Axis -->
			<g class="opacity-50" transform="translate(0, -30)">
				{#each xScale.ticks(5) as tick}
					<g transform="translate({xScale(tick)}, 0)">
						<line y1={3} y2="7" stroke="black" />
						<text y="0" text-anchor="middle" font-size="10">{tick}</text>
					</g>
				{/each}
			</g>

			{#if minRegion}
				<!-- Curved Arrow to Min Region -->
				<g class="text-xs opacity-80 font-medium" style="color: {selectedView.color}">
					<path
						d={`
				M ${margin}, ${0}
				Q ${0}, ${chartHeight / 3}
				${margin - 7}, ${chartHeight / 2 - 7}
			`}
						fill="none"
						stroke="currentColor"
						stroke-width="1"
						marker-end="url(#arrowhead)"
						class=""
					/>

					<text x={margin + 5} y={-8} text-anchor="start" class="fill-current">
						<tspan>Minimum:</tspan>
						<tspan
							>{Math.round(
								minRegion[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value
							)} PKWs / 1000 EW</tspan
						>
						<tspan x={margin + 5} y={2}>in {minRegion.name}</tspan>
					</text>
				</g>
			{/if}

			{#if maxRegion}
				<!-- Curved Arrow to Max Region -->
				<g class="text-xs opacity-80 font-medium" style="color: {selectedView.color}">
					<path
						d={`
                M ${chartWidth - margin}, ${5}
                Q ${chartWidth}, ${chartHeight / 3}
                ${chartWidth - margin + 7}, ${chartHeight / 2 - 7}
            `}
						fill="none"
						stroke="currentColor"
						stroke-width="1"
						marker-end="url(#arrowhead)"
						class=""
					/>

					<text x={chartWidth - margin + 5} y={-8} text-anchor="end" class="fill-current">
						<tspan>Maximum:</tspan>
						<tspan
							>{Math.round(
								maxRegion[selectedView.dataKey]?.find((d) => d.period === selectedPeriod)?.value
							)} PKWs / 1000 EW</tspan
						>
						<tspan x={chartWidth - margin + 5} y={2}>in {maxRegion.name}</tspan>
					</text>
				</g>
			{/if}

			<!-- Dots -->
			{#each layoutPoints as p (p.region.code)}
				<circle
					cx={p.x}
					cy={p.y}
					r={p.highlight ? highlightRadius : defaultRadius}
					fill={selectedView.color}
					stroke={tooltip?.region.code === p.region.code ? '#000' : 'none'}
					stroke-width={tooltip?.region.code === p.region.code ? 1.5 : 0}
					class="beeswarm-circle {p.highlight ? 'opacity-100' : 'opacity-50'} cursor-pointer"
					role="button"
					style="transition: all 0.4s ease;"
					on:mouseenter={() => (tooltip = p)}
					on:mouseleave={() => (tooltip = null)}
					on:mousedown={() => dispatch('selectRegion', p.region.code)}
				/>
			{/each}
		</svg>

		<!-- Tooltip -->
		{#if tooltip}
			<div class="tooltip" style="top: {mouse.y + 10}px; left: {mouse.x + 10}px;">
				<strong>{tooltip.region.name}</strong><br />
				{format(tooltip.value)}
			</div>
		{/if}
	{/if}
</div>

<style>
	.tooltip {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		padding: 4px 8px;
		font-size: 12px;
		pointer-events: none;
		white-space: nowrap;
		border-radius: 4px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	circle.beeswarm-circle {
		transition:
			cx 0.4s ease,
			cy 0.4s ease,
			r 0.3s ease,
			fill 0.3s ease;
	}
</style>
