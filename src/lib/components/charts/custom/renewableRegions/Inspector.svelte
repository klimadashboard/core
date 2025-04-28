<script>
	import Loader from '$lib/components/Loader.svelte';
	import BarChart from './BarChart.svelte';
	import LineChart from './LineChart.svelte';
	import Comparison from './Comparison.svelte';
	import formatNumber from '$lib/stores/formatNumber';

	export let region;
	export let data;
	export let regions;
	export let colors;
	export let selectedEnergy;

	$: getDataForRegion = async (regionCode = false, selectedEnergy) => {
		console.log(regionCode);
		const url = regionCode
			? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${regionCode}`
			: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;
		const response = await fetch(url);
		const data = await response.json();
		return data;
	};

	$: promise = getDataForRegion(region.code, selectedEnergy);

	$: getFormattedCapacity = (capacity) => {
		if (capacity < 1000) {
			return formatNumber(Math.round(capacity)) + ' KW';
		} else {
			return formatNumber(Math.round(capacity / 1000)) + ' MW';
		}
	};

	$: filteredData = (data) => {
		return data.filter((d) => d.added_power_kw > 0);
	};
</script>

{#if region}
	{#await promise}
		<Loader />
	{:then data}
		{#if filteredData(data).length === 0}
			{#if selectedEnergy === 'solar'}
				<h2 class="font-bold text-xl">
					In {region.name} wurden bisher keine Solaranlagen angeschlossen.
				</h2>
			{:else}
				<h2 class="font-bold text-xl">
					In {region.name} wurden bisher keine Windräder angeschlossen.
				</h2>
			{/if}
		{:else}
			{#if filteredData(data).length < 5}
				<h2 class="font-bold text-xl">Was machen wir wenn es in wenig Jahren neue Daten gab?</h2>
			{/if}

			<h2 class="text-xl mb-4">{region.name}</h2>
			{#if selectedEnergy === 'solar'}
				{#if data.find((d) => d.year === new Date().getFullYear())?.added_power_kw === 0}
					<h3 class="font-bold text-2xl">
						Seit Jahresbeginn wurden keine Solaranlagen installiert
					</h3>
				{:else}
					<h3 class="font-bold text-2xl">
						Seit Jahresbeginn wurden {getFormattedCapacity(
							data.find((d) => d.year === new Date().getFullYear())?.added_power_kw ?? 0
						)} Solarkapazität installiert
					</h3>
				{/if}
			{:else if data.find((d) => d.year === new Date().getFullYear())?.added_power_kw === 0}
				<h3 class="font-bold text-2xl">Seit Jahresbeginn wurden keine Windräder angeschlossen</h3>
			{:else}
				<h3 class="font-bold text-2xl">
					Seit Jahresbeginn wurden {getFormattedCapacity(
						data.find((d) => d.year === new Date().getFullYear())?.added_power_kw ?? 0
					)} Kapazität Windenergie installiert
				</h3>
			{/if}
			<p class="text-lg mb-5">Jährliche installierte Leistung in Megawatt</p>
			<BarChart {data} {colors} />
			<p class="text-lg mt-2 border-b pb-4 mb-4 border-current/20">
				Im vergangenen Jahr wurden {getFormattedCapacity(
					data.find((d) => d.year === new Date().getFullYear() - 1)?.added_power_kw
				)} neu installiert. Das waren {Math.round(
					data.find((d) => d.year === new Date().getFullYear() - 1)?.added_power_kw /
						data.find((d) => d.year === new Date().getFullYear() - 11)?.added_power_kw
				)} Mal mehr als zehn Jahre zuvor ({new Date().getFullYear() - 11}: {getFormattedCapacity(
					data.find((d) => d.year === new Date().getFullYear() - 11)?.added_power_kw
				)}).
			</p>
			<h3 class="font-bold text-2xl">
				Insgesamt wurden bisher {getFormattedCapacity(
					data.find((d) => d.year === new Date().getFullYear())?.cumulative_power_kw
				)} installiert
			</h3>
			<p class="text-lg mb-2">Kumulierte installierte Leistung in Megawatt</p>
			<Comparison {data} {regions} {region} {colors} />
			<p class="text-lg mt-2 border-b pb-4 mb-4 border-current/20">
				Hier noch Vergleich mit anderen Gemeinden beschreiben falls wir das bauen
			</p>
		{/if}
	{/await}
{/if}
