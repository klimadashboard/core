<script>
	import formatNumber from '$lib/stores/formatNumber';

	export let region;
	export let selectedRegion;
	export let selectedPeriod;
</script>

<button
	class="rounded p-3 bg-gray-100 dark:bg-gray-800 appearance-none text-left"
	on:mousedown={() => (selectedRegion = region.code)}
>
	<h3 class="font-bold">{region.name} <span class="font-normal">| {region.type}</span></h3>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<div>
				<span class="font-bold"
					>{formatNumber(
						region.carsElectricShare.find((d) => d.period == selectedPeriod)?.value
					)}%</span
				> Anteil der Elektromobilität
			</div>
		</div>
		<div>
			<div>
				<span class="font-bold"
					>{formatNumber(
						region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)?.value
					)}</span
				> Autos pro 1000 Einwohner:innen
			</div>
		</div>
	</div>
</button>
