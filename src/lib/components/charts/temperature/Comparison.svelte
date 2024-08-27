<script>
	import Switch from '$lib/components/Switch.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import dayjs from 'dayjs';

	export let data;
	export let selectedStation;

	const compareStartYear = Math.max(1961, dayjs(data[0].date).year());
	const compareEndYear = Math.min(dayjs().year() - 2, compareStartYear + 30);

	$: activeView = 'months';

	let historicalAverages = [];
	let recentData = [];

	function getSeason(date) {
		const parsedDate = dayjs(date);
		const month = parsedDate.month(); // month() returns 0 for January, 11 for December
		const year = parsedDate.year();

		if (month === 11) return `Winter ${year}-${year + 1}`; // December belongs to Winter crossing years
		if (month === 0 || month === 1) return `Winter ${year - 1}-${year}`; // Jan and Feb belong to Winter crossing years
		if (month >= 2 && month <= 4) return `Frühling ${year}`;
		if (month >= 5 && month <= 7) return `Sommer ${year}`;
		if (month >= 8 && month <= 10) return `Herbst ${year}`;
	}

	// New function to get the season name without year
	function getSeasonName(date) {
		const month = dayjs(date).month();

		if (month === 11 || month === 0 || month === 1) return 'Winter';
		if (month >= 2 && month <= 4) return 'Frühling';
		if (month >= 5 && month <= 7) return 'Sommer';
		if (month >= 8 && month <= 10) return 'Herbst';
	}

	$: calculateAverages = function () {
		// Filter the data to include only the historical range
		const filteredHistoricalData = data.filter((entry) => {
			const year = dayjs(entry.date).year();
			return year >= compareStartYear && year <= compareEndYear;
		});

		// Group data by the appropriate period, either months or seasons
		const historicalGroupedData = filteredHistoricalData.reduce((acc, entry) => {
			let key;
			if (activeView === 'months') {
				key = dayjs(entry.date).format('MMMM'); // Group by month name only (e.g., "January")
			} else if (activeView === 'seasons') {
				key = getSeasonName(entry.date); // Group by season name only (e.g., "Winter")
			}

			if (!acc[key]) acc[key] = { key, temperatures: [] };
			acc[key].temperatures.push(entry.tl_mittel);
			return acc;
		}, {});

		// Calculate historical averages for both months and seasons
		historicalAverages = Object.values(historicalGroupedData).map((group) => {
			const averageTemperature =
				group.temperatures.reduce((sum, temp) => sum + temp, 0) / group.temperatures.length;
			return {
				period: group.key,
				averageTemperature: parseFloat(averageTemperature.toFixed(2))
			};
		});

		// Create a dictionary for easy lookup of historical averages by season or month name
		const historicalAverageLookup = historicalAverages.reduce((acc, entry) => {
			acc[entry.period] = entry.averageTemperature;
			return acc;
		}, {});

		const currentDate = dayjs();

		let recentPeriods;
		if (activeView === 'months') {
			recentPeriods = Array.from({ length: 13 }, (_, i) =>
				currentDate.subtract(i, 'month').format('MMMM YYYY')
			).reverse();
		} else if (activeView === 'seasons') {
			recentPeriods = Array.from({ length: 5 }, (_, i) =>
				getSeason(currentDate.subtract(i * 3, 'month'))
			).reverse();
		}

		recentData = recentPeriods.map((period) => {
			const periodData = data.filter((entry) => {
				if (activeView === 'months') {
					return dayjs(entry.date).format('MMMM YYYY') === period;
				} else if (activeView === 'seasons') {
					return getSeason(entry.date) === period;
				}
			});

			const averageTemperature =
				periodData.reduce((sum, entry) => sum + entry.tl_mittel, 0) / (periodData.length || 1); // Avoid division by zero

			// Determine if this period is ongoing
			let isOngoing = false;
			if (activeView === 'months') {
				isOngoing = period === currentDate.format('MMMM YYYY');
			} else if (activeView === 'seasons') {
				isOngoing = period === getSeason(currentDate);
			}

			// Calculate the difference from the historical average for this specific season name
			const seasonType = period.split(' ')[0]; // Get the season name without year (e.g., "Winter")
			const historicalAverage = historicalAverageLookup[seasonType] || 0;
			const differenceFromHistorical = averageTemperature - historicalAverage;

			return {
				period,
				averageTemperature: parseFloat(averageTemperature.toFixed(2)),
				ongoing: isOngoing,
				differenceFromHistorical: parseFloat(differenceFromHistorical.toFixed(2)) // Add the difference here
			};
		});
	};

	$: if (activeView) {
		calculateAverages();
	}

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

	$: overAveragePeriods = recentData.filter(
		(d) => !d.ongoing && d.differenceFromHistorical > 0
	).length;
</script>

<div class="mt-16">
	<div class="flex items-center gap-2">
		<Switch
			{views}
			{activeView}
			on:itemClick={(event) => {
				activeView = event.detail;
			}}
		/>
		<p class="text-sm text-gray-600">
			im Vergleich zum Schnitt {compareStartYear} - {compareEndYear}
		</p>
	</div>

	<h2 class="text-2xl max-w-xl mt-4">
		{#if activeView == 'months'}
			Von den letzten 12 Monaten waren {overAveragePeriods} Monate bei der Wetterstation {selectedStation.name}
			überdurchschnittlich warm.
		{:else}
			Von den letzten 4 Jahreszeiten waren {overAveragePeriods} Jahreszeiten bei der Wetterstation {selectedStation.name}
			überdurchschnittlich warm.
		{/if}
	</h2>

	<ComparisonChart {historicalAverages} {recentData} />
</div>
