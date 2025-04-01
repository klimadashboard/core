<script>
	import formatNumber from '$lib/stores/formatNumber';
	export let data;
	export let regions;
	export let selectedPeriod;
	export let selectedRegion = null;

	let latestPeriod = Math.max(...data.map((d) => parseInt(d.period)));

	$: getElectricShare = (region, period) => {
		const relevantData = data.filter((d) => d.region == region.code && period == d.period);
		const electricShare =
			relevantData.find((d) => d.category == 'Elektro')?.value /
			relevantData.find((d) => d.category == 'Insgesamt')?.value;
		return electricShare * 100;
	};

	$: getPopulationRatio = (region, period) => {
		const totalCars =
			data.find((d) => d.region == region.code && period == d.period && d.category == 'Insgesamt')
				?.value || 0;
		const populationRatio = region.population / totalCars;
		return populationRatio;
	};

	// Scroll to selected region
	$: if (selectedRegion) {
		const el = document.getElementById(`region-${selectedRegion}`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
</script>

<div class="h-full overflow-scroll w-full">
	<div class="sticky top-0 bg-white dark:bg-gray-900 p-2 border-b">
		<button
			on:mousedown={() =>
				regions.sort(
					(a, b) =>
						a.carsElectricShare.find((d) => d.period == selectedPeriod)?.value -
						b.carsElectricShare.find((d) => d.period == selectedPeriod)?.value
				)}>E-Autos</button
		>
		<button>Autos pro 1000 Einwohner</button>
	</div>
	<ul>
		{#each regions as region}
			<li
				class="py-1 border-t border-gray-200 {selectedRegion == region.code ? 'bg-gray-100' : ''}"
				id={`region-${region.code}`}
			>
				<h3 class="font-bold">{region.name}</h3>
				<p>{region.code}</p>
				<div class="grid grid-cols-2">
					<div>
						<p class="text-4xl font-light">
							{formatNumber(
								region.carsElectricShare.find((d) => d.period == selectedPeriod)?.value
							)}%
						</p>
						<div>Anteil der Elektromobilität</div>
					</div>
					<div>
						<p class="text-4xl font-light">
							{formatNumber(
								region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)?.value
							)}
						</p>
						<div>Autos pro 1000 Einwohner:innen</div>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.region {
		padding: 0.5rem;
		border-bottom: 1px solid #eee;
		cursor: default;
	}
	.region:hover {
		background: #f9f9f9;
	}
	.expanded {
		padding-left: 1rem;
		font-size: 0.9rem;
		color: #555;
	}
	.rank {
		display: inline-block;
		width: 4rem;
		font-weight: bold;
	}
</style>
