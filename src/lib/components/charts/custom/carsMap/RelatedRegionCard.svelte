<script>
	import formatNumber from '$lib/stores/formatNumber';
	import { icons } from './icons';
	import { colors } from './scales';

	export let region;
	export let selectedRegion;
	export let selectedPeriod;

	// Generic helper for getting trend info
	function getTrend(dataArray, period) {
		const current = dataArray.find((d) => d.period == period)?.value;
		const previous = dataArray.find((d) => d.period == period - 1)?.value;
		const delta = current != null && previous != null ? current - previous : null;
		const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
		return { current, delta, trend };
	}

	// Use for electric and population
	$: electric = getTrend(region.carsElectricShare, selectedPeriod);
	$: pop = getTrend(region.carsPer1000Inhabitants, selectedPeriod);

	// Rotate arrow
	const getRotation = (trend) =>
		trend === 'up' ? 'rotate(-45deg)' : trend === 'down' ? 'rotate(45deg)' : 'rotate(0deg)';
</script>

<li class="border-t border-current/10 py-2 hover:bg-current/5 transition -mx-3 px-3">
	<button
		class="w-full appearance-none text-left cursor-pointer"
		on:mousedown={() => (selectedRegion = region.code)}
	>
		<div class="flex space-x-1 items-center">
			<div class="w-6 h-6 flex content-center items-center">
				{@html icons.find((k) => k.key == region.type)?.svg}
			</div>
			<div class="">
				<h3 class="font-bold">
					{region.name} <span class="font-normal">| {region.typeLabel}</span>
				</h3>
			</div>
		</div>
		<div class="flex space-x-2 w-full">
			<div class="flex-1" style="color: {colors.electric[1]}">
				<p>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="inline"
						style="transform: {getRotation(electric.trend)}"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path
							d="M13 18l6 -6"
						/><path d="M13 6l6 6" /></svg
					>
					<b class="tabular-nums">
						{formatNumber(region.carsElectricShare.find((d) => d.period == selectedPeriod)?.value)}%
					</b> Elektroautos
				</p>
				<div class="mt-1 bg-current/10 rounded-full h-2 relative overflow-hidden">
					<div
						class="h-full relative left-0"
						style="width: {region.carsElectricShare.find((d) => d.period == selectedPeriod)
							?.value}%; background: {colors.electric[1]}"
					></div>
				</div>
			</div>
			<div class="flex-1" style="color: {colors.pop[1]}">
				<p>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="inline"
						style="transform: {getRotation(pop.trend)}"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path
							d="M13 18l6 -6"
						/><path d="M13 6l6 6" /></svg
					>
					<b class="tabular-nums">
						{formatNumber(
							region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)?.value
						)}
					</b> Autos pro 1000 Einwohner:innen
				</p>
				<div class="mt-1 bg-current/10 rounded-full h-2 relative overflow-hidden">
					<div
						class="h-full w-1 absolute"
						style="left: {region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)
							?.value / 10}%; background: {colors.pop[1]}"
					></div>
				</div>
			</div>
		</div>
	</button>
</li>
