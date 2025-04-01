<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Map from './Map.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Inspector from './Inspector.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let minPeriod;
	let maxPeriod;

	$: getData = async () => {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('mobility_cars', {
				fields: ['*'],
				limit: -1
			})
		);
		const regions = await directus.request(
			readItems('regions', {
				filter: {
					_and: [
						{ country: { _eq: PUBLIC_VERSION.toUpperCase() } },
						{ layer: { _neq: 'municipality' } }
					]
				},
				limit: -1
			})
		);
		console.log(data);
		console.log(regions);
		const regionsWithData = regions.map((region) => {
			const regionData = data.filter((d) => d.region === region.code);
			const periods = [
				...new Set(regionData.map((d) => d.period).sort((a, b) => parseInt(a) - parseInt(b)))
			];
			const carsPer1000Inhabitants = periods.map((p) => {
				return {
					period: parseInt(p),
					value: Math.round(
						(regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value /
							region.population) *
							1000
					)
				};
			});
			const carsElectricShare = periods.map((p) => {
				return {
					period: parseInt(p),
					value:
						(regionData.find((d) => d.category === 'Elektro' && d.period === p)?.value /
							regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value) *
						100
				};
			});
			return { ...region, carsPer1000Inhabitants, carsElectricShare };
		});
		console.log(regionsWithData);
		minPeriod = Math.min(...data.map((d) => parseInt(d.period)));
		maxPeriod = Math.max(...data.map((d) => parseInt(d.period)));
		return { data, regions: regionsWithData, minPeriod, maxPeriod };
	};

	$: promise = getData();

	let views = [
		{
			label: 'Autodichte',
			key: 'pop'
		},
		{
			label: 'E-Auto Anteil',
			key: 'electric'
		}
	];

	$: selectedView = views[1].key;

	$: selectedRegion = null;
	$: selectedPeriod = maxPeriod;
</script>

<div>
	<div class="flex">
		<input type="range" min={minPeriod} max={maxPeriod} bind:value={selectedPeriod} />
		<span>{selectedPeriod}</span>
	</div>
	<Switch
		type="primary"
		{views}
		bind:activeView={selectedView}
		on:itemClick={(event) => {
			selectedView = event.detail;
		}}
	/>
	{#await promise then p}
		{@const data = p.data}
		{@const regions = p.regions}
		<div class="grid md:grid-cols-2 h-[60vh]">
			<Map
				{selectedPeriod}
				regions={regions.map((d) => {
					return {
						code: d.code,
						outline: d.outline,
						data: selectedView == 'electric' ? d.carsElectricShare : d.carsPer1000Inhabitants
					};
				})}
				bind:selectedRegion
				on:selectRegion={(e) => (selectedRegion = e.detail)}
			/>

			<Inspector {selectedPeriod} {data} {regions} bind:selectedRegion />
		</div>
	{/await}
</div>
