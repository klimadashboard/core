<!--
	Combined heating phaseout chart (gas / oil).
	Displays a large number showing the daily heating systems that need to be phased out
	to reach the target year (2040 for gas, 2035 for oil).

	Fuel type is determined by chart.options.fuelType ('gas' | 'oil').
	Data comes from SSR snapshot (config.ts) or client-side Directus query as fallback.
-->
<script>
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const ONE_DAY_MS = 24 * 60 * 60 * 1000;
	const SOURCE = 'mikrozensus-statistik-austria';

	const FUEL_CONFIG = {
		gas: { category: 'gas', targetYear: 2040 },
		oil: { category: 'heating oil', targetYear: 2035 }
	};

	$: fuelType = chart?.options?.fuelType || 'gas';

	let dailyValue = null;

	// Check if SSR snapshot already has the data
	$: if (chart?.snapshot?.raw) {
		const entry = chart.snapshot.raw.find((d) => d.fuel === fuelType);
		if (entry) dailyValue = entry.daily;
		if (onChartData) onChartData(chart.snapshot);
	} else {
		fetchData();
	}

	async function fetchData() {
		try {
			const directus = getDirectusInstance(fetch);

			// Look up AT country region UUID
			const atRegions = await directus.request(
				readItems('regions', {
					filter: { code: { _eq: 'at' }, country: { _eq: 'AT' } },
					fields: ['id'],
					limit: 1
				})
			);
			const atId = atRegions?.[0]?.id;
			if (!atId) return;

			const rows = await directus.request(
				readItems('energy_heating_systems', {
					filter: {
						source: { _eq: SOURCE },
						region: { _eq: atId },
						unit: { _eq: 'absolute' }
					},
					sort: ['period'],
					limit: -1
				})
			);

			if (!rows?.length) return;

			const withYear = rows.map((r) => ({
				...r,
				year: new Date(r.period).getFullYear()
			}));

			const latestYear = Math.max(...withYear.map((d) => d.year));

			const raw = [];
			for (const [fuel, cfg] of Object.entries(FUEL_CONFIG)) {
				const entry = withYear.find((d) => d.year === latestYear && d.category === cfg.category);
				const total = entry?.value ?? 0;
				const startDate = new Date(latestYear, 11, 31);
				const endDate = new Date(cfg.targetYear, 0, 1);
				const diffDays = Math.round(
					Math.abs((endDate.getTime() - startDate.getTime()) / ONE_DAY_MS)
				);
				raw.push({
					fuel,
					daily: diffDays > 0 ? Math.round(total / diffDays) : 0,
					total,
					targetYear: cfg.targetYear
				});
			}

			const entry = raw.find((d) => d.fuel === fuelType);
			if (entry) dailyValue = entry.daily;

			// Build table for Card
			const columns = [
				{ key: 'year', label: 'Jahr', align: 'left' },
				{
					key: 'gas',
					label: 'Gas',
					align: 'right',
					format: (val) => (typeof val === 'number' ? val.toLocaleString('de-AT') : '–')
				},
				{
					key: 'oil',
					label: 'Öl',
					align: 'right',
					format: (val) => (typeof val === 'number' ? val.toLocaleString('de-AT') : '–')
				}
			];

			const years = [...new Set(withYear.map((d) => d.year))].sort((a, b) => a - b);
			const tableRows = years.map((year) => ({
				year,
				gas: withYear.find((d) => d.year === year && d.category === 'gas')?.value ?? null,
				oil:
					withYear.find((d) => d.year === year && d.category === 'heating oil')?.value ?? null
			}));

			if (onChartData) {
				onChartData({
					raw,
					table: { columns, rows: tableRows, filename: 'heizungen_ausstieg' },
					placeholders: {
						gasDaily: String(raw.find((d) => d.fuel === 'gas')?.daily ?? 0),
						oilDaily: String(raw.find((d) => d.fuel === 'oil')?.daily ?? 0),
						dataYear: String(latestYear)
					},
					meta: {
						source: 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
					}
				});
			}
		} catch (err) {
			console.error('heatingPhaseout: failed to fetch data', err);
		}
	}
</script>

<div class="flex flex-col">
	<div class="flex space-x-4 items-end">
		<div class="-mb-1">
			{#if dailyValue !== null}
				<p class="text-8xl font-extralight tracking-tighter">{dailyValue}</p>
			{:else}
				<p class="text-8xl font-extralight tracking-tighter opacity-30">--</p>
			{/if}
			<p class="font-medium -mt-2">{v?.label || ''}</p>
		</div>
	</div>
</div>
