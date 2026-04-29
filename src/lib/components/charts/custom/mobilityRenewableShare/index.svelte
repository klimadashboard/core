<script context="module" lang="ts">
	function clickOutside(node: HTMLElement, handler: (event: MouseEvent) => void) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				handler(event);
			}
		};
		document.addEventListener('click', handleClick, true);
		return { destroy() { document.removeEventListener('click', handleClick, true); } };
	}
</script>

<script lang="ts">
	import { Chart, AxisX, AxisY, Line, Area, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		AsyncGetMobilityRenewableShare,
		AsyncGetCountries,
		type GetMobilityRenewableShareQuery,
		type GetCountriesQuery
	} from './__generated__/getData.generated';
	import { onMount } from 'svelte';
	import { transformDataForChart, type LineChartData } from './transformData';
	import { FOSSIL_COLOR } from './constants';

	let loading = true;
	let error: Error | null = null;
	let lineChartData: LineChartData = { chartData: [], keys: [], labels: [], colors: [] };
	let compareCountries = false;
	let currentCountry = 'DE';
	let availableCountries: { id: string; name: string | null | undefined; selected: boolean }[] = [];
	let data: GetMobilityRenewableShareQuery['mobility'];
	let countries: GetCountriesQuery['countries'];
	let selectedCountries: string[] = [];
	let isDropdownOpen = false;

	function getCountryFromDomain(): string {
		const hostname = window.location.hostname;
		if (hostname.includes('.at')) return 'AT';
		if (hostname.includes('.de')) return 'DE';
		return 'DE';
	}

	$: defaultCountries = compareCountries ? [currentCountry, 'SE', 'FR', 'PL'] : [currentCountry];

	function updateChartData() {
		if (!data?.length || !countries?.length) return;
		selectedCountries = availableCountries.filter((c) => c.selected).map((c) => c.id);
		lineChartData = transformDataForChart(
			data.filter((item) => selectedCountries.includes(item.region ?? '')),
			countries,
			currentCountry
		);
		if (selectedCountries.length === 1) {
			const key = selectedCountries[0];
			const chartDataWithFossil = lineChartData.chartData.map((d) => ({
				...d,
				fossil: Math.max(0, 100 - (d[key] ?? 0))
			}));
			lineChartData = {
				chartData: chartDataWithFossil,
				keys: [...lineChartData.keys, 'fossil'],
				labels: ['Erneuerbar', 'Fossil'],
				colors: [...lineChartData.colors, FOSSIL_COLOR]
			};
		}
	}

	function toggleCountry(id: string) {
		const idx = availableCountries.findIndex((c) => c.id === id);
		if (idx !== -1) {
			availableCountries[idx].selected = !availableCountries[idx].selected;
			availableCountries = [...availableCountries];
			updateChartData();
		}
	}

	onMount(async () => {
		currentCountry = getCountryFromDomain();
		try {
			const [mobilityData, countriesData] = await Promise.all([
				AsyncGetMobilityRenewableShare({}),
				AsyncGetCountries({})
			]);
			data = mobilityData.data.mobility;
			countries = countriesData.data.countries;
			availableCountries = countries
				.filter((c) => data.some((item) => item.region === c.id))
				.map((c) => ({ id: c.id, name: c.name_de, selected: defaultCountries.includes(c.id) }))
				.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
			updateChartData();
		} catch (e) {
			error = e as Error;
		} finally {
			loading = false;
		}
	});

	$: showAreas = lineChartData.keys.includes('fossil');
	$: legendItems = lineChartData.keys.map((k, i) => ({
		key: k,
		label: lineChartData.labels[i] ?? k,
		color: lineChartData.colors[i]
	}));
	$: chartData = lineChartData.chartData.map((d, i) => ({ ...d, _x: i }));
</script>

