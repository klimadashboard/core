<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import dayOfYear from 'dayjs/plugin/dayOfYear';
	import { line, area } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';

	dayjs.extend(dayOfYear);

	const getGasUsageData = async () => {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(
			readItems('energy', {
				filter: {
					_and: [{ region: { _eq: PUBLIC_VERSION } }, { category: { _eq: 'gas|usage' } }]
				},
				limit: -1,
				sort: ['period']
			})
		);

		const processedData = rawData.map((d) => ({
			period: dayjs(d.period),
			x: dayjs(d.period).dayOfYear(),
			y: d.value
		}));

		const data = processedData.filter((d) => d.period.year() == dayjs().year());
		const dataComparison = processedData.filter((d) => d.period.year() == dayjs().year() - 1);

		return { data, dataComparison };
	};

	const xLabels = ['Januar', 'Dezember'];
	const labels = ['2025', '2024'];

	$: promise = getGasUsageData();

	let chartWidth;
	let chartHeight;

	$: if (promise) {
		promise.then(({ data, dataComparison }) => {
			if (!data.length) return;

			xScale = scaleLinear()
				.domain([min(data, (d) => d.x), max(data, (d) => d.x)])
				.range([0, chartWidth]);

			if (dataComparison.length) {
				xScale = scaleLinear()
					.domain([min(dataComparison, (d) => d.x), max(dataComparison, (d) => d.x)])
					.range([0, chartWidth]);
			}

			yScale = scaleLinear()
				.domain([
					min([...data, ...dataComparison], (d) => d.y),
					max([...data, ...dataComparison], (d) => d.y)
				])
				.range([chartHeight - 20, 0]);
		});
	}

	let xScale, yScale;

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
		class="h-14 mt-2 w-full relative"
		bind:clientWidth={chartWidth}
		bind:clientHeight={chartHeight}
	>
		{#if chartWidth && chartHeight}
			<svg width="100%" height="100%" class="overflow-visible">
				<g>
					{#if d.dataComparison.length}
						<g>
							<path
								d={generateArea(d.dataComparison)}
								class="fill-current stroke-current opacity-0"
							/>
							<path
								d={generateLine(d.dataComparison)}
								class="fill-none stroke-current stroke-2 opacity-50"
							/>
						</g>
					{/if}
					<g>
						<path d={generateLine(d.data)} class="fill-none stroke-current stroke-2" />
					</g>

					{#if xLabels}
						<g transform="translate(0,{chartHeight})" class="text-xs">
							<text x={2} y={-4} dominant-baseline="bottom" class="fill-current">{xLabels[0]}</text>
							<text
								x={chartWidth - 2}
								y={-4}
								dominant-baseline="bottom"
								text-anchor="end"
								class="fill-current">{xLabels[1]}</text
							>
						</g>
					{/if}

					<circle
						cx={xScale(d.data[d.data.length - 1].x)}
						cy={yScale(d.data[d.data.length - 1].y)}
						r="4"
						class="fill-current"
					/>

					{#if labels}
						<g class="text-xs font-bold">
							{#if labels[0]}
								<text
									class="fill-current"
									text-anchor="start"
									dominant-baseline="middle"
									x={xScale(d.data[d.data.length - 1].x) + 10}
									y={yScale(d.data[d.data.length - 1].y)}>{labels[0]}</text
								>
							{/if}
							{#if labels[1] && d.dataComparison.length}
								<text
									class="fill-current opacity-50"
									text-anchor="end"
									dominant-baseline="middle"
									x={xScale(d.dataComparison[d.dataComparison.length - 1].x) - 10}
									y={yScale(d.dataComparison[d.dataComparison.length - 1].y) + 15}>{labels[1]}</text
								>
							{/if}
						</g>
					{/if}
				</g>
			</svg>
		{/if}
	</div>
{/await}
