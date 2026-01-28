<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import dayjs from 'dayjs';
	import dayOfYear from 'dayjs/plugin/dayOfYear';
	import { line, area } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';
	import Switch from '$lib/components/Switch.svelte';

	dayjs.extend(dayOfYear);

	let xScale;
	let yScale;

	let chartWidth;
	let chartHeight;

	$: getGasUsageData = async (view) => {
		const directus = getDirectusInstance(fetch);

		let filter = {};

		if (view !== 'full') {
			filter = {
				year: {
					_gte: 1824
				}
			};
		} else {
			filter = {
				year: {
					_gte: -100000000
				}
			};
		}

		const rawData = await directus.request(
			readItems('global_co2_concentration', {
				limit: -1,
				sort: ['year'],
				filter: filter
			})
		);

		const data = rawData.map((d) => ({
			x: d.year,
			y: d.mean
		}));

		xScale = scaleLinear()
			.domain([min(data, (d) => d.x), max(data, (d) => d.x)])
			.range([0, chartWidth - margin.left - margin.right]);

		yScale = scaleLinear()
			.domain([170, max(data, (d) => d.y) * 1.2])
			.range([chartHeight - margin.top - margin.bottom, 0]);

		return data;
	};

	$: promise = getGasUsageData(view);
	$: view = 'full';
	$: views = [
		{
			key: 'full',
			label: 'seit 800.000 Jahren'
		},
		{
			key: 'current',
			label: 'seit 100 Jahren'
		}
	];

	let margin = { top: 0, right: 25, bottom: 20, left: 0 };

	$: generateLine = (data) =>
		line()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.y))(data);

	$: generateArea = (data) =>
		area()
			.x((d) => xScale(d.x))
			.y0(chartHeight)
			.y1((d) => yScale(d.y))(data);
</script>

{#await promise then d}
	<div
		class="h-16 -mb-1 w-full relative"
		bind:clientWidth={chartWidth}
		bind:clientHeight={chartHeight}
	>
		<div class="absolute bg-current/20 rounded-full w-6 h-6 p-1">
			{#if view == 'full'}
				<button on:mousedown={() => (view = 'current')} aria-label="Zoom in">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-in w-4 h-4"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"
						/><path d="M7 10l6 0" /><path d="M10 7l0 6" /><path d="M21 21l-6 -6" /></svg
					>
				</button>
			{:else}
				<button on:mousedown={() => (view = 'full')} aria-label="Zoom out">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-out w-4 h-4"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"
						/><path d="M7 10l6 0" /><path d="M21 21l-6 -6" /></svg
					>
				</button>
			{/if}
		</div>
		{#if chartWidth && chartHeight && xScale && yScale}
			<svg width="100%" height="100%" class="overflow-visible">
				<g transform={`translate(${margin.left},${margin.top})`}>
					<g>
						<path d={generateLine(d)} class="fill-none stroke-current stroke-2" />
					</g>

					<g transform="translate({chartWidth - margin.left},0)">
						{#each yScale.ticks(2) as tick}
							<g transform="translate({-margin.left},{yScale(tick)})">
								<text class="fill-current text-xs" text-anchor="end" dominant-baseline="middle"
									>{tick}</text
								>
							</g>
						{/each}
					</g>

					<circle
						cx={xScale(d[d.length - 1].x)}
						cy={yScale(d[d.length - 1].y)}
						r="4"
						class="fill-current animate-pulse"
					/>
					<g class="text-xs fill-current" transform={`translate(0,${chartHeight - 5})`}>
						<text y={0} text-anchor="start">{d[0].x > 0 ? d[0].x : ''}</text>
						<text x={chartWidth - margin.right} text-anchor="end">{d[d.length - 1].x}</text>
					</g>
				</g>
			</svg>
		{/if}
	</div>
{/await}
