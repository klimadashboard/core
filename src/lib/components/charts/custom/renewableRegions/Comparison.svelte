<script>
	export let selectedRegion; // this is a region code
	export let data;
	export let regions;

	// get https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_solar_units&region={selectedRegion}
</script>

<div class="h-4 w-full bg-amber-100 bg-opacity/10 relative rounded-full">
	<div class="h-6 w-6 bg-amber-500 rounded-full absolute left-1/3" />
	<div class="h-6 w-6 bg-amber-500 rounded-full absolute left-2/3" />
</div>
