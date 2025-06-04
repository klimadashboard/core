<script>
	import Loader from '$lib/components/Loader.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import AveragesWorker from './calculateAverages.worker.js?worker';

	export let data;
	export let selectedStation;
	let isLoading = false;

	let slices = [200, 400, 600];
	let slice = slices[0];

	const availableResolutions = [
		{ key: 'months', label: 'Monate' },
		{ key: 'seasons', label: 'Jahreszeiten' },
		{ key: 'years', label: 'Jahre' }
	];

	let firstDate = new Date(data[0].date);
	let availablePeriods = [
		{ label: '1961-1990', start: 1961, end: 1990 },
		{ label: '1971-2000', start: 1971, end: 2000 },
		{ label: '1981-2010', start: 1981, end: 2010 },
		{ label: '1991-2020', start: 1991, end: 2020 }
	].filter((d) => new Date(`${d.start}-01-01`) >= firstDate && d.end > firstDate.getFullYear());

	let selectedResolutionKey = availableResolutions[2].key;
	let selectedPeriodLabel = availablePeriods[0].label;

	$: selectedResolution = availableResolutions.find((r) => r.key === selectedResolutionKey);
	$: selectedPeriod = availablePeriods.find((p) => p.label === selectedPeriodLabel);

	let averagesPromise;

	$: if (selectedResolution && selectedPeriod && slice) {
		isLoading = true;
		averagesPromise = new Promise((resolve, reject) => {
			const worker = new AveragesWorker();
			worker.postMessage({ data, resolution: selectedResolution, period: selectedPeriod, slice });

			worker.onmessage = (e) => {
				const { result, error } = e.data;
				if (error) reject(new Error(error));
				else resolve(result);
				worker.terminate();
				isLoading = false;
			};

			worker.onerror = (err) => {
				console.error('Worker error:', err);
				reject(err);
				isLoading = false;
			};
		});
	}
</script>

<div class="mt-16">
	<p class="mx-auto w-max max-w-full">
		Schau die
		<select bind:value={selectedResolutionKey} class="input k_dropdown mx-1">
			{#each availableResolutions as resolution}
				<option value={resolution.key}>{resolution.label}</option>
			{/each}
		</select>
		<span>im Vergleich zum historischen Durchschnitt</span>
		<select bind:value={selectedPeriodLabel} class="input k_dropdown mx-1">
			{#each availablePeriods as period}
				<option value={period.label}>{period.label}</option>
			{/each}
		</select>
		an
	</p>

	{#await averagesPromise}
		<Loader showText={true} />
		<p class="text-center text-sm text-green-600">
			(das kann bei umfangreichen Wetterdaten ein bisschen dauern...)
		</p>
	{:then averages}
		<ComparisonChart
			historicalAverages={averages.historicalAverages}
			recentData={averages.recentData}
			{selectedStation}
			{selectedPeriod}
		/>
	{:catch error}
		<p class="text-red-600">Ein Fehler ist aufgetreten: {error.message}</p>
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
		verfügbar von {new Date(data[0].date).toLocaleDateString()} -
		{new Date(data[data.length - 1].date).toLocaleDateString()}
	</p>
</div>
