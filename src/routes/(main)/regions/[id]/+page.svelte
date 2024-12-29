<script>
	/** @type {import('./$types').PageData} */
	import { onMount } from 'svelte';
	import Chart from '$lib/components/charts/index.svelte';
	export let data;

	onMount(() => {
		localStorage.setItem('kd_region_id', data.page.id);
		localStorage.setItem('kd_region_name', data.page.name);
	});
</script>

<main class="py-32">
	<div class="container">
		<h1 class="text-4xl">
			Die Klimakrise in <span class="bg-agriculture text-white px-2 py-1 font-bold"
				>{data.page.name}</span
			>
		</h1>

		<section class="my-8">
			<h2 class="uppercase opacity-70 font-bold tracking-wide text-sm">Auf einen Blick</h2>
			<div class="grid md:grid-cols-3 gap-4 mt-2">
				<div class="bg-gray-50 p-4 rounded flex gap-4">
					<p class="font-light text-6xl">35%</p>
					<p class="text-lg leading-tight">eine erste Statistik, <br />live aus der Region</p>
				</div>
				<div class="bg-gray-50 p-4 rounded flex gap-4">
					<p class="font-light text-6xl">14</p>
					<p class="text-lg leading-tight">Hitzetage bisher in diesem Jahr</p>
				</div>
				<div class="bg-gray-50 p-4 rounded flex gap-4">
					<p class="font-light text-6xl">70%</p>
					<p class="text-lg leading-tight">der Wege im Bezirk werden mit dem Auto zurückgelegt</p>
				</div>
			</div>
		</section>

		<section class="my-8">
			<Chart
				chart={{
					type: 'custom',
					custom_sveltestring: 'temperature'
				}}
			/>
		</section>
	</div>
</main>
