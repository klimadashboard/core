<script>
	export let data;
</script>

<div class="grid grid-cols-7 gap-2">
	{#each data as day}
		<div class="w-4 h-4 {day.renewable_share > 99 ? 'bg-green-600' : 'bg-energy'}" />
	{/each}
</div>
