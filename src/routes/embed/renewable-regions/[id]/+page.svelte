<script>
	import Inspector from '$lib/components/charts/custom/renewableRegions/Inspector.svelte';
	import { page } from '$app/state';

	let selectedEnergy = page.url.searchParams.get('energy') || 'solar';
	const colors = [
		{ key: 'solar', colors: ['#F0E1C2', '#E0A906'] },
		{ key: 'wind', colors: ['#E5F3FA', '#003B80'] }
	];
	let data;
</script>

<Inspector
	region={page.data.region}
	regions={page.data.regions}
	{selectedEnergy}
	colors={colors.find((c) => c.key === selectedEnergy).colors}
/>
