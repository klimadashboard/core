<script lang="ts">
	import {
		BarElement,
		CategoryScale,
		Chart as ChartJS,
		Legend,
		LinearScale,
		Title,
		Tooltip,
		type ChartData,
		type ChartOptions
	} from 'chart.js';
	import Papa from 'papaparse';
	import { onMount } from 'svelte';
	import { Bar } from 'svelte-chartjs';

	ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

	let isPerCapita = false;
	let emissionType: 'ghg' | 'co2' = 'ghg';
	let population = 11_100_394;
	let currentData: EmissionData[] = [];

	interface EmissionData {
		region: string;
		period: string;
		category: string;
		unit: string;
		value: string;
	}

	let chartData: ChartData<'bar'> = {
		labels: [],
		datasets: []
	};

	let dataLoaded = false;
	let error: Error | null = null;

	const options: ChartOptions<'bar'> = {
		responsive: true,
		plugins: {
			title: {
				display: true,
				text: 'Emissionen in Baden-Württemberg (1990-2045)'
			},
			legend: {
				display: true,
				position: 'top' as const
			}
		},
		scales: {
			y: {
				title: {
					display: true,
					text: 'Emissionen (Tonnen)'
				}
			},
			x: {
				title: {
					display: true,
					text: 'Jahr'
				}
			}
		}
	};

	function updateChartData(rawData: EmissionData[], usePerCapita: boolean) {
		console.log('updateChartData called with:', {
			rawDataLength: rawData.length,
			usePerCapita,
			emissionType
		});

		const years = Array.from({ length: 51 }, (_, i) => (1990 + i).toString());

		const emissionData = years.map((year) => {
			const row = rawData.find((r) => r.period === year && r.unit === emissionType);
			const value = row ? +row.value : 0;
			return usePerCapita ? value / population : value;
		});

		console.log('Processed emission data:', {
			firstFewValues: emissionData.slice(0, 5),
			hasData: emissionData.some((v) => v > 0)
		});

		chartData = {
			labels: years,
			datasets: [
				{
					label: usePerCapita
						? `${emissionType.toUpperCase()}-Emissionen pro Einwohner`
						: `${emissionType.toUpperCase()}-Emissionen`,
					data: emissionData,
					backgroundColor: 'rgba(0, 0, 0, 1)',
					borderColor: 'rgba(0, 0, 0, 1)',
					borderWidth: 1
				}
			]
		};

		options.scales.y.title.text = usePerCapita
			? 'Emissionen (Tonnen pro Einwohner)'
			: 'Emissionen (Tonnen)';
		options.plugins.title.text = usePerCapita
			? `${emissionType.toUpperCase()}-Emissionen pro Einwohner in Baden-Württemberg (1990-2045)`
			: `${emissionType.toUpperCase()}-Emissionen in Baden-Württemberg (1990-2045)`;

		console.log('Updated chartData:', {
			label: chartData.datasets[0].label,
			dataLength: chartData.datasets[0].data.length
		});
	}

	async function fetchData() {
		try {
			const response = await fetch('/emissions_de_federal_states_25102024.csv');
			const csvText = await response.text();
			console.log('CSV fetched, first 100 chars:', csvText.substring(0, 100));

			Papa.parse<EmissionData>(csvText, {
				header: true,
				delimiter: ',',
				skipEmptyLines: true,
				complete: (results) => {
					console.log('Papa Parse complete:', {
						totalRows: results.data.length,
						firstRow: results.data[0]
					});

					currentData = results.data;
					const filteredData = results.data.filter(
						(row) =>
							row.category === 'total' &&
							row.region === 'de-baden-wuerttemberg' &&
							row.unit === emissionType
					);

					console.log('Filtered data:', {
						filteredLength: filteredData.length,
						firstFilteredRow: filteredData[0]
					});

					updateChartData(filteredData, isPerCapita);
					dataLoaded = true;
				},
				error: (error) => {
					console.error('Papa Parse error:', error);
					error = new Error(error.message);
				}
			});
		} catch (e) {
			console.error('Fetch error:', e);
			error = e instanceof Error ? e : new Error('Unknown error occurred');
		}
	}

	function updateChart() {
		console.log('updateChart called with:', { isPerCapita, emissionType });

		if (!currentData.length) {
			console.warn('No current data available');
			return;
		}

		const filteredData = currentData.filter(
			(row) =>
				row.category === 'total' &&
				row.region === 'de-baden-wuerttemberg' &&
				row.unit === emissionType
		);

		console.log('Filtered data in updateChart:', {
			filteredLength: filteredData.length,
			firstFilteredRow: filteredData[0]
		});

		updateChartData(filteredData, isPerCapita);
	}

	onMount(() => {
		console.log('Component mounted');
		fetchData();
	});

	$: {
		console.log('Reactive statement triggered:', { isPerCapita, emissionType, dataLoaded });
		if (dataLoaded) {
			updateChart();
		}
	}
</script>

<div class="controls-container">
	<div class="toggle-group">
		<label class="toggle-label">
			<input type="radio" name="emissionType" value="ghg" bind:group={emissionType} />
			GHG
		</label>
		<label class="toggle-label">
			<input type="radio" name="emissionType" value="co2" bind:group={emissionType} />
			CO₂
		</label>
	</div>
	<div class="toggle-container">
		<label class="toggle-label">
			<input type="checkbox" bind:checked={isPerCapita} />
			Pro-Einwohner
		</label>
	</div>
</div>

{#if error}
	<p>Error loading data: {error.message}</p>
{:else if dataLoaded && chartData.labels.length > 0}
	<div>
		<Bar data={chartData} {options} />
	</div>
{:else}
	<p>Loading data...</p>
{/if}

<style>
	.controls-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.toggle-group {
		display: flex;
		gap: 1rem;
	}

	.toggle-container {
		text-align: right;
	}

	.toggle-label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	input[type='checkbox'],
	input[type='radio'] {
		cursor: pointer;
	}
</style>
