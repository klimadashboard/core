<script lang="ts">
	import {
		BarController,
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
	import { onDestroy, onMount } from 'svelte';

	ChartJS.register(
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Title,
		Tooltip,
		Legend
	);

	let isPerCapita = false;
	let emissionType: 'ghg' | 'co2' = 'ghg';
	let selectedState = 'de-baden-wuerttemberg';
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
				},
				ticks: {
					autoSkip: false,
					maxRotation: 0,
					callback: function(val, index) {
						const year = parseInt(this.getLabelForValue(val as number));
						return year >= 1990 && (year - 1990) % 5 === 0 ? year.toString() : '';
					}
				}
			}
		}
	};

	// Population data for each state (2021 data)
	const statePopulations: Record<string, number> = {
		'de-baden-wuerttemberg': 11_100_394,
		'de-bayern': 13_176_989,
		'de-berlin': 3_677_472,
		'de-brandenburg': 2_537_868,
		'de-bremen': 676_463,
		'de-hamburg': 1_853_935,
		'de-hessen': 6_295_017,
		'de-mecklenburg-vorpommern': 1_611_160,
		'de-niedersachsen': 8_027_031,
		'de-nordrhein-westfalen': 17_924_591,
		'de-rheinland-pfalz': 4_106_485,
		'de-saarland': 983_991,
		'de-sachsen': 4_056_941,
		'de-sachsen-anhalt': 2_180_684,
		'de-schleswig-holstein': 2_910_875,
		'de-thueringen': 2_120_237
	};

	// German names for states
	const stateNames: Record<string, string> = {
		'de-baden-wuerttemberg': 'Baden-Württemberg',
		'de-bayern': 'Bayern',
		'de-berlin': 'Berlin',
		'de-brandenburg': 'Brandenburg',
		'de-bremen': 'Bremen',
		'de-hamburg': 'Hamburg',
		'de-hessen': 'Hessen',
		'de-mecklenburg-vorpommern': 'Mecklenburg-Vorpommern',
		'de-niedersachsen': 'Niedersachsen',
		'de-nordrhein-westfalen': 'Nordrhein-Westfalen',
		'de-rheinland-pfalz': 'Rheinland-Pfalz',
		'de-saarland': 'Saarland',
		'de-sachsen': 'Sachsen',
		'de-sachsen-anhalt': 'Sachsen-Anhalt',
		'de-schleswig-holstein': 'Schleswig-Holstein',
		'de-thueringen': 'Thüringen'
	};

	// Add chart instance variable
	let chart: ChartJS | null = null;
	let chartCanvas: HTMLCanvasElement;

	interface PapaParseResult {
		data: EmissionData[];
		errors: any[];
		meta: {
			delimiter: string;
			linebreak: string;
			aborted: boolean;
			truncated: boolean;
			cursor: number;
		};
	}

	function initChart(node: HTMLCanvasElement) {
		chartCanvas = node;
		
		// Set canvas dimensions
		const parent = node.parentElement;
		if (parent) {
			node.width = parent.clientWidth;
			node.height = parent.clientHeight || 400;
		}

		// Create new chart
		chart = new ChartJS(node, {
			type: 'bar',
			data: chartData,
			options: {
				...options,
				maintainAspectRatio: false,
				responsive: true
			}
		});

		return {
			destroy() {
				if (chart) {
					chart.destroy();
					chart = null;
				}
			}
		};
	}

	function updateChartData(rawData: EmissionData[], usePerCapita: boolean) {
		const years = Array.from({ length: 51 }, (_, i) => (1990 + i).toString());
		const population = statePopulations[selectedState];

		const emissionData = years.map((year) => {
			const row = rawData.find((r) => r.period === year && r.unit === emissionType);
			const value = row ? +row.value : 0;
			return usePerCapita ? value / population : value;
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

		if (options.scales?.y?.title) {
			options.scales.y.title.text = usePerCapita
				? 'Emissionen (Tonnen pro Einwohner)'
				: 'Emissionen (Tonnen)';
		}
		if (options.plugins?.title) {
			options.plugins.title.text = usePerCapita
				? `${emissionType.toUpperCase()}-Emissionen pro Einwohner in ${
						stateNames[selectedState]
				  } (1990-2045)`
				: `${emissionType.toUpperCase()}-Emissionen in ${stateNames[selectedState]} (1990-2045)`;
		}

		// Update the chart if it exists
		if (chart) {
			chart.data = chartData;
			chart.options = options;
			chart.update('none'); // Add update mode
		}
	}

	async function fetchData() {
		try {
			const response = await fetch('/emissions_de_federal_states_25102024.csv');
			const csvText = await response.text();

			Papa.parse<EmissionData>(csvText, {
				header: true,
				delimiter: ',',
				skipEmptyLines: true,
				complete: (results: PapaParseResult) => {
					currentData = results.data;
					const filteredData = results.data.filter(
						(row) =>
							row.category === 'total' && row.region === selectedState && row.unit === emissionType
					);

					updateChartData(filteredData, isPerCapita);
					dataLoaded = true;
				},
				error: (error: Error) => {
					console.error('Papa Parse error:', error);
					error = error;
				}
			});
		} catch (e) {
			console.error('Fetch error:', e);
			error = e instanceof Error ? e : new Error('Unknown error occurred');
		}
	}

	function updateChart() {
		if (!currentData.length) return;

		const filteredData = currentData.filter(
			(row) => row.category === 'total' && row.region === selectedState && row.unit === emissionType
		);

		updateChartData(filteredData, isPerCapita);
	}

	onMount(() => {
		console.log('Component mounted');
		fetchData();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	$: {
		console.log('Reactive statement triggered:', { isPerCapita, emissionType, dataLoaded });
		if (dataLoaded && selectedState) {
			updateChart();
		}
	}
</script>

<div class="controls-container">
	<div class="controls-left">
		<select bind:value={selectedState} class="state-select">
			{#each Object.entries(stateNames) as [value, name]}
				<option {value}>{name}</option>
			{/each}
		</select>
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
{:else if dataLoaded && chartData.labels && chartData.labels.length > 0}
	<div class="chart-container">
		<canvas use:initChart></canvas>
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
		padding: 0 1rem;
	}

	.controls-left {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.state-select {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #ccc;
		font-size: 1rem;
		cursor: pointer;
	}

	.toggle-group {
		display: flex;
		gap: 1rem;
	}

	.toggle-container {
		text-align: right;
		padding-left: 2rem;
	}

	.toggle-label {
		display: inline-flex;
		align-items: center;
		gap: 0.8rem;
		cursor: pointer;
		padding: 0.3rem 0;
	}

	input[type='checkbox'],
	input[type='radio'] {
		cursor: pointer;
	}

	select:focus {
		outline: none;
		border-color: #666;
	}

	.chart-container {
		position: relative;
		height: 400px;
		width: 100%;
		margin: 1rem 0;
	}

	canvas {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
</style>
