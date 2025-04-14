<script>
	import Chart from './Chart.svelte';

	$: getData = async (energy) => {
		const response = await fetch(
			`https://base.klimadashboard.org/get-renewables-growth?table=energy_${energy}_units&group=year`
		);
		const data = await response.json();
		return data;
	};

	$: promise = getData(selectedEnergy);

	$: selectedEnergy = 'wind';
</script>

<select bind:value={selectedEnergy}>
	<option value="wind">Wind</option>
	<option value="solar">Solar</option>
</select>
<div class="h-80">
	{#await promise then data}
		<Chart {data} />
	{:catch error}
		{error}
	{/await}
</div>
