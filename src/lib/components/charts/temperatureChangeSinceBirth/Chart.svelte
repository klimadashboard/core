<script>
	import { max, min, extent, bisector } from 'd3-array';
	import { scaleLinear, scaleOrdinal } from 'd3-scale';
	import { fade, draw } from 'svelte/transition';
	import { onMount } from 'svelte';
	import domtoimage from 'dom-to-image';
	import formatNumber from '$lib/stores/formatNumber';
	let item = null;
	let img = null;
	const debug = false;
	const canShare = navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] });

	// $: console.log(canShare);
	onMount(() => {
		if (debug) {
			setTimeout(() => {
				domtoimage
					.toBlob(item, {
						filter: (e) => {
							return Object.keys(e.dataset || {}).includes('shareIgnore') ? false : true;
						},
						width: item.offsetWidth * 4,
						height: item.offsetHeight * 4,
						quality: 1,
						style: {
							transform: 'scale(4)',
							transformOrigin: 'top left',
							width: item.offsetWidth + 'px',
							height: item.offsetHeight + 'px'
						}
					})
					.then(async function (blob) {
						var objectURL = URL.createObjectURL(blob);
						img.src = objectURL;
					});
			}, 2000);
		}
	});
	const share = async () => {
		domtoimage
			.toBlob(item, {
				filter: (e) => {
					return Object.keys(e.dataset || {}).includes('shareIgnore') ? false : true;
				},
				width: item.clientWidth * 4,
				height: item.clientHeight * 4,
				style: {
					transform: 'scale(4)',
					transformOrigin: 'top left'
				}
			})
			.then(async function (blob) {
				const filesArray = [
					new File([blob], year + '-' + today + '_temperatures_klimadashboard.png', {
						type: blob.type,
						lastModified: new Date().getTime()
					})
				];
				const shareData = {
					files: filesArray
				};
				try {
					await navigator.share(shareData);
				} catch (err) {
					// console.log('Cannot share data: ' + err);
				}
			});
		window.fathom.trackGoal('GCNSVJMU', 0);
	};
	export let data;
	let chartHeight;
	let chartWidth;
	let radius = 5;
	$: year = 1990;
	$: today = data[data.length - 1].year;
	$: temperatureYear = data.find((d) => d.year == year).average;
	$: temperatureToday = data[data.length - 1].average;
	$: temperature = temperatureToday - temperatureYear;
	$: error = false;
	$: updateValue = function (enteredYear) {
		if (data.find((d) => d.year == enteredYear) !== undefined && enteredYear < 2011) {
			year = enteredYear;
			error = false;
		} else {
			error = true;
		}
	};
	$: relevantDataset = data.filter((item) => item.year > year && item.year < today);
	$: xScale = scaleLinear()
		.rangeRound([0, chartWidth - 15])
		.domain([min(relevantDataset, (d) => d.year), max(relevantDataset, (d) => d.year)]);
	$: yScale = scaleLinear()
		.rangeRound([80, 0])
		.domain([
			min(relevantDataset, (d) => d.temperature),
			max(relevantDataset, (d) => d.temperature)
		]);
	const colors = ['#313695', '#a50026'];
	$: colorScale = scaleLinear()
		.range(colors)
		.domain([min(data, (d) => d.temperature), max(data, (d) => d.temperature)]);
	$: getColor = function (datapoint) {
		return colorScale(datapoint.temperature);
	};
</script>

