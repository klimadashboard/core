<!--
	Neuzulassungen: one card with a menu Pkw / Lkw / Busse (large icon tiles), so the page does not need three long charts.
	Only the selected explorer is mounted (and loads its data).
	- Pkw:   newCarRegistrationsExplorer   (collection `vehicle_registrations`, passenger cars)
	- Lkw:   newTruckRegistrationsExplorer (collection `vehicle_registrations`, mode "truck")
	- Busse: newTruckRegistrationsExplorer (collection `vehicle_registrations`, mode "bus")
	Data sources: docs/data-sources-mobility.md
	CMS option `{"view": "truck"}` sets the initial view.
	Placeholder {{vehicleType}} = "Autos" / "Lkw" / "Busse" for the selected view, e.g. CMS heading
	"Wie viele neue {{vehicleType}} fahren elektrisch?"
	Text placeholders for all three vehicle types (car…, truck…, bus…): see textPlaceholders.ts
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartData } from '../../types';
	import { loadTextPlaceholders } from './textPlaceholders';
	import type { Region } from '$lib/utils/getRegion';
	import NewCarRegistrations from '../newCarRegistrationsExplorer/index.svelte';
	import NewVehicleRegistrations from '../newTruckRegistrationsExplorer/index.svelte';
	// same icon set as the rest of the site (e.g. IconCar in the emissions charts)
	import { IconCar, IconTruck, IconBus } from '@tabler/icons-svelte-runes';

	export let chart: any = undefined;
	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	/** optional local rows (preview before the collections exist) */
	export let carRows: any[] | null = null;
	export let vehicleRows: any[] | null = null;

	const VIEWS = [
		{ value: 'car', label: 'Pkw', icon: IconCar, vehicleType: 'Autos' },
		{ value: 'truck', label: 'Lkw', icon: IconTruck, vehicleType: 'Lkw' },
		{ value: 'bus', label: 'Busse', icon: IconBus, vehicleType: 'Busse' }
	] as const;
	let view: string = VIEWS.some((v) => v.value === chart?.options?.view) ? chart.options.view : 'car';

	// Pass the explorer's data on, plus
	// - {{vehicleType}} of the selected view (used in the CMS heading)
	// - the text placeholders for Pkw, Lkw and Busse (textPlaceholders.ts), loaded once, independent of the selected view,
	//   because the CMS text has one paragraph per vehicle type
	$: vehicleType = VIEWS.find((v) => v.value === view)?.vehicleType ?? '';
	let textPlaceholders: Record<string, string> = {};
	let lastData: ChartData | null = null;
	onMount(async () => {
		try {
			textPlaceholders = await loadTextPlaceholders();
			if (lastData) send(lastData); // fill the text once the values have arrived
		} catch {
			textPlaceholders = {};
		}
	});
	function send(data: ChartData) {
		onChartData?.({ ...data, placeholders: { ...(data.placeholders ?? {}), ...textPlaceholders, vehicleType } });
	}
	// plain function (not reactive): a new function on every update would make the explorer report again → endless loop.
	// The view switch remounts the explorer ({#key view}), which reports again with the new vehicleType.
	function forwardChartData(data: ChartData | null) {
		lastData = data;
		if (!data) return onChartData?.(data);
		send(data);
	}
</script>

<div class="flex flex-col gap-4">
	<!-- segmented control: one track, the active option as a raised white segment -->
	<div
		role="radiogroup"
		aria-label="Fahrzeugart"
		class="flex w-full sm:inline-flex sm:w-auto self-start gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
	>
		{#each VIEWS as v (v.value)}
			{@const active = v.value === view}
			<button
				type="button"
				role="radio"
				aria-checked={active}
				on:click={() => (view = v.value)}
				class="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-3 sm:px-5 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
					{active
					? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5 dark:bg-gray-950 dark:text-white dark:ring-white/10'
					: 'text-gray-500 hover:text-gray-900 hover:bg-white/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-900/60'}"
			>
				<svelte:component this={v.icon} size={20} stroke={1.75} aria-hidden="true" />
				<span>{v.label}</span>
			</button>
		{/each}
	</div>

	{#key view}
		{#if view === 'car'}
			<NewCarRegistrations {chart} {region} onChartData={forwardChartData} rows={carRows} />
		{:else}
			<NewVehicleRegistrations
				{chart}
				{region}
				onChartData={forwardChartData}
				rows={vehicleRows}
				mode={view === 'bus' ? 'bus' : 'truck'}
			/>
		{/if}
	{/key}
</div>
