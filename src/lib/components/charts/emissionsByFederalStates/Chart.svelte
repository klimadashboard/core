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

	$: sectors = [
		{
			key: 'energy_co2e_t_percapita',
			label: 'Energie',
			color: 'energy',
			icon: "<svg width='16' height='20' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'industry_co2e_t_percapita',
			label: 'Industrie',
			color: 'industry',
			icon: "<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'traffic_co2e_t_percapita',
			label: 'Mobilität',
			color: 'mobility',
			icon: "<svg width='20' height='15' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'buildings_co2e_t_percapita',
			label: 'Gebäude',
			color: 'building',
			icon: "<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'agriculture_co2e_t_percapita',
			label: 'Landwirtschaft',
			color: 'agriculture',
			icon: "<svg width='20' height='16' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'waste_co2e_t_percapita',
			label: 'Abfall',
			color: 'waste',
			icon: "<svg width='22' height='21' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'fluorinated_gases_co2e_t_percapita',
			label: 'Fluorierte Gase',
			color: 'fluorinatedGases',
			icon: "<svg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		}
	];

	export let data;

	$: height = 200;
	$: width = 400;

	$: bounds = [
		[0, 0],
		[width, height]
	];

	$: activeState = '';

	$: projection = geoAlbers().center([0, 47.8]).rotate([-13.5, 0]).fitExtent(bounds, topo);

	$: domain = extent(data.map((d) => d['total_co2e_t_percapita']));

	$: colorScale = scaleLinear().range(['#6EC051', '#2C6319']).domain(domain);

	$: getColor = (feature) => {
		const dataForFeature = data.find(
			(d) => d.region == feature.properties['name'] && d.year == selectedYear
		);
		if (dataForFeature) return colorScale(dataForFeature['total_co2e_t_percapita']);
	};

	let chartWidth;
	let chartHeight;

	$: selectedYear = 2020;

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
		.domain([0, max(data, (d) => d.total_co2e_t_percapita)]);

	$: yScale = scaleLinear()
		.rangeRound([0, chartHeight - 20])
		.domain([0, 8900000]);

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
			var keys = Object.keys(currentRow);
			var selectedIndex = 0;
			if (sector == false) {
				selectedIndex = 25;
			} else {
				selectedIndex = keys.indexOf(sector);
			}
			var indexes = [];
			for (var i = 0; i < keys.length; i++) {
				if (selectedSectors.includes(keys[i])) {
					indexes.push(i);
				}
			}

			var values = Object.values(currentRow).filter((value, index) => {
				return indexes.includes(index) && index < selectedIndex;
			});

			result = values.reduce(function (a, b) {
				return a + b;
			}, 0);
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
		selectedSectors = selectedSectors;
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
				data.find((d) => d.region == a && d.year == selectedYear).total_co2e_t_percapita -
				data.find((d) => d.region == b && d.year == selectedYear).total_co2e_t_percapita;
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
				max="2020"
				bind:value={selectedYear}
				aria-label="Jahr auswählen"
			/>
			<p class="text-sm text-gray-600 ">{selectedYear}</p>
			{#if !playing}
				<button on:mousedown={() => playAnimation(false)} aria-label="Play">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-player-play"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M7 4v16l13 -8z" />
					</svg>
				</button>
			{:else}
				<button on:mousedown={() => playAnimation(true)} aria-label="Pause">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-player-pause"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<rect x="6" y="5" width="4" height="14" rx="1" />
						<rect x="14" y="5" width="4" height="14" rx="1" />
					</svg>
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
					{@html sector.icon}

					{#if activeState}
						<div class="text-left flex items-center gap-2 -my-2 pr-14">
							<div class="flex flex-col flex-shrink-0 leading-tight text-xs">
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
						on:mousedown={() => (sortKey = 'emissions')}
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
						on:mousedown={() => (sortKey = 'population')}
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
							transition:fade
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
												{@html sectors.find((s) => s.key == sector).icon}
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
											on:mouseover={() => (activeState = state)}
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
									<text dominant-baseline="auto" class="text-sm text-black  fill-current"
										>{state}</text
									>
									<g class="text-gray-400 text-xs fill-current">
										<text dominant-baseline="hanging" y="6"
											>{formatNumber(
												data.find((d) => d.region == state && d.year == selectedYear).total_co2e_t
											)} t gesamt</text
										>
										<text dominant-baseline="hanging" y="20"
											>und {formatNumber(
												data.find((d) => d.region == state && d.year == selectedYear)
													.total_co2e_t_percapita
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
									<text dominant-baseline="middle" class="text-sm text-black  fill-current"
										>{state}</text
									>
									{#if activeState == state}
										<g
											transform="translate({state.length * 7.5 || 0},0)"
											class="text-gray-400 text-xs fill-current"
										>
											<text dominant-baseline="auto"
												>{formatNumber(
													data.find((d) => d.region == state && d.year == selectedYear).total_co2e_t
												)} t gesamt</text
											>
											<text dominant-baseline="hanging"
												>und {formatNumber(
													data.find((d) => d.region == state && d.year == selectedYear)
														.total_co2e_t_percapita
												)} t pro Kopf</text
											>
										</g>
									{/if}
								</g>
							{/if}
						</g>
					{/each}
				</g>

				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-map cursor-pointer "
					x={chartWidth - 24 || 0}
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					on:mousedown={() => (openMap = !openMap)}
					on:focus={() => (openMap = !openMap)}
				>
					<rect width="24" height="24" class="fill-white" stroke-width="0" />
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<polyline points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" />
					<line x1="9" y1="4" x2="9" y2="17" />
					<line x1="15" y1="7" x2="15" y2="20" />
				</svg>

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
									on:mouseup={() => handleMouseOver(feature)}
									on:touchstart={() => handleMouseOver(feature)}
									on:mouseover={() => (activeState = feature.properties.name)}
									on:focus={() => (activeState = feature.properties.name)}
									on:mouseout={() => (activeState = '')}
									on:blur={() => (activeState = '')}
									transition:fade
								/>
							{/each}</g
						>
						<!--
        <g style="pointer-events: none;">
          {#each topo.features as feature}
            <text
              text-anchor="middle"
              fill="white"
              style="filter: url(#shadow); fill: black"
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
