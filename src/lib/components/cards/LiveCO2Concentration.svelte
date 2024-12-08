<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from '$lib/components/SmallLine.svelte';

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const co2Concentration = await directus.request(
			readItems('global_co2_concentration', {
				sort: ['year']
			})
		);

		return co2Concentration;
	};

	$: promise = getData();
</script>

{#await promise then data}
	<div class="leading-tight">
		<div class="flex justify-between font-bold text-budgetDark border-b border-current pb-2 mb-2">
			<h3>CO2-Konzentration & Erderhitzung</h3>
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
				class="icon icon-tabler icons-tabler-outline icon-tabler-brand-speedtest"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M5.636 19.364a9 9 0 1 1 12.728 0"
				/><path d="M16 9l-4 4" /></svg
			>
		</div>
		<div>
			<div class="flex items-end gap-2">
				<p class="text-4xl font-light font-condensed">
					{formatNumber(Math.round(data[data.length - 1].mean))}<span class="text-2xl font-normal"
						>ppm</span
					>
				</p>
				<div class="h-8 w-full text-budgetDark">
					<SmallLine
						data={data.map((item) => {
							return {
								x: item.year,
								y: item.mean
							};
						})}
					/>
				</div>
			</div>
			<p>im Jahr {data[data.length - 1].year}</p>
			<ul class="card-list">
				<li class="">
					<strong>+1,2°C</strong> Erderhitzung im langjährigen Mittel gegenüber 1850
				</li>
				<li class="">
					<strong>+1,5°C</strong> Globales Temperaturmittel im Jahr 2024 gegenüber 1850
				</li>
			</ul>
		</div>
	</div>
{:catch error}
	<p>Error: {error}</p>
{/await}
