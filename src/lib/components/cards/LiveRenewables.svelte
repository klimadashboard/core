<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const renewableShareDaily = await directus.request(
			readItems('renewable_share_daily', {
				filter: { country: { _eq: PUBLIC_VERSION.toUpperCase() } },
				sort: ['-date'],
				limit: 365
			})
		);

		const renewableShareNow = await directus.request(
			readItems('renewable_share_15min', {
				filter: { country: { _eq: PUBLIC_VERSION.toUpperCase() } }
			})
		);

		// Helper function to calculate average
		const calculateAverage = (filteredData) => {
			if (filteredData.length === 0) return 0; // Avoid division by zero
			const total = filteredData.reduce((sum, item) => sum + item.share, 0);
			return total / filteredData.length;
		};

		// Get the current time
		const now = dayjs();

		// Find the item with the date closest to the current time
		const closestRenewableShareNow = renewableShareNow.reduce((closest, item) => {
			const itemDate = dayjs(item.date);
			const closestDate = dayjs(closest.date);

			// Compare the absolute difference between dates
			return Math.abs(itemDate.diff(now)) < Math.abs(closestDate.diff(now)) ? item : closest;
		});

		// Filter data for the last 30 days
		const last30DaysData = renewableShareDaily.filter((item) => {
			const itemDate = dayjs(item.date);
			return itemDate.isAfter(now.subtract(30, 'days'));
		});

		// Filter data for the last 365 days
		const last365DaysData = renewableShareDaily.filter((item) => {
			const itemDate = dayjs(item.date);
			return itemDate.isAfter(now.subtract(365, 'days'));
		});

		return {
			renewableShareNow: closestRenewableShareNow,
			renewableShareLast30Days: calculateAverage(last30DaysData),
			renewableShareLast365Days: calculateAverage(last365DaysData)
		};
	};

	$: promise = getData();
</script>

{#await promise then data}
	<div class="leading-tight font-condensed">
		<div class="flex justify-between font-bold text-orange-600 border-b border-current pb-1 mb-2">
			<h3>Erneuerbare Energien</h3>
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
					d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
				/></svg
			>
		</div>
		<div>
			<p class="text-5xl font-light font-condensed">
				{formatNumber(data.renewableShareNow.share)}<span class="text-2xl font-normal">%</span>
			</p>
			<p>
				aktueller Anteil am Gesamtstromverbrauch <span class="opacity-70"
					>{dayjs(data.renewableShareNow.date).format('D.M.YYYY HH:mm')}</span
				>
			</p>
			<p />
		</div>
		<ul class="card-list">
			<li>
				<strong>{formatNumber(data.renewableShareLast30Days)}%</strong>
				in den letzten 30 Tagen
			</li>
			<li>
				<strong>{formatNumber(data.renewableShareLast365Days)}%</strong>
				in den letzten 365 Tagen
			</li>
			<li>
				<strong>XX%</strong> Ziel bis 2030
			</li>
		</ul>
	</div>
{:catch error}
	<p>Error: {error}</p>
{/await}
