<script>
	import Switch from '$lib/components/Switch.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import dayjs from 'dayjs';
	import 'dayjs/locale/de';
	import isBetween from 'dayjs/plugin/isBetween';
	dayjs.locale('de'); // Set the locale globally to German
	dayjs.extend(isBetween); // Extend Day.js with the isBetween plugin
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let selectedStation;

	let slices = [100, 500, 1000];
	let slice = 100;

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

	// Function to determine if a season is ongoing
	function isSeasonOngoing(seasonPeriod, currentDate) {
		const [seasonName, years] = seasonPeriod.split(' ');
		let startMonth, endMonth;
		let startYear, endYear;

		switch (seasonName) {
			case 'Winter':
				// Winter spans December to February
				if (years.includes('-')) {
					const [startYearStr, endYearStr] = years.split('-');
					startYear = parseInt(startYearStr);
					endYear = parseInt(endYearStr);
				} else {
					startYear = parseInt(years);
					endYear = startYear + 1;
				}
				startMonth = 11; // December
				endMonth = 1; // February
				break;
			case 'Frühling':
				// Spring spans March to May
				startYear = parseInt(years);
				endYear = startYear;
				startMonth = 2; // March
				endMonth = 4; // May
				break;
			case 'Sommer':
				// Summer spans June to August
				startYear = parseInt(years);
				endYear = startYear;
				startMonth = 5; // June
				endMonth = 7; // August
				break;
			case 'Herbst':
				// Autumn spans September to November
				startYear = parseInt(years);
				endYear = startYear;
				startMonth = 8; // September
				endMonth = 10; // November
				break;
			default:
				return false; // Unknown season
		}

		// Construct start and end dates for the season
		let seasonStartDate = dayjs().year(startYear).month(startMonth).startOf('month');

		let seasonEndDate = dayjs().year(endYear).month(endMonth).endOf('month');

		// Adjust for Winter spanning over years
		if (seasonName === 'Winter' && startMonth === 11 && endMonth === 1 && startYear !== endYear) {
			seasonEndDate = seasonEndDate.add(1, 'year');
		}

		// Check if current date is within the season period
		return currentDate.isBetween(seasonStartDate, seasonEndDate, null, '[]');
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
				key = 'Overall'; // Use a single key for all years
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
			recentPeriods = [...new Set(data.map((entry) => dayjs(entry.date).year()))];
		}

		// Limit to the most recent 100 periods
		recentPeriods = recentPeriods.slice(-slice);

		recentData = recentPeriods.map((period) => {
			const periodData = data.filter((entry) => {
				if (selectedResolution.key === 'months') {
					return dayjs(entry.date).format('MMMM YYYY') === period;
				} else if (selectedResolution.key === 'seasons') {
					return getSeason(entry.date) === period;
				} else if (selectedResolution.key === 'years') {
					return dayjs(entry.date).year() == period;
				}
			});

			const averageTemperature =
				periodData.reduce((sum, entry) => sum + entry.tl_mittel, 0) / (periodData.length || 1);

			const seasonType = selectedResolution.key !== 'years' ? period.split(' ')[0] : 'Overall';

			const historicalAverage = historicalAverageLookup[seasonType] || 0;
			const differenceFromHistorical = averageTemperature - historicalAverage;

			// Determine if the period is ongoing
			let isOngoing = false;
			const today = dayjs();

			if (selectedResolution.key === 'months') {
				// Period is in the format 'MMMM YYYY', e.g., 'September 2023' (in German)
				const periodDate = dayjs(period, 'MMMM YYYY', 'de');
				isOngoing = periodDate.isSame(today, 'month');
			} else if (selectedResolution.key === 'seasons') {
				isOngoing = isSeasonOngoing(period, today);
			} else if (selectedResolution.key === 'years') {
				isOngoing = period === today.year();
			}

			return {
				period,
				averageTemperature: parseFloat(averageTemperature.toFixed(2)),
				differenceFromHistorical: parseFloat(differenceFromHistorical.toFixed(2)),
				selectedResolution: selectedResolution.key,
				isOngoing // Add the new variable here
			};
		});
	};

	$: if (selectedResolution) {
		calculateAverages();
	}
</script>

<div class="mt-16">
	<p class="text-sm text-gray-700">
		<span>Zeige die letzten</span>
		<select bind:value={slice}>
			{#each slices as slice}
				<option value={slice}>{slice}</option>
			{/each}
		</select>
		<select bind:value={selectedResolution}>
			{#each availableResolutions as resolution}
				<option value={resolution}>{resolution.label}</option>
			{/each}
		</select>
		<span>im Vergleich zum Zeitraum</span>
		<select bind:value={selectedPeriod}>
			{#each availablePeriods as period}
				<option value={period}>{period.label}</option>
			{/each}
		</select>
	</p>

	<!-- Use the isOngoing variable in your ComparisonChart or other components as needed -->
	<ComparisonChart {historicalAverages} {recentData} />
</div>
