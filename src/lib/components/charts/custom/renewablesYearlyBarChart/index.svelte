<script>
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';
	import dayjs from 'dayjs';

	// Props
	export let regionCode = null;
	export let regionName = 'Deutschland';
	export let selectedEnergy = 'solar';

	// State
	let loading = true;
	let data = [];
	let updateDate = '';
	let hoveredYear = null;
	let chartHeight;
	let chartWidth;

	// Colors
	const colors = {
		solar: ['#F0E1C2', '#E0A906'],
		wind: ['#E5F3FA', '#003B80']
	};

	let margin = { top: 5, right: 30, bottom: 20, left: 50 };

	// Formatting
	function formatPower(value, energy = 'wind') {
		const sign = value < 0 ? '-' : '';
		const absValue = Math.abs(value);
		const unitPost = energy === 'solar' ? 'p' : '';

		if (absValue >= 1_000_000) {
			const gw = absValue / 1_000_000;
			const formatted = gw >= 10 ? gw.toFixed(1) : gw.toFixed(2);
			return `${sign}${formatted}\u202FGW${unitPost}`;
		} else if (absValue >= 1_000) {
			const mw = absValue / 1_000;
			const formatted = mw >= 10 ? mw.toFixed(1) : mw.toFixed(2);
			return `${sign}${formatted}\u202FMW${unitPost}`;
		} else if (absValue > 0) {
			const formatted = absValue >= 10 ? absValue.toFixed(0) : absValue.toFixed(1);
			return `${sign}${formatted}\u202FkW${unitPost}`;
		} else {
			return `0\u202FkW${unitPost}`;
		}
	}

	function formatNumber(value) {
		return new Intl.NumberFormat('de-DE').format(Math.round(value));
	}

	function getPowerUnit(maxValue, energy = 'wind') {
		if (maxValue >= 1_000_000) return 'GW' + (energy === 'solar' ? 'p' : '');
		if (maxValue >= 1_000) return 'MW' + (energy === 'solar' ? 'p' : '');
		return 'kW' + (energy === 'solar' ? 'p' : '');
	}

	function convertToPowerUnit(value, maxValue) {
		if (maxValue >= 1_000_000) return value / 1_000_000;
		if (maxValue >= 1_000) return value / 1_000;
		return value;
	}

	// Data fetching
	async function loadData() {
		loading = true;
		try {
			const url = regionCode
				? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${regionCode}`
				: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;

			const response = await fetch(url);
			const result = await response.json();

			data = result.by_year || [];
			updateDate = result.update_date;
			hoveredYear = data[data.length - 1]?.year;
			loading = false;
		} catch (error) {
			console.error('Failed to load renewables data:', error);
			loading = false;
		}
	}

	// Computed values
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: barWidth =
		chartWidth > 600 ? innerChartWidth / data.length - 5 : innerChartWidth / data.length - 2;
	$: minValue = min(data, (d) => d.net_power_kw);
	$: maxValue = max(data, (d) => d.net_power_kw);
	$: lastYear = data[data.length - 1]?.year;
	$: powerUnit = getPowerUnit(Math.max(Math.abs(minValue), Math.abs(maxValue)), selectedEnergy);

	$: yScale = scaleLinear()
		.domain([convertToPowerUnit(minValue, maxValue), convertToPowerUnit(maxValue, maxValue)])
		.range([innerChartHeight, 0]);

	$: xScale = scaleLinear()
		.domain([data[0]?.year || 2000, data[data.length - 1]?.year])
		.range([margin.left, chartWidth - margin.right]);

	$: currentYear = new Date().getFullYear();
	$: currentYearData = data.find((d) => d.year === currentYear);
	$: lastYearWithData = data.filter((d) => d.net_power_kw > 0).pop();
	$: totalAdded = data.reduce((acc, d) => acc + (d.net_power_kw || 0), 0);

	function onMouseMove(event) {
		const { left } = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - left;
		const year = Math.round(xScale.invert(x));
		if (year < data[0].year || year > data[data.length - 1].year) return;
		hoveredYear = year;
	}

	function onMouseLeave() {
		hoveredYear = lastYear;
	}

	// Reactive statements
	$: if (regionCode !== undefined || selectedEnergy) {
		loadData();
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="renewables-yearly-bar-chart">
	{#if loading}
		<div class="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
	{:else if data.length === 0}
		<p class="text-center text-gray-500 py-8">Keine Daten verfügbar</p>
	{:else}
		<!-- Header -->
		<div class="mb-4">
			<h3 class="font-bold text-lg">Netto-Zubau pro Jahr</h3>

			{#if totalAdded === 0}
				<p class="text-lg mt-2">
					Die Anlagen in dieser Region wurden alle vor dem Jahr 2000 in Betrieb genommen.
				</p>
			{:else if selectedEnergy === 'solar'}
				{#if currentYearData?.net_power_kw === 0}
					<h3 class="font-bold text-2xl mt-2">
						Seit Jahresbeginn wurden in {regionName} keine Solaranlagen installiert
					</h3>
				{:else}
					<h3 class="font-bold text-2xl mt-2">
						Seit Jahresbeginn wurden in {regionName}
						{formatPower(currentYearData?.net_power_kw || 0, selectedEnergy)}
						Solarkapazität installiert
					</h3>
				{/if}
			{:else if currentYearData?.net_power_kw === 0}
				<h3 class="font-bold text-2xl leading-tight text-balance mt-2">
					Zuletzt wurde im Jahr {lastYearWithData?.year} ein Windrad in {regionName} in Betrieb genommen.
				</h3>
			{:else}
				<h3 class="font-bold text-2xl leading-tight text-balance mt-2">
					Seit Jahresbeginn wurden in {regionName}
					{formatPower(currentYearData?.net_power_kw || 0, selectedEnergy)}
					Kapazität Windenergie installiert
				</h3>
			{/if}
		</div>

		<!-- Tooltip -->
		{#if hoveredYear}
			{#if data.find((d) => d.year === hoveredYear)}
				<div
					class="text-xs mt-1 inline-block rounded-full p-1 text-white font-bold"
					style="background: {colors[selectedEnergy][1]}"
				>
					<b>{hoveredYear}:</b>
					{#each data.filter((d) => d.year === hoveredYear) as item}
						<span>
							{formatPower(item.net_power_kw, selectedEnergy)}
						</span>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Chart -->
		{#if data.length > 0}
			<div
				class="flex gap-2 items-end h-64 mt-2 relative"
				bind:clientHeight={chartHeight}
				bind:clientWidth={chartWidth}
				on:mousemove={onMouseMove}
				on:mouseleave={onMouseLeave}
				role="img"
				aria-label="Bar chart"
			>
				<svg width="100%" height="100%">
					<!-- x-axis -->
					<g>
						{#each xScale.ticks(chartWidth > 600 ? 10 : 5) as year}
							<g
								transform="translate({xScale(year) + barWidth / 2},{chartHeight})"
								class="text-xs opacity-70"
							>
								<text text-anchor="middle" class="fill-current">{year}</text>
								<line x1={0} x2={0} y1={-20} y2={-12} stroke="currentColor" />
							</g>
						{/each}
					</g>

					<!-- y-axis -->
					<g>
						{#each yScale.ticks() as tick}
							<g
								transform="translate(0,{yScale(tick)})"
								class="text-xs {tick === 0 ? 'opacity-100' : 'opacity-50'}"
							>
								<line x1="40" x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-40" />
								<text x="0" text-anchor="left" dominant-baseline="middle" class="fill-current">
									{formatNumber(tick)}
									{#if tick === yScale.ticks().at(-1)}{powerUnit}{/if}
								</text>
							</g>
						{/each}
					</g>

					<!-- bars -->
					<g style="color: {colors[selectedEnergy][1]}">
						{#each data as item}
							<g class={hoveredYear && hoveredYear !== item.year ? 'opacity-70' : ''}>
								{#if item.net_power_kw >= 0}
									<rect
										x={xScale(item.year)}
										y={yScale(convertToPowerUnit(item.net_power_kw, maxValue))}
										width={barWidth}
										height={yScale(convertToPowerUnit(0, maxValue)) -
											yScale(convertToPowerUnit(item.net_power_kw, maxValue))}
										fill={colors[selectedEnergy][1]}
									/>
								{:else}
									<rect
										x={xScale(item.year)}
										y={yScale(convertToPowerUnit(0, maxValue))}
										width={barWidth}
										height={yScale(convertToPowerUnit(item.net_power_kw, maxValue)) -
											yScale(convertToPowerUnit(0, maxValue))}
										fill={colors[selectedEnergy][1]}
									/>
								{/if}
							</g>
						{/each}
					</g>

					{#if hoveredYear}
						{#if data.find((d) => d.year === hoveredYear)}
							<g>
								<line
									x1={xScale(hoveredYear) + barWidth / 2}
									x2={xScale(hoveredYear) + barWidth / 2}
									y1={0}
									y2={innerChartHeight}
									stroke="currentColor"
									stroke-dasharray="4 2"
									class="opacity-40"
								/>
								<text
									x={xScale(hoveredYear) + barWidth / 2}
									y={margin.top + innerChartHeight + 10}
									dominant-baseline="hanging"
									text-anchor="middle"
									class="text-xs fill-current font-bold"
								>
									{hoveredYear}
								</text>
							</g>
						{/if}
					{/if}
				</svg>
			</div>
		{/if}

		<!-- Footer -->
		<p class="text-sm mt-2 opacity-80">
			Datenquelle: Marktstammdatenregister der Bundesnetzagentur
			{#if selectedEnergy === 'wind'}| Goal100{/if}
			| Datenstand: {dayjs(updateDate).format('DD.MM.YYYY HH:mm')}
		</p>
	{/if}
</div>
