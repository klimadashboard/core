<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import ChartGrid from './ChartGrid.svelte';
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import dayjs from 'dayjs';

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('at_energy_renewable_share_daily_average', {
				limit: -1
			})
		);
		return data;
	}

	$: promise = getData();

	let selectedPeriod = 'days';
</script>

{#await promise then data}
	<div class="h-80">
		<select bind:value={selectedPeriod}>
			<option value="days">Tage</option>
			<option value="weeks">Wochen</option>
			<option value="months">Monate</option>
		</select>
		<BarChart
			data={data.map((entry, i) => {
				return {
					label: dayjs(entry.date).format('DD.MM.YY'),
					categories: [
						{
							label: 'Erneuerbare Energie',
							value: entry.renewable_share,
							color: '#7CBAB3'
						}
					]
				};
			})}
			visualisation={'stacked'}
			xAxixInterval={30}
			unit="%"
		/>
	</div>
	<ChartGrid {data} />
{:catch error}
	{error}
{/await}
