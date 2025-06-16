<script>
	import Loader from '$lib/components/Loader.svelte';
	import BarChart from './BarChart.svelte';
	import Types from './Types.svelte';
	import Comparison from './Comparison.svelte';
	import Disclaimer from './Disclaimer.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let region;
	export let data;
	export let regions;
	export let colors;
	export let selectedEnergy;

	let source = 'Datenquelle: Bundesnetzagentur | Marktstammdatenregister';

	$: getDataForRegion = async (regionCode = false, selectedEnergy) => {
		const url =
			regionCode && regionCode !== PUBLIC_VERSION
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
		return data.by_year.filter((d) => d.cumulative_power_kw > 0);
	};

	$: copyEmbedCode = function () {
		var copyText =
			'<iframe src="' +
			window.location.origin +
			'/embed/renewable-regions/' +
			region.id +
			'?energy=' +
			selectedEnergy +
			'" width=1200 height=400>';
		var dummy = document.createElement('textarea');
		document.body.appendChild(dummy);
		dummy.value = copyText;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);
		alert('Der iFrame-Code wurde in die Zwischenablage kopiert.');
	};
</script>

{#if region}
	{#await promise}
		<Loader />
	{:then result}
		{#if result.by_year[result.by_year.length - 1].cumulative_power_kw === 0}
			<h2 class="font-bold text-xl">
				In {region.name} sind aktuell keine aktiven {selectedEnergy === 'solar'
					? 'Solaranlagen'
					: 'Windräder'} registriert.
			</h2>
		{:else}
			<div class="flex justify-between">
				<h2 class="text-lg mb-4">
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
						class="inline -translate-y-0.5 w-5 h-5"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"
						/><path
							d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"
						/></svg
					>
					{region.name}
				</h2>
				<button
					on:mousedown={() => copyEmbedCode()}
					class="opacity-80 hover:opacity-100 transition cursor-pointer flex items-center gap-1"
					aria-label="Einbetten"
				>
					<span>iFrame kopieren</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="translate-y-0.5"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<polyline points="7 8 3 12 7 16" />
						<polyline points="17 8 21 12 17 16" />
						<line x1="14" y1="4" x2="10" y2="20" />
					</svg>
				</button>
			</div>

			{#if result.by_year.reduce((acc, d) => acc + d.added_power_kw, 0) === 0}
				<p class="text-lg">
					Die Anlagen in dieser Region wurden alle vor dem Jahr 2000 in Betrieb genommen.
				</p>
			{:else}
				<h3 class="font-bold">Netto-Zubau pro Jahr</h3>

				{#if selectedEnergy === 'solar'}
					{#if result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw === 0}
						<h3 class="font-bold text-2xl">
							Seit Jahresbeginn wurden in {region.name} keine Solaranlagen installiert
						</h3>
					{:else}
						<h3 class="font-bold text-2xl">
							Seit Jahresbeginn wurden in {region.name}
							{getFormattedCapacity(
								result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw ?? 0
							)} Solarkapazität installiert
						</h3>
					{/if}
				{:else if result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw === 0}
					<h3 class="font-bold text-2xl">
						Seit Jahresbeginn wurden in {region.name} keine Windräder angeschlossen
					</h3>
				{:else}
					<h3 class="font-bold text-2xl">
						Seit Jahresbeginn wurden in {region.name}
						{getFormattedCapacity(
							result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw ?? 0
						)} Kapazität Windenergie installiert
					</h3>
				{/if}

				<BarChart data={result.by_year} {colors} />
				<p class="text-sm mt-2 opacity-80">{source}</p>
			{/if}

			<h3 class="mt-6 font-bold">Kumulative Leistung</h3>

			<h3 class="font-bold text-2xl mb-2">
				Insgesamt wurden bisher in {region.name}
				{getFormattedCapacity(
					result.by_year.find((d) => d.year === new Date().getFullYear())?.cumulative_power_kw
				)} installiert
			</h3>

			<Comparison data={result.by_year} {regions} {region} {colors} {selectedEnergy} />
			<p class="text-sm mt-2 opacity-80">{source}</p>
			{#if selectedEnergy == 'solar'}
				<Disclaimer {region} ratio={result.grid_operator_checked_ratio} {colors} />
				<Types data={result.current_by_type} {colors} {region} />
			{/if}
		{/if}
	{/await}
{/if}
