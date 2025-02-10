<script>
	import WeatherDaysCard from './WeatherDaysCard.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { types } from '$lib/stores/weather';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import 'dayjs/locale/de';
	import { PUBLIC_VERSION } from '$env/static/public';

	dayjs.extend(relativeTime);
	dayjs.locale('de');

	export let data;
	export let selectedStation;

	$: selectedYear = dayjs().month() > 4 ? dayjs().year() : dayjs().year() - 1;
	$: daysAvailableInSelectedYear = data.filter((d) => dayjs(d.date).year() == selectedYear).length;
	let firstDate = dayjs(data[0].date);
	let lastDate = dayjs(data[data.length - 1].date);

	let comparisonDurations = [
		[1961, 1990],
		[1971, 2000],
		[1981, 2010],
		[1991, 2020]
	].filter((duration) => {
		const [startYear, endYear] = duration;
		return dayjs('' + startYear + '-01-01') >= dayjs(firstDate) && endYear > firstDate.year();
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
		} else if (key == 'snowCoverDay') {
			return d.sh > 0;
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
	$: lastFrostDay = [...data].reverse().find((d) => isDay('frostDay', d));
	$: frostDaysThisYear = [...data]
		.filter((d) => new Date(d.date).getFullYear() == new Date().getFullYear())
		.filter((d) => isDay('frostDay', d)).length;

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

	$: regionString = PUBLIC_VERSION == 'at' ? 'Österreich' : 'Deutschland';
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
	<h3 class="title text-[#DB5537]">
		An den letzten {heatWaveLength} Tagen hatte es mindestens 30°C. Insgesamt gab es in diesem Jahr bereits
		{heatDaysThisYear}
		Hitzetage.
	</h3>
{:else if lastHeatDay && dayjs().diff(dayjs(lastHeatDay.date), 'day') < 10 && (dayjs(lastHeatDay.date).isAfter(dayjs(lastSummerDay.date)) || dayjs(lastHeatDay.date).isSame(dayjs(lastSummerDay.date)))}
	<h3 class="title">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastHeatDay.date))} am {dayjs(lastHeatDay.date).format(
			'D. MMMM'
		)} mit
		{formatNumber(lastHeatDay.tlmax)}°C ein Hitzetag gemessen, es war der {heatDaysThisYear}. dieses
		Jahr.
	</h3>
{:else if summerDaysThisYear > 5 && dayjs().diff(dayjs(lastSummerDay.date), 'day') < 10}
	<h3 class="title">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastSummerDay.date))} am {dayjs(
			lastSummerDay.date
		).format('D. MMMM')} mit
		{formatNumber(lastSummerDay.tlmax)}°C ein Sommertag gemessen, es war der {summerDaysThisYear}.
		dieses Jahr.
	</h3>
{:else if dayjs().diff(dayjs(lastFrostDay.date), 'day') < 10}
	<h3 class="title">
		Zuletzt wurde {dayjs().hour(0).to(dayjs(lastFrostDay.date))} am {dayjs(
			lastFrostDay.date
		).format('D. MMMM')} mit
		{formatNumber(lastFrostDay.tlmin)}°C Mindesttemperatur ein Frosttag gemessen, es war der {frostDaysThisYear}.
		dieses Jahr.
	</h3>
{:else}
	<h3 class="title">
		Die Erderhitzung führt auch in {regionString} zu mehr heißen Tagen und weniger Tagen mit Frost.
	</h3>
{/if}

{#if compareFirstYear && compareLastYear}
	<p class="mb-4 mx-auto w-max max-w-full text-center">
		Wähle ein Jahr und einen Referenzzeitraum:
		<input
			type="number"
			class="inline k_input mx-1"
			bind:value={selectedYear}
			min={dayjs(data[0].date).year()}
			max={lastDate.year()}
			id="selectedYear"
		/>
		vs.
		<select bind:value={selectedComparisonDuration} class="k_input k_dropdown mx-1 appearance-none">
			{#each comparisonDurations as duration}
				<option value={duration}>
					{duration[0]} - {duration[1]}
				</option>
			{/each}
		</select>
	</p>
{/if}

{#if selectedYear == dayjs().year() || daysAvailableInSelectedYear > 360}
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
{:else}
	<p>
		Keine ausreichenden Temperaturdaten für dieses Jahr verfügbar. Wähle eine andere Wetterstation
		oder ein anderes Jahr.
	</p>
{/if}

<p class="text-sm mt-2 border-t pt-2">
	{selectedStation.name} (ID {selectedStation.id}); Daten von
	{#if PUBLIC_VERSION == 'at'}
		<a href="https://www.geosphere.at" class="underline underline-offset-2">Geosphere</a>
	{:else}
		<a
			href="https://www.dwd.de/DE/klimaumwelt/cdc/cdc_node.html"
			class="underline underline-offset-2">DWD</a
		>
	{/if}
	verfügbar von {dayjs(data[0].date).format('DD.MM.YYYY')} - {lastDate.format('DD.MM.YYYY')}
	{data.findIndex((d) => d.tlmax == null) > -1
		? ' mit Datenlücken, die in diesen Auswertungen automatisch übersprungen werden'
		: ''}
</p>

<p class="text-lg max-w-3xl mx-auto mt-8">
	Die Erderhitzung ist auch in {regionString} spürbar. Im Durchschnitt nimmt die Anzahl der Sommer-,
	Hitze- und Wüstentage sowie der Tropennächte zu. Dieser Trend ist im Vergleich mit allen Referenzperioden
	zu beobachten. Häufigere und länger anhaltende Hitzeperioden können zu gesundheitlichen Problemen wie
	unter anderem Hitzschlägen, Erschöpfung und einer Zunahme von Herz-Kreislauf- und Nierenerkrankungen
	führen. Insbesondere ältere Menschen, Schwangere und Kinder, aber auch Menschen mit Vorerkrankungen
	gehören zu den am stärksten gefährdeten Gruppen. Allein in Europa starben im Jahr 2023 etwa 45.000
	Menschen an extremer Hitze (Nature Medicine, 2024). Luftige Bekleidung, ausreichende Flüssigkeitszufuhr
	und das Vermeiden von Anstrengung bei Hitze reduzieren die individuelle Hitzebelastung. Begrünung,
	mehr Schattenplätze und angepasste Gebäude mit besserer Dämmung und Lüftung mildern langfristig die
	Auswirkungen von Hitzewellen.
</p>

<p class="text-lg max-w-3xl mx-auto mt-4">
	Gleichzeitig gibt es im Durchschnitt auch weniger Tage mit Temperaturen unter dem Gefrierpunkt.
	Die Frost- und Eistage nehmen also im Vergleich mit allen Referenzperioden ab. Dies hat unter
	anderem Auswirkungen auf die Anzahl der Schneetage, Gletscher, die Landwirtschaft und die
	Wasserversorgung.
</p>

<style>
	@reference "tailwindcss/theme";
	.title {
		@apply text-2xl mb-4 text-center max-w-2xl mx-auto text-balance;
	}
</style>
