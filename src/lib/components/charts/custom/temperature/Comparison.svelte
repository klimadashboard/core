<script>
	import Loader from '$lib/components/Loader.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import dayjs from 'dayjs';
	import 'dayjs/locale/de';
	import isBetween from 'dayjs/plugin/isBetween';
	import isLeapYear from 'dayjs/plugin/isLeapYear';
	import { PUBLIC_VERSION } from '$env/static/public';

	dayjs.locale('de'); // Set the locale globally to German
	dayjs.extend(isBetween); // Extend Day.js with the isBetween plugin
	dayjs.extend(isLeapYear);

	export let data;
	export let selectedStation;

	let slices = [200, 400, 600];
	let slice = slices[0];

	const availableResolutions = [
		{ key: 'months', label: 'Monate' },
		{ key: 'seasons', label: 'Jahreszeiten' },
		{ key: 'years', label: 'Jahre' }
	];

	let firstDate = dayjs(data[0].date);
	let availablePeriods = [
		{ label: '1961-1990', start: 1961, end: 1990 },
		{ label: '1971-2000', start: 1971, end: 2000 },
		{ label: '1981-2010', start: 1981, end: 2010 },
		{ label: '1991-2020', start: 1991, end: 2020 }
	].filter((duration) => {
		return (
			dayjs('' + duration.start + '-01-01') >= dayjs(firstDate) && duration.end > firstDate.year()
		);
	});

	let selectedResolutionKey = availableResolutions[2].key;
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
			const parsedDate = dayjs(entry.date);
			const year = parsedDate.year();
			return year >= compareStartYear && year <= compareEndYear;
		});

		// Group historical data
		const historicalGroupedData = filteredHistoricalData.reduce((acc, entry) => {
			let key;
			if (selectedResolution.key === 'months') {
				key = String(dayjs(entry.date).month());
			} else if (selectedResolution.key === 'seasons') {
				key = String(getSeasonCode(entry.date));
			} else if (selectedResolution.key === 'years') {
				key = 'Overall';
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

		// Limit to the most recent 'slice' periods and exclude the very first one
		recentPeriods = recentPeriods.slice(1);

		// Calculate recent data with completeness check
		recentData = recentPeriods.map((period) => {
			let periodData;
			let seasonType;
			let isOngoing = false;
			const today = dayjs();

			let averageTemperature = null;
			let differenceFromHistorical = null;
			let expectedDays = 0;

			if (selectedResolution.key === 'months') {
				periodData = data.filter((entry) => dayjs(entry.date).format('YYYY-MM') === period);
				const periodDate = dayjs(period, 'YYYY-MM');
				seasonType = String(periodDate.month());
				isOngoing = periodDate.isSame(today, 'month');
				period = periodDate.format('MMMM YYYY');

				// Compute expectedDays
				expectedDays = periodDate.daysInMonth();
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

				// Compute expectedDays
				let monthsInSeason = [];
				if (seasonCode === seasonCodes['Winter']) {
					monthsInSeason = [
						dayjs(`${year - 1}-12-01`),
						dayjs(`${year}-01-01`),
						dayjs(`${year}-02-01`)
					];
				} else if (seasonCode === seasonCodes['Frühling']) {
					monthsInSeason = [dayjs(`${year}-03-01`), dayjs(`${year}-04-01`), dayjs(`${year}-05-01`)];
				} else if (seasonCode === seasonCodes['Sommer']) {
					monthsInSeason = [dayjs(`${year}-06-01`), dayjs(`${year}-07-01`), dayjs(`${year}-08-01`)];
				} else if (seasonCode === seasonCodes['Herbst']) {
					monthsInSeason = [dayjs(`${year}-09-01`), dayjs(`${year}-10-01`), dayjs(`${year}-11-01`)];
				}

				expectedDays = monthsInSeason.reduce((sum, month) => sum + month.daysInMonth(), 0);
			} else if (selectedResolution.key === 'years') {
				const year = parseInt(period);
				periodData = data.filter((entry) => dayjs(entry.date).year() === year);
				seasonType = 'Overall';
				isOngoing = year === today.year();

				// Compute expectedDays
				const isLeapYear = dayjs(`${year}-01-01`).isLeapYear();
				expectedDays = isLeapYear ? 366 : 365;
			}

			// Check if data is complete
			if (periodData.length >= expectedDays * 0.9 || isOngoing) {
				// Proceed with calculation
				averageTemperature =
					periodData.reduce((sum, entry) => sum + parseFloat(entry.tl_mittel), 0) /
					periodData.length;

				const historicalAverage = historicalAverageLookup[seasonType] || 0;
				differenceFromHistorical = averageTemperature - historicalAverage;
			}

			return {
				period,
				averageTemperature:
					averageTemperature !== null ? parseFloat(averageTemperature.toFixed(2)) : null,
				differenceFromHistorical:
					differenceFromHistorical !== null
						? parseFloat(differenceFromHistorical.toFixed(2))
						: null,
				selectedResolution: selectedResolution.key,
				isOngoing
			};
		});

		if (selectedResolutionKey == 'years' || selectedResolutionKey == 'seasons') {
			// Do not include ongoing years & seasons
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
	<p class="mx-auto w-max max-w-full">
		Schau die
		<select bind:value={selectedResolutionKey} class="k_input k_dropdown mx-1">
			{#each availableResolutions as resolution}
				<option value={resolution.key}>{resolution.label}</option>
			{/each}
		</select>
		<span>im Vergleich zum historischen Durchschnitt</span>
		<select bind:value={selectedPeriodLabel} class="k_input k_dropdown mx-1">
			{#each availablePeriods as period}
				<option value={period.label}>{period.label}</option>
			{/each}
		</select>
		an
	</p>

	{#await averagesPromise}
		<Loader showText={true} />
	{:then averages}
		<ComparisonChart
			historicalAverages={averages.historicalAverages}
			recentData={averages.recentData}
			{selectedStation}
			{selectedPeriod}
		/>
	{/await}

	{#if selectedResolutionKey !== 'years'}
		<p class="border-t mt-2 pt-2">
			Monate und Jahreszeiten werden mit den gleichen Perioden im Vergleichszeitraum vergleichen,
			also z.B. April 2024 im Vergleich zu allen Aprils im Vergleichszeitraum.
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
		verfügbar von {dayjs(data[0].date).format('DD.MM.YYYY')} - {dayjs(
			data[data.length - 1].date
		).format('DD.MM.YYYY')}
		{data.findIndex((d) => d.tlmax == null) > -1
			? ' mit Datenlücken, die in diesen Auswertungen automatisch übersprungen werden'
			: ''}
	</p>
</div>
