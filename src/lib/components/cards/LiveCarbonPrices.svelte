<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from '$lib/components/SmallLine.svelte';

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const etsPrice = await directus.request(
			readItems('carbon_prices', {
				filter: { type: { _eq: 'ETS' } },
				sort: ['-date'],
				limit: 365
			})
		);

		const nationalPrice = await directus.request(
			readItems('carbon_prices', {
				filter: { region: { _eq: PUBLIC_VERSION.toUpperCase() } },
				sort: ['-date'],
				limit: 1
			})
		);

		return {
			etsPrice: etsPrice,
			nationalPrice: nationalPrice[0]
		};
	};

	$: promise = getData();
</script>

{#await promise then data}
	<div class="leading-tight">
		<div class="flex justify-between font-bold text-blue-700 border-b border-current pb-1 mb-2">
			<h3>CO2-Preis</h3>
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
				class="w-5 h-5"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2"
				/><path
					d="M15 7.8c-.523 -.502 -1.172 -.8 -1.875 -.8c-1.727 0 -3.125 1.791 -3.125 4s1.398 4 3.125 4c.703 0 1.352 -.298 1.874 -.8"
				/><path d="M9 11h4" /></svg
			>
		</div>
		<div>
			<div class="flex items-end gap-2">
				<p class="text-5xl font-light font-condensed">
					{formatNumber(data.etsPrice[0].value)}<span class="text-2xl font-normal"
						>{data.etsPrice[0].unit}</span
					>
				</p>
				<div class="h-8 w-full text-blue-700">
					<SmallLine
						data={data.etsPrice
							.slice()
							.sort((a, b) => new Date(a.date) - new Date(b.date))
							.map((item, i) => ({
								x: i,
								y: item.value
							}))}
					/>
				</div>
			</div>
			<p>Preis im europäischen Emissionshandel</p>
			<p>{dayjs(data.etsPrice[0].date).format('D.M.YYYY HH:mm')}</p>
		</div>
		<ul class="card-list">
			<li class="">
				<strong>{data.nationalPrice.value}{data.nationalPrice.unit}</strong> CO2-Preis in {PUBLIC_VERSION}
				seit {dayjs(data.nationalPrice.date).format('D.M.YYYY')}
			</li>
		</ul>
	</div>
{:catch error}
	<p>Error: {error}</p>
{/await}
