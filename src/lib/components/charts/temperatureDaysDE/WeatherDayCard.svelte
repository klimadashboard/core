<script>
	import dayjs from 'dayjs';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let selectedStation;
	export let selectedStationName;
	export let selectedStationData;
	export let title;
	export let description;
	export let icon;
	export let color;
	export let key;
	export let selectedReferenceYears;
	export let earliestPossibleYear;
	export let latestPossibleYear;

	let chartHeight;
	let chartWidth;

	$: totalForKeyCurrentYear = !selectedStationData?.length ? 0 : selectedStationData.find(data => data.year == latestPossibleYear)[key];
	$: currentYear = latestPossibleYear;
	$: timestamp = dayjs(selectedStationData[selectedStationData.length - 1].endDate).format('DD.MM');
	$: firstYear =
		[1961, 1991].indexOf(selectedReferenceYears) == -1
			? earliestPossibleYear
			: selectedReferenceYears;
	$: lastYear =
		[1961, 1991].indexOf(selectedReferenceYears) == -1
			? latestPossibleYear
			: selectedReferenceYears + 29;
	$: totalDays = selectedStationData
		// .filter((d) => dayjs(d.endDate).year() >= firstYear && dayjs(d.endDate).year() <= lastYear)
		.filter((d) => d.year >= firstYear && d.year <= lastYear)
		.filter((d) => d[key] >= 0);

	$: totalForKeyHistoricalAverage = Math.round(
		totalDays.reduce((a, b) => a + b[key], 0) / totalDays.length
	);
</script>

<div
	bind:clientHeight={chartHeight}
	bind:clientWidth={chartWidth}
	class="w-full h-72 rounded overflow-hidden"
	style="color: {color}"
>
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'}>
			<rect width={chartWidth} height={chartHeight} class="text-gray-100 fill-current" />

			<rect width={chartWidth} height={70} class="fill-current" />

			<text x="15" y="16" dominant-baseline="hanging" class="text-2xl font-medium fill-white"
				>{title}</text
			>
			<text x="15" y="42" dominant-baseline="hanging" class="fill-white">{description}</text>

			<g transform="translate({chartWidth - 55},15) scale(1.8)" class="text-white">
				{@html icon}
			</g>

			<g transform="translate(15,130)">
				<text transform="translate(0,0)" class="text-6xl font-extralight fill-current"
					>{totalForKeyCurrentYear}</text
				>
				<g transform="translate({totalForKeyCurrentYear.toString().length * 36},0)">
					{#if latestPossibleYear == new Date().getFullYear()}
					<text class="font-semibold fill-current" y="-18">{title} bisher</text>
					{:else}
					<text class="font-semibold fill-current" y="-18">{title}</text>
					{/if}
					<text class="font-semibold fill-current">im Jahr {latestPossibleYear}</text>
				</g>
			</g>

			<line x1="0" y1="150" x2={chartWidth} y2="150" class="stroke-white" />

			<g transform="translate(15,210)">
				<text transform="translate(0,0)" class="text-6xl font-extralight fill-current"
					>{totalForKeyHistoricalAverage}</text
				>
				<g transform="translate({totalForKeyHistoricalAverage.toString().length * 36},0)">
					{#if latestPossibleYear == new Date().getFullYear()}
					<text class="font-semibold fill-current" y="-18">{title} bis {timestamp} im</text>
					{:else}
					<text class="font-semibold fill-current" y="-18">{title} im</text>
					{/if}
					<text class="font-semibold fill-current">Durchschnitt {firstYear} – {lastYear}</text>
				</g>
			</g>

			<svg
				width="45"
				height="23"
				viewBox="0 0 45 23"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				x={15}
				y={chartHeight - 38}
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

			<text
				x={chartWidth - 15}
				y={chartHeight - 15}
				dominant-baseline="end"
				text-anchor="end"
				class="text-xs opacity-50 fill-gray-700"
				style="font-size: 0.7em;"
				>{selectedStationName} – {selectedStation}
				{PUBLIC_VERSION == 'at' ? `– ${timestamp}` : ''} – {PUBLIC_VERSION == 'at'
					? 'Geosphere'
					: 'DWD'}</text
			>
		</svg>
	{/if}
</div>
