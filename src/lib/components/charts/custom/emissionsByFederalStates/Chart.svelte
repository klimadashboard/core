<!-- to add: chart federal states -->
<script>
	import { onMount } from 'svelte';
	import { scaleLinear, scaleOrdinal, scaleBand } from 'd3-scale';
	import { stack } from 'd3-shape';
	import { min, extent, max } from 'd3-array';
	import { geoPath, geoAlbers } from 'd3-geo';
	import topo from './austria.json';
	import Switch from '$lib/components/Switch.svelte';
	import { fade } from 'svelte/transition';
	import formatPercentage from '$lib/stores/formatPercentage';
	import {
		IconBolt,
		IconBuildingFactory2,
		IconCar,
		IconHome2,
		IconTractor,
		IconRecycle,
		IconWind,
		IconPlayerPlay,
		IconPlayerPause,
		IconMap
	} from '@tabler/icons-svelte-runes';

	export let maxYear;
	export let data;

	$: sectors = [
		{
			key: 'Energie_percapita',
			label: 'Energie',
			color: 'energy',
			iconComponent: IconBolt
		},
		{
			key: 'Industrie_percapita',
			label: 'Industrie',
			color: 'industry',
			iconComponent: IconBuildingFactory2
		},
		{
			key: 'Verkehr_percapita',
			label: 'Mobilität',
			color: 'mobility',
			iconComponent: IconCar
		},
		{
			key: 'Gebäude_percapita',
			label: 'Gebäude',
			color: 'building',
			iconComponent: IconHome2
		},
		{
			key: 'Landwirtschaft_percapita',
			label: 'Landwirtschaft',
			color: 'agriculture',
			iconComponent: IconTractor
		},
		{
			key: 'Müll_percapita',
			label: 'Abfall',
			color: 'waste',
			iconComponent: IconRecycle
		},
		{
			key: 'F-Gase_percapita',
			label: 'Fluorierte Gase',
			color: 'fgases',
			iconComponent: IconWind
		}
	];

	$: height = 200;
	$: width = 400;

	$: bounds = [
		[0, 0],
		[width, height]
	];

	$: activeState = '';

	$: projection = geoAlbers().center([0, 47.8]).rotate([-13.5, 0]).fitExtent(bounds, topo);

	$: domain = extent(data.map((d) => d['KSG_percapita']));

	$: colorScale = scaleLinear().range(['#6EC051', '#2C6319']).domain(domain);

	$: getColor = (feature) => {
		const dataForFeature = data.find(
			(d) => d.region == feature.properties['name'] && d.year == selectedYear
		);
		if (dataForFeature) return colorScale(dataForFeature['KSG_percapita']);
	};

	let chartWidth;
	let chartHeight;

	$: selectedYear = maxYear;

	$: selectedStates = data
		.filter((d) => d.year == selectedYear)
		.map((e) => e.region)
		.sort(sortStates);
	$: populations = selectedStates?.map((item, index) => {
		return data.filter((k) => k.region == item && k.year == selectedYear)[0].population;
	});

	$: padding = 5;

	$: xScale = scaleLinear()
		.range([0, chartWidth - 100])
		.domain([0, max(data, (d) => d.KSG_percapita) * 1.1]);

	$: yScale = scaleLinear()
		.rangeRound([0, chartHeight - 20])
		.domain([0, 9000000]);

	function arrayRemove(arr, value) {
		return arr.filter(function (ele) {
			return ele != value;
		});
	}

	$: handleMouseOver = function (feature) {
		if (selectedStates.includes(feature.properties.name)) {
			selectedStates = arrayRemove(selectedStates, feature.properties.name);
		} else {
			selectedStates.push(feature.properties.name);
			selectedStates = selectedStates.sort(sortStates);
		}
	};

	$: getLength = function (sector, state, cumulative) {
		var result = 0;
		if (cumulative) {
			var currentRow = data.filter((d) => d.region == state && d.year == selectedYear)[0];

			if (selectedSectors.length <= 0) {
				return 0;
			}

			var subset_sectors;
			if (sector == false) {
				subset_sectors = [...selectedSectors];
			} else {
				const subset_id = selectedSectors.findIndex((item) => item === sector);
				subset_sectors = selectedSectors.slice(0, subset_id);
			}
			if (subset_sectors.length > 0) {
				result = subset_sectors.reduce((a, b) => {
					return a + currentRow[b];
				}, 0);
			}
		} else {
			result = data.filter((d) => d.region == state && d.year == selectedYear)[0][sector];
		}
		return xScale(result);
	};

	$: playing = false;
	$: stopCommand = false;

	const playAnimation = function (stop) {
		if (stop) {
			playing = false;
			stopCommand = true;
		} else if (stopCommand == false) {
			playing = true;
			if (selectedYear == data[data.length - 1].year) {
				selectedYear = data[0].year;
			}
			selectedYear++;
			setTimeout(playAnimation, 300);
		} else {
			stopCommand = false;
		}
	};

	$: openMap = true;

	$: selectedSectors = [];

	onMount(async () => {
		selectedSectors = sectors.map((d) => d.key);

		// close map for mobile
		if (chartWidth < 1000) {
			openMap = false;
		}

		if (chartWidth < 500) {
			width = chartWidth;
		}
	});

	$: selectSector = function (sector) {
		const index = selectedSectors.indexOf(sector.key);
		if (index > -1) {
			selectedSectors.splice(index, 1);
		} else {
			selectedSectors.push(sector.key);
		}
		// sort the selected sectors so that the order is always according to the order of the select buttons
		selectedSectors = selectedSectors.sort((a, b) => {
			const idxA = sectors.findIndex((row) => row.key == a);
			const idxB = sectors.findIndex((row) => row.key == b);
			return idxA - idxB;
		});
	};

	$: sortKey = 'emissions';
	$: sortAscending = true;

	$: sortStates = function (a, b) {
		var sortValue = 0;
		if (sortKey == 'population') {
			sortValue =
				data.find((d) => d.region == a && d.year == selectedYear).population -
				data.find((d) => d.region == b && d.year == selectedYear).population;
		} else {
			// sort by emissions
			sortValue =
				data.find((d) => d.region == a && d.year == selectedYear).KSG_percapita -
				data.find((d) => d.region == b && d.year == selectedYear).KSG_percapita;
		}

		if (!sortAscending) {
			sortValue = sortValue * -1;
		}

		return sortValue;
	};

	$: formatNumber = function (number) {
		var string = '';
		if (number > 1000000) {
			string += Math.round((number / 1000000) * 100) / 100 + ' Mio.';
		} else {
			string += Math.round(number * 10) / 10;
		}

		return string;
	};
