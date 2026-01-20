<script>
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { onMount } from 'svelte';

	let dataGoals;
	let dataProduction = {};

	// Smooth data to monthly if more frequent data is available
	function smoothToMonthly(data) {
		if (!data || data.length < 2) return data;

		const intervals = [];
		for (let i = 1; i < Math.min(data.length, 10); i++) {
			const diffDays = (data[i].x - data[i - 1].x) / (1000 * 60 * 60 * 24);
			intervals.push(diffDays);
		}
		const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

		if (avgInterval >= 25) return data;

		const monthlyData = new Map();
		data.forEach((d) => {
			const key = `${d.x.getFullYear()}-${String(d.x.getMonth() + 1).padStart(2, '0')}`;
			if (!monthlyData.has(key)) {
				monthlyData.set(key, { values: [], date: new Date(d.x.getFullYear(), d.x.getMonth(), 15) });
			}
			monthlyData.get(key).values.push(d.y);
		});

		return Array.from(monthlyData.entries())
			.map(([, { values, date }]) => ({
				x: date,
				y: values.reduce((a, b) => a + b, 0) / values.length
			}))
			.sort((a, b) => a.x - b.x);
	}

	onMount(async () => {
		try {
			const directus = getDirectusInstance(fetch);

			// Fetch goals and production data in parallel
			const [goals, production] = await Promise.all([
				directus.request(
					readItems('erneuerbare_2030_scenarios', {
						filter: { Country: { _eq: PUBLIC_VERSION.toUpperCase() } },
						limit: -1
					})
				),
				directus.request(
					readItems('ee_produktion', {
						filter: {
							Country: { _eq: PUBLIC_VERSION.toUpperCase() },
							Jahresproduktion: { _nnull: true }
						},
						limit: -1,
						sort: ['DateTime']
					})
				)
			]);

			dataGoals = goals;

			// Group production data by type and apply smoothing
			const grouped = {};
			production.forEach((entry) => {
				const type = entry.Type;
				if (!grouped[type]) grouped[type] = [];
				grouped[type].push({
					x: new Date(entry.DateTime.slice(0, 10)),
					y: entry.Jahresproduktion
				});
			});

			// Apply smoothing to each type
			for (const type in grouped) {
				dataProduction[type] = smoothToMonthly(grouped[type]);
			}
			dataProduction = dataProduction; // trigger reactivity
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	});

	const energyTypes = [
		{
			key: 'Wind',
			label: 'Windenergie',
			dataKey: 'windkraft',
			color: '#4C8EB3',
			colorScale: ['#4C8EB3', '#B8D2E0'],
			regions: ['at', 'de'],
			icon: "<svg width='17' height='20' viewBox='0 0 17 20' fill='none' xmlns='http://www.w3.org/2000/svg' class='w-8 h-8'><path d='M7 10C7 12.76 9.01 13 11.5 13C13.99 13 16 12.76 16 10H7Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M6.5 10.0475C8.89023 8.6675 8.245 6.6564 7 4.5C5.755 2.3436 4.39023 0.873272 2 2.25327L6.5 10.0475Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.67072 10.2533C5.28049 8.87327 3.745 10.3436 2.5 12.5C1.255 14.6564 0.780485 16.6675 3.17072 18.0475L7.67072 10.2533Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'PV',
			label: 'Photovoltaik',
			dataKey: 'pv',
			color: '#E0A906',
			colorScale: ['#E0A906', '#E8CD7D'],
			regions: ['at', 'de'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-sun' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><circle cx='12' cy='12' r='4'></circle><path d='M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7'></path></svg>"
		},
		{
			key: 'Wasserkraft',
			label: 'Wasserkraft',
			dataKey: 'wasserkraft',
			color: '#08519C',
			colorScale: ['#08519C', '#7098C2'],
			regions: ['at'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-ripple' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M3 7c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 17c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 12c3 -2 6 -2 9 0s6 2 9 0'></path></svg>"
		},
		{
			key: 'Biomasse',
			label: 'Biomasse',
			dataKey: 'biomasse',
			color: '#00441B',
			colorScale: ['#00441B', '#66997A'],
			regions: ['at'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-growth' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M16.5 15a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m-4 3.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m0 -7.5v6'></path></svg>"
		}
	];

	let unifiedScaling = false;
</script>

<section>
	<label class="flex gap-1 text-sm items-center">
		<input type="checkbox" bind:checked={unifiedScaling} />
		<span>Einheitliche Skalierung?</span>
	</label>
	{#if dataGoals && Object.keys(dataProduction).length > 0}
		<div class="grid md:grid-cols-2 gap-1 my-4">
			{#each energyTypes.filter((d) => d.regions.indexOf(PUBLIC_VERSION) > -1 && dataProduction[d.dataKey]) as type}
				<Chart
					{type}
					{unifiedScaling}
					dataGoals={dataGoals.filter((d) => d.energy_type === type.dataKey)}
					dataProduction={dataProduction[type.dataKey]}
					maxX={PUBLIC_VERSION == 'at' ? '2031-04-01' : '2041-12-31'}
					maxY={47}
				/>
			{/each}
		</div>
	{/if}
</section>
