<script>
	import formatNumber from '$lib/stores/formatNumber';

	export let region;
	console.log(region);
	export let selectedPeriod;
</script>

{#if region}
	<div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
		<h2 class="font-bold">PKWs in {region.name}</h2>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<p class="text-5xl font-light">
					{formatNumber(region.carsElectricShare.find((d) => d.period == selectedPeriod)?.value)}%
				</p>
				<div>Anteil der Elektromobilität</div>
			</div>
			<div>
				<p class="text-5xl font-light">
					{formatNumber(
						region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)?.value
					)}
				</p>
				<div>Autos pro 1000 Einwohner:innen</div>
			</div>
		</div>
	</div>
{/if}