<div class="w-full p-4">
	{#if loading}
		<div class="h-[400px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[400px] flex items-center justify-center text-red-500">
			Error loading chart data: {error.message}
		</div>
	{:else if data?.length}
		<div class="flex flex-col gap-4">
			<!-- Controls -->
			<div class="flex flex-col sm:flex-row gap-2 items-center justify-between relative">
				<label class="flex items-center gap-2 cursor-pointer py-1.5">
					<input
						type="checkbox"
						class="cursor-pointer"
						bind:checked={compareCountries}
						on:change={() => {
							availableCountries = availableCountries.map((c) => ({
								...c,
								selected: defaultCountries.includes(c.id)
							}));
							updateChartData();
						}}
					/>
					<span>Mit anderen Ländern vergleichen</span>
				</label>

				{#if compareCountries}
					<div class="flex items-center gap-2 relative">
						<span class="text-sm text-gray-600">
							{selectedCountries.length} von {availableCountries.length} ausgewählt
						</span>
						<button
							id="dropdown-button"
							class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2 border border-gray-300"
							on:click={() => (isDropdownOpen = !isDropdownOpen)}
						>
							<span class="font-medium">Länderauswahl</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
					</div>
				{/if}

				{#if isDropdownOpen}
					<div
						class="absolute z-10 top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
						use:clickOutside={() => (isDropdownOpen = false)}
					>
						<div class="p-2 border-b border-gray-200">
							<div class="flex justify-between items-center">
								<span class="font-medium">Länder</span>
								<div class="flex gap-2">
									<button class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
										on:click={() => { availableCountries = availableCountries.map((c) => ({ ...c, selected: true })); updateChartData(); }}>
										Alle
									</button>
									<button class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
										on:click={() => { availableCountries = availableCountries.map((c) => ({ ...c, selected: false })); updateChartData(); }}>
										Keine
									</button>
								</div>
							</div>
						</div>
						<div class="p-2">
							{#each availableCountries as country}
								<label class="flex items-center gap-2 hover:bg-gray-100 p-1 rounded cursor-pointer">
									<input type="checkbox" checked={country.selected} on:change={() => toggleCountry(country.id)} />
									<span>{country.name}</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			{#if chartData.length > 0}
				<Legend items={legendItems} />
				<Chart
					data={chartData}
					x="_x"
					y={lineChartData.keys}
					height={360}
					yMin={0}
					yMax={100}
					margin={{ top: 10, right: 20, bottom: 35, left: 50 }}
				>
					<svelte:fragment
						slot="default"
						let:xScale
						let:yScale
						let:xDomain
						let:innerWidth
						let:innerHeight
						let:hover
					>
						<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
						<AxisX
							{xScale}
							{xDomain}
							{innerWidth}
							{innerHeight}
							format={(v) => chartData[Math.round(v)]?.label ?? ''}
							tickCount={5}
						/>

						{#each lineChartData.keys as key, i}
							{#if showAreas}
								<Area
									data={chartData}
									x="_x"
									y={key}
									color={lineChartData.colors[i]}
									{xScale}
									{yScale}
									opacity={0.4}
									curve="monotone"
								/>
							{/if}
							<Line
								data={chartData}
								x="_x"
								y={key}
								{xScale}
								{yScale}
								stroke={lineChartData.colors[i]}
								strokeWidth={2}
								dots={true}
								dotRadius={3}
								{hover}
							/>
						{/each}

						<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit="%" />
					</svelte:fragment>

					<svelte:fragment slot="tooltip" let:hover>
						{#if hover.x !== null}
							{@const pt = chartData.find((d) => d._x === hover.x)}
							{#if pt}
								<Tooltip
									visible
									x={hover.clientX}
									y={hover.clientY}
									title={pt.label ?? String(hover.x)}
									items={lineChartData.keys
										.filter((k) => pt[k] != null)
										.map((k, i) => ({
											label: lineChartData.labels[i] ?? k,
											value: formatNumber(pt[k], 1) + '%',
											color: lineChartData.colors[i]
										}))}
								/>
							{/if}
						{/if}
					</svelte:fragment>
				</Chart>
			{:else}
				<div class="h-[360px] flex items-center justify-center text-gray-500">
					Keine Daten verfügbar
				</div>
			{/if}
		</div>
	{:else}
		<div class="h-[400px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{/if}
</div>
