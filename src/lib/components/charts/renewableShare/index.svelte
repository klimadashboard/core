<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import ChartGrid from './ChartGrid.svelte';
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import dayjs from 'dayjs';
	import de from 'dayjs/locale/de-at';
	import isoWeek from 'dayjs/plugin/isoWeek';

	dayjs.extend(isoWeek);
	dayjs.locale('de');

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('at_energy_renewable_share_daily_average', {
				limit: -1
			})
		);
		return data;
	}

	$: promise = getData();

	let selectedPeriod = 'day';
	let intervals = [
		{
			key: 'day',
			interval: 30
		},
		{
			key: 'week',
			interval: 4
		},
		{
			key: 'month',
			interval: 1
		}
	];

	function groupByInterval(data, interval) {
		// Helper function to get the correct grouping key based on the interval
		const getGroupingKey = (date) => {
			const d = dayjs(date);
			switch (interval) {
				case 'day':
					return d.format('DD.MM.YY'); // Day format: 'YYYY-MM-DD'
				case 'week':
					// Get the ISO week year and week number
					const weekYear = d.isoWeekYear();
					const weekNumber = d.isoWeek(); // ISO week starts on Monday
					return `KW${String(weekNumber).padStart(2, '0')} ${weekYear}`; // Week format: 'YYYY-Www'
				case 'month':
					return d.format('MMM YYYY'); // Month format: 'YYYY-MM'
				default:
					throw new Error('Invalid interval. Use "day", "week", or "month".');
			}
		};

		// Use reduce to group data based on the specified interval
		const groupedData = data.reduce((acc, curr) => {
			const key = getGroupingKey(curr.date);
			if (!acc[key]) {
				acc[key] = { sum: 0, count: 0 };
			}
			acc[key].sum += curr.renewable_share;
			acc[key].count += 1;
			return acc;
		}, {});

		// Convert the result back to an array, calculating the average
		return Object.entries(groupedData).map(([key, { sum, count }]) => ({
			interval: key,
			value: sum / count
		}));
	}
</script>

{#await promise then data}
	<h2 class="text-2xl max-w-xl">
		In den letzten 365 Tagen wurden {Math.round(
			data.reduce((a, b) => a + b.renewable_share, 0) / data.length
		)}% des Stroms durch erneuerbare Quellen erzeugt.
	</h2>
	<div class="h-80 mt-4">
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
				bind:value={selectedPeriod}
				class="block appearance-none w-full bg-gray-200 border border-gray-100 px-4 py-3 pr-8 rounded leading-tight cursor-pointer focus:outline-none focus:bg-white focus:border-gray-500"
			>
				<option value="day">Tage</option>
				<option value="week">Wochen</option>
				<option value="month">Monate</option>
			</select>
		</div>
		<BarChart
			data={groupByInterval(data, selectedPeriod).map((entry, i) => {
				return {
					label: entry.interval,
					categories: [
						{
							label: 'Erneuerbarer Anteil ' + entry.interval + '&nbsp&nbsp|&nbsp&nbsp',
							value: entry.value,
							color: entry.value >= 100 ? '#3FB375' : '#347C86'
						}
					]
				};
			})}
			visualisation={'stacked'}
			xAxixInterval={intervals.find((d) => d.key == selectedPeriod).interval}
			unit="%"
			lines={[
				{
					value: 100,
					label: '100%',
					color: '3FB375'
				}
			]}
		/>
	</div>
{:catch error}
	{error}
{/await}
