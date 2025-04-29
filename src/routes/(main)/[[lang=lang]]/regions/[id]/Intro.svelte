<script>
	import Panel from '$lib/components/blocks/Panel.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { types } from '$lib/stores/weather';
	import { onMount } from 'svelte';

	export let data;

	let place = '';
	let station = null;
	let indicators = null;
	let panels = [];

	onMount(async () => {
		place = data.page.name;

		const [lon, lat] = data.page.center;
		const stationRes = await fetch(
			`https://base.klimadashboard.org/get-nearest-stations?lat=${lat}&lon=${lon}&limit=1`
		);
		const stations = await stationRes.json();
		station = stations[0];

		const table = station.source === 'de_dwd_stations' ? 'de_dwd_data' : 'at_geosphere_data';

		const indicatorsRes = await fetch(
			`https://base.klimadashboard.org/get-weather-indicators-for-station?station=${station.id}&table=${table}`
		);
		indicators = await indicatorsRes.json();
		console.log(indicatorsRes);

		panels = Object.entries(indicators)
			.map(([key, value]) => ({
				title: $types.find((d) => d.key == key)?.label,
				subtitle: `im letzten Jahr`,
				colorBackground: $types.find((d) => d.key == key)?.color,
				colorText: '#fff',
				number: value.lastYear ?? '-',
				unit: 'Tage',
				source:
					station.name +
					(station.distance_km > 6
						? ' | ' + formatNumber(Math.round(station.distance_km)) + 'km entfernt'
						: ''),
				mostRecentOccurrence: value.mostRecentOccurrence,
				list: [
					{ text: `${value.historicAverage1961to1990} im Durchschnitt 1961–1990` },
					{ text: `${value.thisYear} bisher in ${new Date().getFullYear()}` }
				]
			}))
			.sort((a, b) => (a.mostRecentOccurrence ?? Infinity) - (b.mostRecentOccurrence ?? Infinity));
	});
</script>

{#if station && indicators}
	<div class="container my-8">
		<div class="">
			<p class="font-bold my-auto text-xl">
				Das Klimadashboard {place} zeigt auf, wo {place} in der Klimakrise steht.
			</p>
		</div>
		<h2 class="border-b mt-6 mb-2 font-bold">Auf einen Blick</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-1">
			{#each panels.splice(0, 4) as panel}
				<div class="rounded-2xl overflow-hidden">
					<Panel block={panel} />
				</div>
			{/each}
		</div>
	</div>
{:else}
	<Loader />
{/if}
