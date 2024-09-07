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
	let firstDate = dayjs(data[0].date);
	let lastDate = dayjs(data[data.length - 1].date);

	let comparisonDurations = [
		[1961, 1990],
		[1971, 2000],
		[1981, 2010],
		[1991, 2020]
	].filter((duration) => {
		const [startYear, endYear] = duration;
		return startYear > firstDate.year() && endYear > firstDate.year();
	});
	let selectedComparisonDuration = comparisonDurations[0];

	$: compareFirstYear = selectedComparisonDuration[0];
	$: compareLastYear = selectedComparisonDuration[1];

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
	$: dataComparison = data
		.filter(
			(d) => dayjs(d.date).year() >= compareFirstYear && dayjs(d.date).year() <= compareLastYear
		)
		.filter((d) =>
			selectedYear == lastDate.year()
				? dayjs(d.date).year(lastDate.year()).isBefore(lastDate) ||
				  dayjs(d.date).year(lastDate.year()).isSame(lastDate)
				: true
		);

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
{:else if lastHeatDay && (dayjs(lastHeatDay.date).isAfter(dayjs(lastSummerDay.date)) || dayjs(lastHeatDay.date).isSame(dayjs(lastSummerDay.date)))}
	<h3 class="text-2xl max-w-xl mb-4">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastHeatDay.date))} am {dayjs(lastHeatDay.date).format(
			'D. MMMM'
		)}
		{formatNumber(lastHeatDay.tlmax)}°C gemessen, es war der {heatDaysThisYear}. Hitzetag dieses
		Jahr.
	</h3>
{:else if summerDaysThisYear > 5}
	<h3 class="text-2xl max-w-xl mb-4">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastSummerDay.date))} am {dayjs(
			lastSummerDay.date
		).format('D. MMMM')}
		{formatNumber(lastSummerDay.tlmax)}°C gemessen, es war der {summerDaysThisYear}. Sommertag
		dieses Jahr.
	</h3>
{/if}

{#if compareFirstYear && compareLastYear}
	<p class="text-gray-700 mb-2 pb-2 border-b">
		Vergleiche das Jahr
		<input
			type="number"
			class="inline k_input mx-1"
			bind:value={selectedYear}
			min={dayjs(data[0].date).year()}
			max={lastDate.year()}
			id="selectedYear"
		/>
		mit dem Zeitraum
		<select bind:value={selectedComparisonDuration} class="k_input mx-1">
			{#each comparisonDurations as duration}
				<option value={duration}>
					{duration[0]} - {duration[1]}
				</option>
			{/each}
		</select>
	</p>
{/if}

<div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
	{#each $types as type}
		<WeatherDaysCard
			{type}
			current={resultCurrent.find((d) => d.key == type.key).value}
			comparison={resultComparison.find((d) => d.key == type.key).value}
			{compareLastYear}
			{compareFirstYear}
			{selectedYear}
			currentDate={selectedYear == lastDate.year() ? lastDate : false}
		/>
	{/each}
</div>

<p class="text-sm mt-2 text-gray-700 border-t pt-2">
	{selectedStation.name} (ID {selectedStation.id}); Daten verfügbar von {dayjs(data[0].date).format(
		'DD.MM.YYYY'
	)} - {lastDate.format('DD.MM.YYYY')}
	{data.findIndex((d) => d.tlmax == null) > -1
		? ' mit Datenlücken, die in diesen Auswertungen automatisch übersprungen werden'
		: ''}
</p>

<div class="mt-8 grid md:grid-cols-2 gap-4">
	{#if heatDaysThisYear > 5}
		<div class="rounded border p-4">
			<p class="text-lg">
				Mehr Hitzetage durch den Klimawandel führen zu <b>gesundheitlichen Problemen</b> wie
				Hitzschlägen, Kreislaufbelastungen und einer Zunahme von Herz-Kreislauf-Erkrankungen,
				insbesondere bei gefährdeten Gruppen wie älteren Menschen und Kindern. Allein in Europa
				sterben jedes Jahr ca. 45.000 Menschen an extremer Hitze.
				<sup
					><a
						href="https://www.nature.com/articles/s41591-024-03186-1"
						class="text-gray-500 underline">Nature Medicine</a
					></sup
				>
			</p>
		</div>
		<div class="rounded border p-4">
			<p class="text-lg">
				Leichte Kleidung, ausreichende Flüssigkeitszufuhr und das Vermeiden von Anstrengung bei
				Hitze reduzieren die individuelle Hitzebelastung. Begrünung, mehr Schattenplätze und
				angepasste Gebäude mit besserer Dämmung und Lüftung mildern langfristig die Auswirkungen von
				Hitzewellen.
			</p>
		</div>
	{/if}
</div>