<div class="" id="temperature-shareable">
	<div
		id="shareable-graphic"
		bind:clientHeight={chartHeight}
		bind:clientWidth={chartWidth}
		class="bg-white shadow hover:shadow-lg transition rounded w-80 h-80 mx-auto max-w-xl relative z-30"
	>
		{#if canShare}
			<button
				data-share-ignore
				on:click={() => share()}
				class="absolute top-4 right-4 dark:text-black"
				aria-label="Share"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-share"
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
					<circle cx="6" cy="12" r="3" />
					<circle cx="18" cy="6" r="3" />
					<circle cx="18" cy="18" r="3" />
					<line x1="8.7" y1="10.7" x2="15.3" y2="7.3" />
					<line x1="8.7" y1="13.3" x2="15.3" y2="16.7" />
				</svg>
			</button>
		{/if}
		{#if chartWidth && chartHeight}
			<div bind:this={item} class="h-full">
				<svg width={'100%'} height={'100%'} class="text-gray-100">
					<rect width={'100%'} height={'100%'} fill="currentColor" />
					<g class="text-4xl text-gray-600" transform="translate(15,50)">
						<text class="shareable-heading" y="0">Seit {year} hat</text>
						<text class="shareable-heading" y="40">sich Österreich</text>
						<text class="shareable-heading" y="80"
							>um {formatNumber(temperature)}<tspan>°C</tspan> erhitzt.</text
						>
						<g transform="translate(0,108)" class="text-sm">
							<text fill="currentColor">30-jähriger Temperaturdurchschnitt</text>
							<text fill="currentColor" y="20"
								>{year}
								<tspan dx="3" class="font-semibold opacity-80">
									{formatNumber(temperatureYear)}°C</tspan
								>
								– {today}
								<tspan dx="3" class="font-semibold opacity-80">
									{formatNumber(temperatureToday)}°C</tspan
								></text
							>
						</g>
					</g>

					<g transform="translate(5,180)">
						{#each relevantDataset as datapoint, i}
							<g
								transform={`translate(${xScale(datapoint.year)}, ${yScale(datapoint.temperature)})`}
								transition:fade={{ delay: i * 10 }}
							>
								<circle cx={radius / 2} cy={radius / 2} r={radius} fill={getColor(datapoint)} />
							</g>
						{/each}
					</g>
					<svg
						width="45"
						height="23"
						viewBox="0 0 45 23"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						x={15}
						y={chartHeight - 37}
					>
						<path
							d="M21.4928 0H0.571429C0.255837 0 0 0.255838 0 0.571429V22.2857C0 22.6013 0.255838 22.8571 0.571429 22.8571H21.4928C21.9997 22.8571 22.2557 22.2461 21.9 21.8848L12.0017 11.8294C11.7828 11.607 11.7828 11.2501 12.0017 11.0277L21.9 0.972296C22.2557 0.611036 21.9997 0 21.4928 0Z"
							fill="#7AC68A"
						/>
						<path
							opacity="0.6"
							d="M33.9197 0H24.2744C24.1207 0 23.9734 0.061952 23.8659 0.17186L13.2463 11.029C13.0291 11.2511 13.0291 11.606 13.2463 11.8281L23.8659 22.6853C23.9734 22.7952 24.1207 22.8571 24.2744 22.8571H33.9197C34.4266 22.8571 34.6826 22.2461 34.3269 21.8848L24.4286 11.8294C24.2097 11.607 24.2097 11.2501 24.4286 11.0277L34.3269 0.972296C34.6826 0.611036 34.4266 0 33.9197 0Z"
							fill="#7AC68A"
						/>
						<path
							opacity="0.2"
							d="M43.6373 0H36.5635C36.4098 0 36.2625 0.061952 36.155 0.17186L25.5354 11.029C25.3181 11.2511 25.3181 11.606 25.5354 11.8281L36.155 22.6853C36.2625 22.7952 36.4098 22.8571 36.5635 22.8571H43.6373C44.1443 22.8571 44.4002 22.2461 44.0446 21.8848L34.1463 11.8294C33.9273 11.607 33.9273 11.2501 34.1463 11.0277L44.0446 0.972296C44.4002 0.611036 44.1443 0 43.6373 0Z"
							fill="#7AC68A"
						/>
					</svg>
				</svg>
			</div>
		{/if}
	</div>
	<div
		class="bg-gradient-green p-8 pt-16 -mt-8 rounded shadow text-white relative z-10 max-w-2xl mx-auto flex flex-col items-center"
	>
		<h3 class="text-2xl text-center">Erstelle deine persönliche Temperaturgeschichte.</h3>
		<p class="text-lg max-w-lg text-center mx-auto">
			Gib dein Geburtsjahr ein und finde heraus, wie sehr sich Österreich seitdem im Flächenmittel
			erhitzt hat.
		</p>
		<label class="flex flex-col mt-4 space-y-1">
			<span class="text-sm uppercase font-medium hidden">Jahr</span>
			<input
				type="number"
				min={today - 100}
				max={today - 10}
				placeholder={year}
				autocomplete="bday-year"
				on:change={updateValue(this.value)}
				class="text-lg shadow appearance-none text-gray-600 border rounded w-32 py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
			/>
		</label>
		{#if error}
			<p class="mt-2">Bitte gib ein Jahr zwischen 1800 und 2010 ein.</p>
		{/if}
	</div>
</div>

<style>
	.shareable-heading {
		dominant-baseline: 'hanging';
		fill: currentColor;
	}
</style>
