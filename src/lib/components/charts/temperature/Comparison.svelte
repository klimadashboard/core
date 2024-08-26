<script>
	import Switch from '$lib/components/Switch.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import dayjs from 'dayjs';

	export let data;
	export let selectedStation;

	const compareStartYear = Math.max(1961, dayjs(data[0].date).year());
	const compareEndYear = Math.max(dayjs().year() - 2, compareStartYear + 30);

	$: activeView = 'months';

	let historicalAverages = [];
	let recentData = [];

	// Function to determine the season based on the month and handle winter across years
	function getSeason(date) {
		const parsedDate = dayjs(date);
		const month = parsedDate.month(); // month() returns 0 for January, 11 for December
		const year = parsedDate.year();

		if (month === 11) return `Winter`; // December is Winter
		if (month === 0 || month === 1) return `Winter`; // Jan and Feb are Winter
		if (month >= 2 && month <= 4) return `Spring`;
		if (month >= 5 && month <= 7) return `Summer`;
		if (month >= 8 && month <= 10) return `Fall`;
	}

	// Function to calculate both historical averages and recent data
	$: calculateAverages = function () {
		// Filter data for the comparison period (historical averages)
		const filteredHistoricalData = data.filter((entry) => {
			const year = dayjs(entry.date).year();
			return year >= compareStartYear && year <= compareEndYear;
		});

		// Group data either by month or by season
		const historicalGroupedData = filteredHistoricalData.reduce((acc, entry) => {
			let key;
			if (activeView === 'months') {
				key = dayjs(entry.date).format('MMMM'); // Group by month name (e.g., "January")
			} else if (activeView === 'seasons') {
				key = getSeason(entry.date); // Group by season (e.g., "Winter")
			}

			if (!acc[key]) acc[key] = { key, temperatures: [] };
			acc[key].temperatures.push(entry.tl_mittel);
			return acc;
		}, {});

		historicalAverages = Object.values(historicalGroupedData).map((group) => {
			const averageTemperature =
				group.temperatures.reduce((sum, temp) => sum + temp, 0) / group.temperatures.length;
			return {
				period: group.key,
				averageTemperature: parseFloat(averageTemperature.toFixed(2))
			};
		});

		// Calculate recent data (last 12 months or last 4 seasons)
		const currentDate = dayjs();

		let recentPeriods;
		if (activeView === 'months') {
			recentPeriods = Array.from({ length: 12 }, (_, i) =>
				currentDate.subtract(i, 'month').format('YYYY-MM')
			).reverse();
		} else if (activeView === 'seasons') {
			recentPeriods = Array.from({ length: 4 }, (_, i) =>
				getSeason(currentDate.subtract(i * 3, 'month'))
			).reverse();
		}

		recentData = recentPeriods.map((period) => {
			const periodData = data.filter((entry) => {
				if (activeView === 'months') {
					return dayjs(entry.date).format('YYYY-MM') === period;
				} else if (activeView === 'seasons') {
					return getSeason(entry.date) === period;
				}
			});

			const averageTemperature =
				periodData.reduce((sum, entry) => sum + entry.tl_mittel, 0) / (periodData.length || 1); // Avoid division by zero

			return {
				period,
				averageTemperature: parseFloat(averageTemperature.toFixed(2))
			};
		});
	};

	// Reactively calculate averages when relevant variables change
	$: if (activeView) {
		calculateAverages();
	}

	$: console.log(activeView);

	$: console.log(historicalAverages);
	$: console.log(recentData);

	const views = [
		{
			key: 'months',
			label: 'Monate'
		},
		{
			key: 'seasons',
			label: 'Jahreszeiten'
		}
	];
</script>

<div class="mt-16">
	<Switch
		{views}
		{activeView}
		on:itemClick={(event) => {
			activeView = event.detail;
		}}
	/>

	<h2 class="text-2xl max-w-lg mt-4">
		{#if activeView == 'months'}
			Von den letzten 12 Monaten waren X Monate überdurchschnittlich warm.
		{:else}
			Von den letzten 4 Jahreszeiten waren X überdurchschnittlich warm.
		{/if}
	</h2>

	<ComparisonChart {historicalAverages} {recentData} />
</div>
