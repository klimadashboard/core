<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import dayjs from 'dayjs';
	import de from 'dayjs/locale/de-at';
	import isoWeek from 'dayjs/plugin/isoWeek';
	import { PUBLIC_VERSION } from '$env/static/public';

	dayjs.extend(isoWeek);
	dayjs.locale('de');

	let selectedCategory = 'day';

	$: startDate = selectedCategory == 'year' ? '2020-01-01' : '2024-01-01';

	async function getData(category) {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('energy_renewable_share', {
				filter: {
					_and: [
						{
							category: { _eq: category }
						},
						{
							country: { _eq: PUBLIC_VERSION.toUpperCase() }
						},
						{
							period: { _gte: startDate }
						}
					]
				},
				sort: ['-period'],
				limit: -1
			})
		);
		const sortedData = data.sort((a, b) => new Date(a.period) > new Date(b.period));
		return sortedData;
	}

	async function getYearlyData() {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('energy_renewable_share', {
				filter: {
					_and: [
						{
							category: { _eq: 'day' }
						},
						{
							country: { _eq: PUBLIC_VERSION.toUpperCase() }
						},
						{
							period: { _gte: dayjs().subtract(1, 'year').format('YYYY-MM-DD') }
						}
					]
				},
				sort: ['-period'],
				limit: -1
			})
		);
		return data;
	}

	$: promise = getData(selectedCategory);
	$: yearlyPromise = getYearlyData();

	let chartWidth;

	function filterLastPeriodValues(data, category) {
		const today = dayjs();
		if (category === 'year') {
			return data.filter((d, i, arr) => {
				const currentYear = dayjs(d.period).year();
				return (
					(i === 0 || currentYear !== dayjs(arr[i - 1].period).year()) && currentYear < today.year()
				);
			});
		} else if (category === 'month') {
			return data.filter((d, i, arr) => {
				const currentMonth = dayjs(d.period).format('YYYY-MM');
				return (
					(i === 0 || currentMonth !== dayjs(arr[i - 1].period).format('YYYY-MM')) &&
					dayjs(d.period).isBefore(today.startOf('month'))
				);
			});
		}
		return data;
	}

	function getLabel(period) {
		if (selectedCategory === 'day') {
			return dayjs(period).format('DD.MM.YYYY');
		} else if (selectedCategory === 'month') {
			return dayjs(period).format('MM.YYYY');
		} else if (selectedCategory === 'year') {
			return dayjs(period).format('YYYY');
		}
	}
</script>

<div class="relative text-gray-600 w-40 mb-4">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="absolute pointer-events-none top-4 h-5 right-2 transform -translate-y-0.5 icon-tabler-selector"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		stroke-width="2"
		stroke="currentColor"
		fill="none"
		stroke-linecap="round"
		stroke-linejoin="round"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline
			points="8 9 12 5 16 9"
		/><polyline points="16 15 12 19 8 15" /></svg
	>
	<select
		bind:value={selectedCategory}
		class="block appearance-none w-full bg-gray-200 border border-gray-100 px-4 py-3 pr-8 rounded leading-tight cursor-pointer focus:outline-none focus:bg-white focus:border-gray-500"
	>
		<option value="day">Tage</option>
		<option value="month">Monate</option>
		<option value="year">Jahr</option>
	</select>
</div>

{#await Promise.all([promise, yearlyPromise]) then [data, yearlyData]}
	<h2 class="text-2xl max-w-2xl">
		An <span class="underline underline-offset-2 decoration-green-500"
			>{yearlyData.filter((d) => d.value >= 100).length} Tagen</span
		> im letzten Jahr wurde der gesamte Strombedarf komplett aus erneuerbaren Energien gedeckt.
	</h2>
	<p class="max-w-lg text-lg text-balance leading-snug mt-1">
		Bilanziell wurde die Netzlast in den letzten 365 Tagen zu <span
			class="underline underline-offset-2 decoration-green-500"
			>{Math.round(yearlyData.reduce((sum, d) => sum + d.value, 0) / yearlyData.length)}%</span
		> von Erneuerbaren Energien abgedeckt.
	</p>

	<div class="mt-4">
		<div bind:clientWidth={chartWidth} class="h-80">
			<BarChart
				data={filterLastPeriodValues(data, selectedCategory).map((entry) => ({
					label: getLabel(entry.period),
					categories: [
						{
							label: `Erneuerbarer Anteil ` + getLabel(entry.period),
							value: entry.value,
							color: entry.value >= 100 ? '#3FB375' : '#c1c1c1'
						}
					]
				}))}
				visualisation={'stacked'}
				xAxixInterval={selectedCategory === 'day' ? 30 : 1}
				unit="%"
				lines={[{ value: 100, label: '100%', color: '3FB375' }]}
			/>
		</div>
	</div>
{:catch error}
	{error}
{/await}
