<script>
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { extent } from 'd3-array';
	import dayjs from 'dayjs';

	// Props
	export let regionCode = null;
	export let regionName = 'Deutschland';
	export let regionArea = null;
	export let selectedEnergy = 'solar';
	export let regions = [];

	// State
	let loading = false;
	let mainData = [];
	let comparisonData = [];
	let updateDate = '';
	let selectedUnit = 'absolute';
	let searchTerm = '';
	let hoveredSeries = null;
	let chartHeight;
	let chartWidth;

	// Colors
	const colors = {
		solar: ['#F0E1C2', '#E0A906'],
		wind: ['#E5F3FA', '#003B80']
	};

	const palette = [
		'#e41a1c',
		'#377eb8',
		'#4daf4a',
		'#984ea3',
		'#ff7f00',
		'#a65628',
		'#f781bf',
		'#999999'
	];

	let margin = { top: 10, right: 20, bottom: 40, left: 70 };

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

	// Distance calculation
	function getDistance(center1, center2) {
		if (!center1 || !center2) return Infinity;
		const toRad = (d) => (d * Math.PI) / 180;
		const R = 6371;
		const dLat = toRad(parseFloat(center2[1]) - parseFloat(center1[1]));
		const dLon = toRad(parseFloat(center2[0]) - parseFloat(center1[0]));
		const lat1 = toRad(parseFloat(center1[1]));
		const lat2 = toRad(parseFloat(center2[1]));
		const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	// Data fetching
	async function loadMainData() {
		loading = true;
		try {
			const url = regionCode
				? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${regionCode}`
				: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;

			const response = await fetch(url);
			const result = await response.json();

			mainData = result.by_year || [];
			updateDate = result.update_date;

			comparisonData = [
				{
					code: regionCode || 'DE',
					name: regionName,
					data: mainData,
					color: colors[selectedEnergy][1]
				}
			];

			loading = false;
		} catch (error) {
			console.error('Failed to load renewables data:', error);
			loading = false;
		}
	}

	async function loadRegionData(code, name) {
		try {
			const url = code
				? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${code}`
				: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;

			const response = await fetch(url);
			const result = await response.json();
			return result.by_year || [];
		} catch (error) {
			console.error(`Failed to load data for ${name}:`, error);
			return [];
		}
	}

	async function toggleRegion(region) {
		const isSelected = comparisonData.some((d) => d.code === region.code);

		if (isSelected && comparisonData.length > 1) {
			comparisonData = comparisonData.filter((d) => d.code !== region.code);
		} else if (!isSelected) {
			loading = true;
			const data = await loadRegionData(region.code, region.name);
			const colorIndex = comparisonData.length - 1;
			comparisonData = [
				...comparisonData,
				{
					code: region.code,
					name: region.name,
					data,
					color: palette[colorIndex % palette.length]
				}
			];
			loading = false;
		}

		searchTerm = '';
	}

	// Prepare chart data
	$: chartSeries = (() => {
		const series = comparisonData.map((s) => {
			const regionInfo = regions.find((r) => r.code === s.code);
			return {
				name: s.name,
				color: s.color,
				code: s.code,
				data: s.data.map((point) => ({
					year: point.year,
					value:
						selectedUnit === 'perArea' && regionInfo?.area
							? point.cumulative_power_kw / regionInfo.area
							: point.cumulative_power_kw
				}))
			};
		});

		// Add goal line (+50% by 2035)
		if (mainData.length > 0) {
			const baseValue = mainData.find((d) => d.year === 2024)?.cumulative_power_kw || 0;
			const goalValue = baseValue * 1.5;
			const currentYear = new Date().getFullYear();
			const regionInfo = regions.find((r) => r.code === (regionCode || 'DE'));

			const goalData = [];
			for (let year = currentYear; year <= 2035; year++) {
				const value =
					selectedUnit === 'perArea' && regionInfo?.area ? goalValue / regionInfo.area : goalValue;
				goalData.push({ year, value });
			}

			series.push({
				name: 'Ziel (+50% bis 2035)',
				color: '#999',
				isDashed: true,
				data: goalData
			});
		}

		return series;
	})();

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: allValues = chartSeries.flatMap((s) => s.data.map((d) => d.value));
	$: maxValue = Math.max(...allValues);

	$: unit =
		selectedUnit === 'perArea'
			? `kW${selectedEnergy === 'solar' ? 'p' : ''}/km²`
			: maxValue >= 1_000_000
				? `GW${selectedEnergy === 'solar' ? 'p' : ''}`
				: maxValue >= 1_000
					? `MW${selectedEnergy === 'solar' ? 'p' : ''}`
					: `kW${selectedEnergy === 'solar' ? 'p' : ''}`;

	$: divisor =
		selectedUnit === 'perArea'
			? 1
			: maxValue >= 1_000_000
				? 1_000_000
				: maxValue >= 1_000
					? 1_000
					: 1;

	$: allYears = chartSeries.flatMap((s) => s.data.map((d) => d.year));
	$: yearExtent = extent(allYears);

	$: xScale = scaleLinear()
		.domain(yearExtent)
		.range([margin.left, chartWidth - margin.right]);

	$: yScale = scaleLinear()
		.domain([0, maxValue / divisor])
		.range([chartHeight - margin.bottom, margin.top]);

	$: lineGenerator = line()
		.x((d) => xScale(d.year))
		.y((d) => yScale(d.value / divisor));

	// Searchable regions
	$: searchableRegions = regions
		.filter((r) => r.layer !== 'country' && r.visible)
		.sort((a, b) => {
			if (!a.center || !b.center) return 0;
			const currentRegion = regions.find((r) => r.code === regionCode);
			if (!currentRegion?.center) return 0;
			return (
				getDistance(currentRegion.center, a.center) - getDistance(currentRegion.center, b.center)
			);
		});

	$: filteredSearchRegions = searchableRegions
		.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.slice(0, 10);

	$: currentYearData = mainData.find((d) => d.year === new Date().getFullYear());

	// Reactive statements
	$: if (regionCode !== undefined || selectedEnergy) {
		loadMainData();
	}

	onMount(() => {
		loadMainData();
	});
</script>

<div class="renewables-cumulative-line-chart">
	{#if loading && comparisonData.length === 0}
		<div class="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
	{:else if mainData.length === 0}
		<p class="text-center text-gray-500 py-8">Keine Daten verfügbar</p>
	{:else}
		<!-- Header -->
		<div class="mb-4">
			<h3 class="font-bold text-lg">Kumulative Leistung</h3>
			<h3 class="font-bold text-2xl mt-2">
				Insgesamt wurden bisher in {regionName}
				{formatPower(currentYearData?.cumulative_power_kw || 0, selectedEnergy)}
				installiert
			</h3>
		</div>

		<!-- Controls -->
		<div class="flex items-center gap-2 flex-wrap mb-4">
			<!-- Region Search -->
			<div class="relative">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Region hinzufügen..."
					class="bg-gray-100 dark:bg-gray-800 rounded-full py-2 px-4 text-sm"
				/>
				{#if searchTerm && filteredSearchRegions.length > 0}
					<div
						class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
					>
						{#each filteredSearchRegions as region}
							<button
								class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
								on:click={() => toggleRegion(region)}
							>
								{region.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Unit Toggle -->
			<div class="bg-gray-100 dark:bg-gray-800 rounded-full p-2 px-3 text-sm inline-flex gap-2">
				<label class={selectedUnit === 'absolute' ? 'font-bold' : ''}>
					<input type="radio" name="unit" value="absolute" class="mr-1" bind:group={selectedUnit} />
					absolut
				</label>
				<label class={selectedUnit === 'perArea' ? 'font-bold' : ''}>
					<input type="radio" name="unit" value="perArea" class="mr-1" bind:group={selectedUnit} />
					pro km²
				</label>
			</div>
		</div>

		<!-- Chart -->
		<div class="relative">
			{#if loading}
				<div
					class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10"
				>
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"
					></div>
				</div>
			{/if}

			<div
				class="h-96"
				class:opacity-30={loading}
				bind:clientHeight={chartHeight}
				bind:clientWidth={chartWidth}
			>
				{#if chartWidth > 0 && chartHeight > 0}
					<svg width="100%" height="100%">
						<!-- y-axis grid -->
						<g>
							{#each yScale.ticks() as tick}
								<line
									x1={margin.left}
									x2={chartWidth - margin.right}
									y1={yScale(tick)}
									y2={yScale(tick)}
									stroke="currentColor"
									class="opacity-10"
								/>
							{/each}
						</g>

						<!-- x-axis -->
						<g>
							{#each xScale.ticks(chartWidth > 600 ? 10 : 5) as year}
								<g
									transform="translate({xScale(year)},{chartHeight - margin.bottom})"
									class="text-xs opacity-70"
								>
									<text text-anchor="middle" dy="1.5em" class="fill-current">{year}</text>
									<line y2="6" stroke="currentColor" />
								</g>
							{/each}
						</g>

						<!-- y-axis -->
						<g>
							{#each yScale.ticks() as tick}
								<g transform="translate({margin.left},{yScale(tick)})" class="text-xs opacity-70">
									<text
										text-anchor="end"
										dx="-0.5em"
										dominant-baseline="middle"
										class="fill-current"
									>
										{formatNumber(tick)}
									</text>
									<line x2="-6" stroke="currentColor" />
								</g>
							{/each}
							<text
								transform="rotate(-90)"
								x={-(chartHeight / 2)}
								y={15}
								text-anchor="middle"
								class="text-xs fill-current font-medium"
							>
								↑ {unit}
							</text>
						</g>

						<!-- Lines -->
						{#each chartSeries as series}
							<path
								d={lineGenerator(series.data)}
								fill="none"
								stroke={series.color}
								stroke-width={hoveredSeries === series.name || !hoveredSeries ? 2 : 1}
								stroke-dasharray={series.isDashed ? '5,5' : null}
								opacity={hoveredSeries === series.name || !hoveredSeries ? 1 : 0.3}
								on:mouseenter={() => (hoveredSeries = series.name)}
								on:mouseleave={() => (hoveredSeries = null)}
								class="transition-all cursor-pointer"
							/>
						{/each}
					</svg>
				{/if}
			</div>
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap gap-3 mt-4 text-sm">
			{#each chartSeries as series}
				<div
					class="flex items-center gap-2 cursor-pointer"
					on:mouseenter={() => (hoveredSeries = series.name)}
					on:mouseleave={() => (hoveredSeries = null)}
					role="button"
					tabindex="0"
				>
					<div
						style="width: 20px; height: 3px; background: {series.color}; {series.isDashed
							? 'background-image: repeating-linear-gradient(to right, ' +
								series.color +
								' 0, ' +
								series.color +
								' 5px, transparent 5px, transparent 10px);'
							: ''}"
					></div>
					<span class={hoveredSeries === series.name ? 'font-bold' : ''}>{series.name}</span>
					{#if !series.isDashed && comparisonData.find((d) => d.code === series.code) && comparisonData.length > 1}
						<button
							on:click|stopPropagation={() => toggleRegion({ code: series.code })}
							class="text-red-600 hover:text-red-700 ml-1"
							aria-label="Entfernen"
						>
							×
						</button>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Footer -->
		<p class="text-sm mt-4 opacity-80">
			Datenquelle: Marktstammdatenregister der Bundesnetzagentur
			{#if selectedEnergy === 'wind'}| Goal100{/if}
			| Datenstand: {dayjs(updateDate).format('DD.MM.YYYY HH:mm')}
		</p>
	{/if}
</div>