</script>

<div class="container mx-auto" style="">
	<div class="">
		<div class="flex gap-2">
			<input
				type="range"
				min="1990"
				max={maxYear}
				bind:value={selectedYear}
				aria-label="Jahr auswählen"
			/>
			<p class="text-sm text-gray-600">{selectedYear}</p>
			{#if !playing}
				<button on:mousedown={() => playAnimation(false)} aria-label="Play">
					<IconPlayerPlay size={24} />
				</button>
			{:else}
				<button on:mousedown={() => playAnimation(true)} aria-label="Pause">
					<IconPlayerPause size={24} />
				</button>
			{/if}
		</div>

		<div class="flex gap-2 mt-4 overflow-x-scroll">
			{#each sectors as sector}
				<button
					class="bg-{sector.color} flex space-x-2 items-center rounded-full font-semibold uppercase tracking-wide px-4 py-2 text-white text-sm {selectedSectors.includes(
						sector.key
					)
						? 'opacity-100'
						: 'opacity-70'}"
					on:mousedown={selectSector(sector)}
					aria-label={sector.label}
				>
					<svelte:component this={sector.iconComponent} size={20} color="white" />

					{#if activeState}
						<div class="text-left flex items-center gap-2 -my-2 pr-14">
							<div class="flex flex-col shrink-0 leading-tight text-xs">
								<p class="">
									{formatNumber(
										data.find((d) => d.year == selectedYear && d.region == activeState)[
											sector.key.replace('_percapita', '')
										]
									)} t gesamt
								</p>
								<p class="">
									{formatNumber(
										data.find((d) => d.year == selectedYear && d.region == activeState)[sector.key]
									)} t pro Kopf
								</p>
							</div>
						</div>
					{:else}
						<span>{sector.label}</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="" style="height: 80vh">
		<section
			class="xl:-mx-4 my-4 h-full"
			bind:clientHeight={chartHeight}
			bind:clientWidth={chartWidth}
		>
			<svg width={'100%'} height={'100%'}>
				<g class="text-sm text-gray-400 cursor-pointer">
					<text
						x="20"
						dominant-baseline="hanging"
						fill="currentColor"
						role="presentation"
								on:mousedown={() =>
								role="presentation"
							> (sortKey = 'emissions')}
						on:mousedown={() => (sortAscending = !sortAscending)}
					>
						Treibhausgas-Emissionen pro Kopf
						{#if sortKey == 'emissions'}
							{sortAscending ? '→' : '←'}
						{/if}
					</text>
					<text
						transform="rotate(270)"
						text-anchor="end"
						dominant-baseline="hanging"
						fill="currentColor"
						x="-19"
						role="presentation"
								on:mousedown={() =>
								role="presentation"
							> (sortKey = 'population')}
						on:mousedown={() => (sortAscending = !sortAscending)}
					>
						{#if sortKey == 'population'}
							{sortAscending ? '→' : '←'}
						{/if}
						Bevölkerung
					</text>
				</g>

				<g transform="translate(20, 20)">
					{#each selectedStates.sort(sortStates) as state, i}
						<g
							class="{activeState == state || activeState == ''
								? 'opacity-100'
								: 'opacity-70'} transition"
							transform="translate(0,{yScale(
								populations.slice(0, i).reduce((pv, cv) => pv + cv, 0)
							) || 0})"
							transition:fade|global
						>
							<g>
								{#each selectedSectors as sector, k}
									{@const dimensions = {
										width: getLength(sector, state, false),
										height: yScale(populations[i]) - padding
									}}
									<g
										transform="translate({getLength(sector, state, true)},0)"
										id="{state}-{sector}"
										class="text-{sectors.find((s) => s.key == sector).color}"
									>
										<rect
											fill="currentColor"
											class=""
											width={dimensions.width}
											height={dimensions.height}
											stroke="#fff"
										/>

										{#if dimensions.width > 36 && dimensions.height > 30}
											<g transform="translate(10,10)">
												<svelte:component this={sectors.find((s) => s.key == sector).iconComponent} size={24} color="white" />
											</g>
										{/if}

										<g class="text-white text-xs font-bold">
											{#if activeState == state && dimensions.width > 30 + sectors.find((s) => s.key == sector).label.length * 8 && dimensions.height > 30}
												<text
													fill="currentColor"
													dominant-baseline="hanging"
													text-anchor="end"
													x={dimensions.width - 10}
													y="10">{sectors.find((s) => s.key == sector).label}</text
												>
											{/if}
											{#if activeState == state && dimensions.width > 120 && dimensions.height > 60}
												<g transform="translate(10,{yScale(populations[i]) - padding - 10})">
													<text y="-12" fill="currentColor"
														>{formatNumber(
															data.find((d) => d.year == selectedYear && d.region == state)[
																sector.replace('_percapita', '')
															]
														)} t gesamt</text
													>
													<text fill="currentColor"
														>{formatNumber(
															data.find((d) => d.year == selectedYear && d.region == state)[sector]
														)} t pro Kopf</text
													>
												</g>
											{/if}
										</g>
										<rect
											width={dimensions.width}
											height={dimensions.height}
											fill="transparent"
											role="presentation"
								on:mouseover={() =>
								role="presentation"
							> (activeState = state)}
											on:focus={() => (activeState = state)}
											on:mouseout={() => (activeState = '')}
											on:blur={() => (activeState = '')}
										/></g
									>
								{/each}
							</g>
							{#if yScale(populations[i]) > 60}
								<g
									transform="translate({getLength(false, state, true) + 10 || 0},{(yScale(
										populations[i]
									) -
										padding) /
										2})"
								>
									<text dominant-baseline="auto" class="text-sm text-black fill-current"
										>{state}</text
									>
									<g class="text-gray-400 text-xs fill-current">
										<text dominant-baseline="hanging" y="6"
											>{formatNumber(
												data.find((d) => d.region == state && d.year == selectedYear).KSG
											)} t gesamt</text
										>
										<text dominant-baseline="hanging" y="20"
											>und {formatNumber(
												data.find((d) => d.region == state && d.year == selectedYear).KSG_percapita
											)} t pro Kopf</text
										>
									</g>
								</g>
							{:else}
								<g
									transform="translate({getLength(false, state, true) + 10 || 0},{(yScale(
										populations[i]
									) -
										padding) /
										2 || 0})"
								>
									<text dominant-baseline="middle" class="text-sm text-black fill-current"
										>{state}</text
									>
									{#if activeState == state}
										<g
											transform="translate({state.length * 7.5 || 0},0)"
											class="text-gray-400 text-xs fill-current"
										>
											<text dominant-baseline="auto"
												>{formatNumber(
													data.find((d) => d.region == state && d.year == selectedYear).KSG
												)} t gesamt</text
											>
											<text dominant-baseline="hanging"
												>und {formatNumber(
													data.find((d) => d.region == state && d.year == selectedYear)
														.KSG_percapita
												)} t pro Kopf</text
											>
										</g>
									{/if}
								</g>
							{/if}
						</g>
					{/each}
				</g>

				<g
					transform="translate({chartWidth - 24 || 0}, 0)"
					class="cursor-pointer"
					role="presentation"
								on:mousedown={() =>
								role="presentation"
							> (openMap = !openMap)}
				>
					<IconMap size={24} />
				</g>

				{#if width && height && chartWidth && openMap}
					<svg
						{width}
						{height}
						x={chartWidth - width}
						preserveAspectRatio="xMidYMid meet"
						class="bg-white"
					>
						<g>
							{#each topo.features as feature}
								<path
									d={geoPath().projection(projection)(feature)}
									fill={getColor(feature)}
									class="transition {activeState !== '' && activeState !== feature.properties.name
										? 'opacity-70'
										: 'opacity-100'}"
									stroke="#FFFFFF"
									strokeWidth="1"
									role="presentation"
								on:mouseup={() =>
								role="presentation"
							> handleMouseOver(feature)}
									on:touchstart={() => handleMouseOver(feature)}
									on:mouseover={() => (activeState = feature.properties.name)}
									on:focus={() => (activeState = feature.properties.name)}
									on:mouseout={() => (activeState = '')}
									on:blur={() => (activeState = '')}
									transition:fade|global
								/>
							{/each}</g
						>
						<!--
        <g style="pointer-events: none;">
          {#each topo.features as feature}
            <text
              text-anchor="middle"
              fill="white"
              style="filter: url(#shadow-sm); fill: black"
              x={geoPath().projection(projection).centroid(feature)[0]}
              y={geoPath().projection(projection).centroid(feature)[1]}
            >
              {getLabel(feature)}
            </text>
  
            <text
              text-anchor="middle"
              fill="white"
              x={geoPath().projection(projection).centroid(feature)[0]}
              y={geoPath().projection(projection).centroid(feature)[1]}
            >
              {getLabel(feature)}
            </text>
          {/each}</g
        >
        -->
					</svg>
				{/if}
			</svg>
		</section>
	</div>
</div>

<!-- 'bg-energy',
		'bg-building',
		'bg-industry',
		'bg-agriculture',
		'bg-mobility',
		'bg-waste',
		'bg-fgases',
		'bg-economy',
		'text-energy',
		'text-building',
		'text-industry',
		'text-agriculture',
		'text-mobility',
		'text-waste',
		'text-fgases',
		'text-economy',
		'border-energy',
		'border-building',
		'border-industry',
		'border-agriculture',
		'border-mobility',
		'border-waste',
		'border-fgases',
		'border-economy' -->
