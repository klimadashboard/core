<script>
	import Loader from '$lib/components/Loader.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import dayjs from 'dayjs';
	import 'dayjs/locale/de';
	import isBetween from 'dayjs/plugin/isBetween';
	import { construct_svelte_component } from 'svelte/internal';

	dayjs.locale('de'); // Set the locale globally to German
	dayjs.extend(isBetween); // Extend Day.js with the isBetween plugin

	export let data;
	export let selectedStation;

	let slices = [100, 500, 1000];
	let slice = 100;

	const availableResolutions = [
		{ key: 'months', label: 'Monate' },
		{ key: 'seasons', label: 'Jahreszeiten' },
		{ key: 'years', label: 'Jahre' }
	];

	const availablePeriods = [
		{ label: '1961-1990', start: 1961, end: 1990 },
		{ label: '1981-2010', start: 1981, end: 2010 },
		{ label: '1991-2020', start: 1991, end: 2020 }
	];

	let selectedResolutionKey = availableResolutions[0].key;
	let selectedPeriodLabel = availablePeriods[0].label;

	// Derive the selectedResolution and selectedPeriod objects
	$: selectedResolution = availableResolutions.find((res) => res.key === selectedResolutionKey);
	$: selectedPeriod = availablePeriods.find((period) => period.label === selectedPeriodLabel);

	// Dynamically set comparison start and end year based on user selection
	$: compareStartYear = selectedPeriod.start;
	$: compareEndYear = selectedPeriod.end;

	// Map seasons to numeric codes
	const seasonCodes = {
		Winter: 0,
		Frühling: 1,
		Sommer: 2,
		Herbst: 3
	};

	// Function to get season code for grouping
	function getSeasonCode(date) {
		const month = dayjs(date).month();

		if (month === 11 || month === 0 || month === 1) return seasonCodes['Winter'];
		if (month >= 2 && month <= 4) return seasonCodes['Frühling'];
		if (month >= 5 && month <= 7) return seasonCodes['Sommer'];
		if (month >= 8 && month <= 10) return seasonCodes['Herbst'];
	}

	// Function to get season name for display
	function getSeasonName(date) {
		const month = dayjs(date).month();

		if (month === 11 || month === 0 || month === 1) return 'Winter';
		if (month >= 2 && month <= 4) return 'Frühling';
		if (month >= 5 && month <= 7) return 'Sommer';
		if (month >= 8 && month <= 10) return 'Herbst';
	}

	// Function to determine if a season is ongoing
	function isSeasonOngoing(seasonPeriod, currentDate) {
		const [seasonCodeStr, yearStr] = seasonPeriod.split('-');
		const seasonCode = parseInt(seasonCodeStr);
		let year = parseInt(yearStr);

		let startMonth, endMonth;
		let endYear = year; // Default end year is the same as start year

		if (seasonCode === seasonCodes['Winter']) {
			startMonth = 11; // December
			endMonth = 1; // February
			endYear = year + 1; // Winter ends in the next year
		} else if (seasonCode === seasonCodes['Frühling']) {
			startMonth = 2; // March
			endMonth = 4; // May
		} else if (seasonCode === seasonCodes['Sommer']) {
			startMonth = 5; // June
			endMonth = 7; // August
		} else if (seasonCode === seasonCodes['Herbst']) {
			startMonth = 8; // September
			endMonth = 10; // November
		}

		const seasonStartDate = dayjs().year(year).month(startMonth).startOf('month');
		const seasonEndDate = dayjs().year(endYear).month(endMonth).endOf('month');

		return currentDate.isBetween(seasonStartDate, seasonEndDate, null, '[]');
	}

	async function calculateAverages() {
		await new Promise((resolve) => setTimeout(resolve, 0));

		let historicalAverages = [];
		let recentData = [];

		// Filter historical data based on the selected period
		const filteredHistoricalData = data.filter((entry) => {
			const parsedDate = dayjs(entry.date); // Adjust the format as needed
			const year = parsedDate.year();
			return year >= compareStartYear && year <= compareEndYear;
		});

		// Group historical data
		const historicalGroupedData = filteredHistoricalData.reduce((acc, entry) => {
			let key;
			if (selectedResolution.key === 'months') {
				key = String(dayjs(entry.date).month()); // month number as string '0'-'11'
			} else if (selectedResolution.key === 'seasons') {
				key = String(getSeasonCode(entry.date)); // season code as string '0'-'3'
			} else if (selectedResolution.key === 'years') {
				key = 'Overall'; // Use a single key for all years
			}

			if (!acc[key]) acc[key] = { key, temperatures: [] };
			acc[key].temperatures.push(parseFloat(entry.tl_mittel));
			return acc;
		}, {});

		// Calculate historical averages
		historicalAverages = Object.values(historicalGroupedData).map((group) => {
			const averageTemperature =
				group.temperatures.reduce((sum, temp) => sum + temp, 0) / group.temperatures.length;
			return {
				period: group.key,
				averageTemperature: parseFloat(averageTemperature.toFixed(2))
			};
		});

		// Create a lookup for historical averages
		const historicalAverageLookup = historicalAverages.reduce((acc, entry) => {
			acc[entry.period] = entry.averageTemperature;
			return acc;
		}, {});

		// Determine recent periods
		let recentPeriods;
		if (selectedResolution.key === 'months') {
			recentPeriods = [...new Set(data.map((entry) => dayjs(entry.date).format('YYYY-MM')))];
		} else if (selectedResolution.key === 'seasons') {
			recentPeriods = [
				...new Set(
					data.map((entry) => {
						const seasonCode = getSeasonCode(entry.date);
						const year = dayjs(entry.date).year();
						return `${seasonCode}-${year}`;
					})
				)
			];
		} else if (selectedResolution.key === 'years') {
			recentPeriods = [...new Set(data.map((entry) => dayjs(entry.date).year().toString()))];
		}

		// Sort recentPeriods in chronological order
		recentPeriods.sort((a, b) => {
			if (selectedResolution.key === 'months') {
				return dayjs(a, 'YYYY-MM').valueOf() - dayjs(b, 'YYYY-MM').valueOf();
			} else if (selectedResolution.key === 'seasons') {
				const [seasonCodeA, yearA] = a.split('-').map(Number);
				const [seasonCodeB, yearB] = b.split('-').map(Number);
				return (
					new Date(yearA, seasonCodeA * 3).valueOf() - new Date(yearB, seasonCodeB * 3).valueOf()
				);
			} else if (selectedResolution.key === 'years') {
				return parseInt(a) - parseInt(b);
			}
		});

		// Limit to the most recent 'slice' periods
		recentPeriods = recentPeriods.slice(-slice);

		// Calculate recent data
		recentData = recentPeriods.map((period) => {
			let periodData;
			let seasonType;
			let isOngoing = false;
			const today = dayjs();

			if (selectedResolution.key === 'months') {
				periodData = data.filter((entry) => dayjs(entry.date).format('YYYY-MM') === period);
				const periodDate = dayjs(period, 'YYYY-MM');
				seasonType = String(periodDate.month()); // Ensure it's a string
				isOngoing = periodDate.isSame(today, 'month');
				period = periodDate.format('MMMM YYYY'); // For display purposes
			} else if (selectedResolution.key === 'seasons') {
				const [seasonCodeStr, yearStr] = period.split('-');
				const seasonCode = parseInt(seasonCodeStr);
				const year = parseInt(yearStr);
				periodData = data.filter((entry) => {
					return getSeasonCode(entry.date) === seasonCode && dayjs(entry.date).year() === year;
				});
				seasonType = String(seasonCode);
				// Determine if the season is ongoing
				const seasonPeriod = `${seasonCode}-${year}`;
				isOngoing = isSeasonOngoing(seasonPeriod, today);
				// For display purposes
				const seasonName = Object.keys(seasonCodes).find((key) => seasonCodes[key] === seasonCode);
				period = `${seasonName} ${year}`;
			} else if (selectedResolution.key === 'years') {
				const year = parseInt(period);
				periodData = data.filter((entry) => dayjs(entry.date).year() === year);
				seasonType = 'Overall';
				isOngoing = year === today.year();
			}

			const averageTemperature =
				periodData.reduce((sum, entry) => sum + parseFloat(entry.tl_mittel), 0) /
				(periodData.length || 1);

			const historicalAverage = historicalAverageLookup[seasonType] || 0;

			const differenceFromHistorical = averageTemperature - historicalAverage;

			return {
				period,
				averageTemperature: parseFloat(averageTemperature.toFixed(2)),
				differenceFromHistorical: parseFloat(differenceFromHistorical.toFixed(2)),
				selectedResolution: selectedResolution.key,
				isOngoing
			};
		});

		if (selectedResolutionKey == 'years' || selectedResolutionKey == 'seasons') {
			// do not include ongoing years & seasons
			recentData = recentData.filter((d) => !d.isOngoing);
		}
		return { historicalAverages, recentData };
	}

	// Reactive variable to hold the promise
	let averagesPromise;

	$: if (selectedPeriod && selectedResolution && slice) {
		averagesPromise = calculateAverages();
	}
</script>

<div class="mt-16">
	<p class="text-sm text-gray-700">
		<span>Zeige die letzten</span>
		<select bind:value={slice}>
			{#each slices as s}
				<option value={s}>{s}</option>
			{/each}
		</select>
		<select bind:value={selectedResolutionKey}>
			{#each availableResolutions as resolution}
				<option value={resolution.key}>{resolution.label}</option>
			{/each}
		</select>
		<span>im Vergleich zur Periode</span>
		<select bind:value={selectedPeriodLabel}>
			{#each availablePeriods as period}
				<option value={period.label}>{period.label}</option>
			{/each}
		</select>
	</p>

	{#await averagesPromise}
		<Loader />
	{:then averages}
		<ComparisonChart
			historicalAverages={averages.historicalAverages}
			recentData={averages.recentData}
			{selectedStation}
		/>
	{/await}
</div>
