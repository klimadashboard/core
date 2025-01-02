<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import SmallLine from '$lib/components/SmallLine.svelte';
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('energy', {
				filter: { region: { _eq: PUBLIC_VERSION } },
				sort: ['period'],
				limit: -1
			})
		);

		const lastDatapoint = data[data.length - 1];
		const compareDatapoint = data.find(
			(d) => d.period == dayjs(lastDatapoint.period).subtract(1, 'year').format('YYYY-MM-DD')
		);
		const dataThisYear = data.filter(
			(d) => dayjs(d.period).year() == dayjs(lastDatapoint.period).year()
		);
		const dataLastYear = data.filter(
			(d) => dayjs(d.period).year() == dayjs(compareDatapoint.period).year()
		);

		return {
			data: data,
			lastDatapoint: lastDatapoint,
			compareDatapoint: compareDatapoint,
			dataThisYear: dataThisYear,
			dataLastYear: dataLastYear
		};
	};

	$: promise = getData();
</script>

{#await promise then data}
	<div class="leading-tight font-condensed">
		<div class="flex justify-between font-bold text-blue-600 border-b border-current pb-1 mb-2">
			<h3>Gas-Verbrauch</h3>
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
					d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"
				/></svg
			>
		</div>
		<div>
			<div class="flex items-end gap-2">
				<p class="text-5xl font-light font-condensed">
					{formatNumber(data.lastDatapoint.value)}<span class="text-2xl font-normal"
						>{data.lastDatapoint.unit}</span
					>
				</p>
				<div class="h-8 w-full text-blue-500">
					<SmallLine
						data={data.dataThisYear.map((item, i) => {
							return {
								x: i,
								y: item.value
							};
						})}
						dataComparison={data.dataLastYear.map((item, i) => {
							return {
								x: i,
								y: item.value
							};
						})}
						xLabels={['Jan', 'Dez']}
					/>
				</div>
			</div>
			<p>Verbrauch am {dayjs(data.lastDatapoint.period).format('D.M.YYYY')}</p>
		</div>
		<ul class="card-list">
			<li>
				<strong>{formatNumber(data.compareDatapoint.value)} {data.compareDatapoint.unit}</strong>
				Verbrauch am {dayjs(data.compareDatapoint.period).format('D.M.YYYY')}
			</li>
		</ul>
	</div>
{:catch error}
	<p>Error: {error}</p>
{/await}
