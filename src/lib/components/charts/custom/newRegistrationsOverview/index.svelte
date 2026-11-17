<!--
	Neuzulassungen: one card with a menu Pkw / Lkw / Busse (large icon tiles), so the page does not need three long charts.
	Only the selected explorer is mounted (and loads its data).
	- Pkw:   newCarRegistrationsExplorer   (collection `new_car_registrations`)
	- Lkw:   newTruckRegistrationsExplorer (collection `new_vehicle_registrations`, mode "truck")
	- Busse: newTruckRegistrationsExplorer (collection `new_vehicle_registrations`, mode "bus")
	CMS option `{"view": "truck"}` sets the initial view.
-->
<script lang="ts">
	import type { ChartData } from '../../types';
	import type { Region } from '$lib/utils/getRegion';
	import NewCarRegistrations from '../newCarRegistrationsExplorer/index.svelte';
	import NewVehicleRegistrations from '../newTruckRegistrationsExplorer/index.svelte';
	import VehicleIcon from '../newTruckRegistrationsExplorer/TruckIcon.svelte';

	export let chart: any = undefined;
	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	/** optional local rows (preview before the collections exist) */
	export let carRows: any[] | null = null;
	export let vehicleRows: any[] | null = null;

	const VIEWS = [
		{ value: 'car', label: 'Pkw', icon: 'car' },
		{ value: 'truck', label: 'Lkw', icon: 'truck_n3' },
		{ value: 'bus', label: 'Busse', icon: 'bus' }
	] as const;
	let view: string = VIEWS.some((v) => v.value === chart?.options?.view) ? chart.options.view : 'car';
</script>

<div class="flex flex-col gap-4">
	<div role="radiogroup" aria-label="Fahrzeugart" class="grid grid-cols-3 gap-2 sm:gap-3">
		{#each VIEWS as v (v.value)}
			{@const active = v.value === view}
			<button
				type="button"
				role="radio"
				aria-checked={active}
				on:click={() => (view = v.value)}
				class="flex flex-col items-center justify-end gap-2 rounded-xl border-2 px-2 py-3 sm:py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
					{active
					? 'border-gray-900 bg-gray-50 text-gray-900 dark:border-white dark:bg-gray-800 dark:text-white'
					: 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-white'}"
			>
				<span class="flex h-12 items-end"><VehicleIcon type={v.icon} size={44} /></span>
				<span class="text-base font-semibold">{v.label}</span>
			</button>
		{/each}
	</div>

	{#key view}
		{#if view === 'car'}
			<NewCarRegistrations {chart} {region} {onChartData} rows={carRows} />
		{:else}
			<NewVehicleRegistrations
				{chart}
				{region}
				{onChartData}
				rows={vehicleRows}
				mode={view === 'bus' ? 'bus' : 'truck'}
			/>
		{/if}
	{/key}
</div>
