<script>
	import Switch from '$lib/components/Switch.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let selectedStation;

	const availableResolutions = [
		{ key: 'months', label: 'Monate' },
		{ key: 'seasons', label: 'Jahreszeiten' },
		{ key: 'years', label: 'Jahre' }
	];

	let selectedResolution = availableResolutions[0];

	const availablePeriods = [
		{ label: '1961-1990', start: 1961, end: 1990 },
		{ label: '1981-2010', start: 1981, end: 2010 },
		{ label: '1991-2020', start: 1991, end: 2020 }
	];

	let selectedPeriod = availablePeriods[0]; // Default to the first period

	// Dynamically set comparison start and end year based on user selection
	$: compareStartYear = selectedPeriod.start;
	$: compareEndYear = selectedPeriod.end;

	let historicalAverages = [];
	let recentData = [];
	let lastDatapoint;

	// Function to get season name for grouping
	function getSeason(date) {
		const parsedDate = dayjs(date);
		const month = parsedDate.month();
		const year = parsedDate.year();

		if (month === 11) return `Winter ${year}-${year + 1}`;
		if (month === 0 || month === 1) return `Winter ${year - 1}-${year}`;
		if (month >= 2 && month <= 4) return `Frühling ${year}`;
		if (month >= 5 && month <= 7) return `Sommer ${year}`;
		if (month >= 8 && month <= 10) return `Herbst ${year}`;
	}

	function getSeasonName(date) {
		const month = dayjs(date).month();

		if (month === 11 || month === 0 || month === 1) return 'Winter';
		if (month >= 2 && month <= 4) return 'Frühling';
		if (month >= 5 && month <= 7) return 'Sommer';
		if (month >= 8 && month <= 10) return 'Herbst';
	}

	// Function to calculate historical averages and recent data
	$: calculateAverages = function () {
		const filteredHistoricalData = data.filter((entry) => {
			const year = dayjs(entry.date).year();
			return year >= compareStartYear && year <= compareEndYear;
		});

		const historicalGroupedData = filteredHistoricalData.reduce((acc, entry) => {
			let key;
			if (selectedResolution.key === 'months') {
				key = dayjs(entry.date).format('MMMM'); // Group by month
			} else if (selectedResolution.key === 'seasons') {
				key = getSeasonName(entry.date); // Group by season
			} else if (selectedResolution.key === 'years') {
				key = dayjs(entry.date).year().toString(); // Group by year (converted to string for consistency)
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

		const historicalAverageLookup = historicalAverages.reduce((acc, entry) => {
			acc[entry.period] = entry.averageTemperature;
			return acc;
		}, {});

		let recentPeriods;
		if (selectedResolution.key === 'months') {
			recentPeriods = [...new Set(data.map((entry) => dayjs(entry.date).format('MMMM YYYY')))];
		} else if (selectedResolution.key === 'seasons') {
			recentPeriods = [...new Set(data.map((entry) => getSeason(entry.date)))];
		} else if (selectedResolution.key === 'years') {
			recentPeriods = [...new Set(data.map((entry) => dayjs(entry.date).year()))]; // No need to convert year to string here
		}

		// Limit to the most recent 100 periods
		recentPeriods = recentPeriods.slice(-100);

		recentData = recentPeriods.map((period) => {
			const periodData = data.filter((entry) => {
				if (selectedResolution.key === 'months') {
					return dayjs(entry.date).format('MMMM YYYY') === period;
				} else if (selectedResolution.key === 'seasons') {
					return getSeason(entry.date) === period;
				} else if (selectedResolution.key === 'years') {
					return dayjs(entry.date).year() == period; // No string comparison, use equality
				}
			});

			const averageTemperature =
				periodData.reduce((sum, entry) => sum + entry.tl_mittel, 0) / (periodData.length || 1);

			// Only split if it's months or seasons, not years
			const seasonType = selectedResolution.key !== 'years' ? period.split(' ')[0] : period;
			const historicalAverage = historicalAverageLookup[seasonType] || 0;
			const differenceFromHistorical = averageTemperature - historicalAverage;

			return {
				period,
				averageTemperature: parseFloat(averageTemperature.toFixed(2)),
				differenceFromHistorical: parseFloat(differenceFromHistorical.toFixed(2))
			};
		});

		// Set the last datapoint
		lastDatapoint = recentData[recentData.length - 1];
	};

	$: if (selectedResolution) {
		calculateAverages();
	}
</script>

<div class="mt-16">
	<div class="flex items-center gap-2">
		<select bind:value={selectedResolution}>
			{#each availableResolutions as resolution}
				<option value={resolution}>{resolution.label}</option>
			{/each}
		</select>
		<select bind:value={selectedPeriod}>
			{#each availablePeriods as period}
				<option value={period}>{period.label}</option>
			{/each}
		</select>
	</div>

	<!-- Display the last datapoint value -->
	<h2 class="text-2xl max-w-xl mt-4">
		{#if lastDatapoint}
			Im {lastDatapoint.period} war es {formatNumber(lastDatapoint.differenceFromHistorical)}°C {lastDatapoint.differenceFromHistorical >
			0
				? 'heißer'
				: 'kälter'} als der historische Durchschnitt.
		{/if}
	</h2>

	<ComparisonChart {historicalAverages} {recentData} />
</div>
