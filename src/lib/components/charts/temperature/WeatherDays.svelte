<script>
	import WeatherDaysCard from './WeatherDaysCard.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { types } from '$lib/stores/weather';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import 'dayjs/locale/de';

	dayjs.extend(relativeTime);
	dayjs.locale('de');

	export let data;
	export let selectedStation;

	$: selectedYear = dayjs().month() > 4 ? dayjs().year() : dayjs().year() - 1;
	$: compareFirstYear = Math.max(1961, firstDate.year());
	$: compareLastYear = Math.max(1990, firstDate.year() + 30);
	$: firstDate = dayjs(data[0].date);
	$: lastDate = dayjs(data[data.length - 1].date);

	const isDay = function (key, d) {
		if (key == 'iceDay') {
			return d.tlmax <= 0;
		} else if (key == 'summerDay') {
			return d.tlmax >= 25;
		} else if (key == 'heatDay') {
			return d.tlmax >= 30;
		} else if (key == 'tropicalNight') {
			return d.tlmin >= 20;
		} else if (key == 'extremeHeatDay') {
			return d.tlmax >= 35;
		} else if (key == 'frostDay') {
			return d.tlmin < 0;
		} else {
			return false;
		}
	};

	$: dataCurrent = data.filter((d) => dayjs(d.date).year() == selectedYear);
	$: dataComparison = data.filter(
		(d) => dayjs(d.date).year() >= compareFirstYear && dayjs(d.date).year() <= compareLastYear
	);

	// if current year is selected; only use dates up to today’s date for historic comparison
	$: if (selectedYear == lastDate.year()) {
		dataComparison = dataComparison.filter((d) => dayjs(d.date).year(lastDate.year()) <= lastDate);
	} else {
		dataComparison = dataComparison;
	}

	$: resultCurrent = $types.map((d) => {
		return {
			key: d.key,
			value: dataCurrent.filter((e) => isDay(d.key, e)).length
		};
	});

	$: resultComparison = $types.map((d) => {
		return {
			key: d.key,
			value: Math.round(
				dataComparison.filter((e) => isDay(d.key, e)).length / (compareLastYear - compareFirstYear)
			)
		};
	});

	$: lastHeatDay = [...data].reverse().find((d) => isDay('heatDay', d));
	$: heatDaysThisYear = [...data]
		.filter((d) => new Date(d.date).getFullYear() == new Date().getFullYear())
		.filter((d) => isDay('heatDay', d)).length;
	$: lastSummerDay = [...data].reverse().find((d) => isDay('summerDay', d));
	$: summerDaysThisYear = [...data]
		.filter((d) => new Date(d.date).getFullYear() == new Date().getFullYear())
		.filter((d) => isDay('summerDay', d)).length;

	function countFirstConsecutiveItemsFromStart(arr, condition) {
		// Check if the first element meets the condition, otherwise return false
		if (!condition(arr[0])) return false;

		// Find the index where the streak ends
		const endIndex = arr.findIndex((item, index) => index > 0 && !condition(item));

		// If no such index is found (all elements satisfy the condition), use the array's length
		return endIndex === -1 ? arr.length : endIndex;
	}

	$: heatWaveLength = countFirstConsecutiveItemsFromStart([...data].reverse(), (d) =>
		isDay('heatDay', d)
	);

	$: console.log(heatWaveLength);
</script>

