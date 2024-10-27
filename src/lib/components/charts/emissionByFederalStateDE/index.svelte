<script>
	import {
		BarElement,
		CategoryScale,
		Chart as ChartJS,
		Legend,
		LinearScale,
		Title,
		Tooltip
	} from 'chart.js';
	import Papa from 'papaparse';
	import { onMount } from 'svelte';
	import { Bar } from 'svelte-chartjs';
	
	// Register ChartJS components
	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale
	);
	
	let chartData = {
		labels: [],
		datasets: []
	};
	let dataLoaded = false;
	let error = null;
	
	const options = {
		responsive: true,
		plugins: {
			title: {
				display: true,
				text: 'Emissions in Baden-Württemberg (1990-2045)'
			},
			legend: {
				display: true,
				position: 'top'
			}
		},
		scales: {
			y: {
				title: {
					display: true,
					text: 'Emissions (tons)'
				}
			},
			x: {
				title: {
					display: true,
					text: 'Year'
				}
			}
		}
	};
	
	onMount(async () => {
		try {
			// Fetch the CSV file
			const response = await fetch('/emissions_de_federal_states_25102024.csv');
			const csvText = await response.text();
			
			// Parse with PapaParse
			Papa.parse(csvText, {
					header: true,
					delimiter: ";",
					complete: (results) => {
							const filteredData = results.data.filter(row => row.category === 'total');
							
							// Create array of all years from 1990 to 2040
							const years = Array.from({length: 51}, (_, i) => (1990 + i).toString());
							
							// Get GHG data, filling missing years with 0
							const ghgData = years.map(year => {
								const row = filteredData.find(r => r.period === year && r.unit === 'ghg');
								return row ? +row.value : 0;
							});
							
							chartData = {
								labels: years,
								datasets: [
									{
										label: 'GHG Emissions',
										data: ghgData,
										backgroundColor: 'rgba(0, 0, 0, 1)',  // Changed to black with transparency
										borderColor: 'rgba(0, 0, 0, 1)',       // Changed to black
										borderWidth: 1
									}
								]
							};
							console.log('Processed data:', chartData);
							dataLoaded = true;
					},
					error: (error) => {
							console.error('Error parsing CSV:', error);
							error = error;
					}
			});
		} catch (e) {
			error = e;
			console.error("Error loading data:", e);
		}
	});
</script>

{#if error}
	<p>Error loading data: {error.message}</p>
{:else if dataLoaded && chartData.labels.length > 0}
	<div>
		<Bar
			data={chartData}
			options={options}
		/>
	</div>
{:else}
	<p>Loading data...</p>
{/if}