{#if heatWaveLength > 2}
	<p class="text-[#DB5537] uppercase font-bold text-sm tracking-wide mb-1">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="inline -translate-y-0.5"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M10.425 1.414a3.33 3.33 0 0 1 3.026 -.097l.19 .097l6.775 3.995l.096 .063l.092 .077l.107 .075a3.224 3.224 0 0 1 1.266 2.188l.018 .202l.005 .204v7.284c0 1.106 -.57 2.129 -1.454 2.693l-.17 .1l-6.803 4.302c-.918 .504 -2.019 .535 -3.004 .068l-.196 -.1l-6.695 -4.237a3.225 3.225 0 0 1 -1.671 -2.619l-.007 -.207v-7.285c0 -1.106 .57 -2.128 1.476 -2.705l6.95 -4.098zm1.585 13.586l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -8a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z"
			/></svg
		>
		<span>Achtung! Hitzewelle in {selectedStation.name}</span>
	</p>
	<h3 class="text-2xl max-w-xl mb-4 text-[#DB5537]">
		An den letzten {heatWaveLength} Tagen hatte es mindestens 30°C. Insgesamt gab es in diesem Jahr bereits
		{heatDaysThisYear}
		Hitzetage.
	</h3>
{:else if heatDaysThisYear > 5}
	<h3 class="text-2xl max-w-xl mb-4">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastHeatDay.date))} am {dayjs(lastHeatDay.date).format(
			'DD. MMMM'
		)}
		{formatNumber(lastHeatDay.tlmax)}°C gemessen, es war der {heatDaysThisYear}. Hitzetag dieses
		Jahr.
	</h3>
{:else if summerDaysThisYear > 5}
	<h3 class="text-2xl max-w-xl mb-4">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastSummerDay.date))} am {dayjs(
			lastSummerDay.date
		).format('DD. MMMM')}
		{formatNumber(lastHeatDay.tlmax)}°C gemessen, es war der {summerDaysThisYear}. Sommertag dieses
		Jahr.
	</h3>
{/if}

<p class="text-gray-700 mb-2 pb-2 border-b">
	Vergleiche das Jahr
	<input
		type="number"
		class="inline"
		bind:value={selectedYear}
		min={dayjs(data[0].date).year()}
		max={lastDate.year()}
	/>
	mit dem Zeitraum
	<input
		type="number"
		class="inline"
		bind:value={compareFirstYear}
		min={dayjs(data[0].date).year()}
		max={compareLastYear - 10}
	/>
	-
	<input
		type="number"
		class="inline"
		bind:value={compareLastYear}
		min={compareFirstYear + 10}
		max={lastDate.year()}
	/>
</p>

<div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
	{#each $types as type}
		<WeatherDaysCard
			{type}
			current={resultCurrent.find((d) => d.key == type.key).value}
			comparison={resultComparison.find((d) => d.key == type.key).value}
			{compareLastYear}
			{compareFirstYear}
			{selectedYear}
		/>
	{/each}
</div>

<p class="text-sm mt-2 text-gray-700 border-t pt-2">
	{selectedStation.name} (ID {selectedStation.id}); Daten von {dayjs(data[0].date).format(
		'DD.MM.YYYY'
	)} - {lastDate.format('DD.MM.YYYY')}
	{data.findIndex((d) => d.tlmax == null) > -1
		? ' mit Datenlücken, die in diesen Auswertungen automatisch übersprungen werden'
		: ''}
</p>

<div class="mt-8 grid md:grid-cols-2 gap-4">
	{#if heatDaysThisYear > 5}
		<div class="rounded border p-4">
			<h3 class="uppercase tracking-wide font-bold text-sm">
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
					class="inline -translate-y-0.5"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7"
					/><path
						d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3"
					/><path d="M9.7 17l4.6 0" /></svg
				>
				Wusstest du schon?
			</h3>
			<p class="text-lg">
				Hitze hat einen großen Einfluss auf die menschliche Gesundheit. XX und XX sind besonders
				gefährdet. Im Jahr 2023 wurden allein in Österreich 486 Todesfälle auf Hitze zurückgeführt,
				in ganz Europa sind es mehr als 47.000.
			</p>
			<p class="text-sm">Quellen:</p>
		</div>
		<div class="rounded border p-4">
			<h3 class="uppercase tracking-wide font-bold text-sm">
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
					class="inline -translate-y-0.5"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7"
					/><path
						d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3"
					/><path d="M9.7 17l4.6 0" /></svg
				>
				Was kann ich tun?
			</h3>
			<p class="text-lg">asdasd</p>
			<p class="text-sm">Quellen:</p>
		</div>
	{/if}
</div>
