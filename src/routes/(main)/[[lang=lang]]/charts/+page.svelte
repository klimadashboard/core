<script>
	export let data;
</script>

<div class="my-8 container">
	<ul class="grid grid-cols-2 md:grid-cols-4 gap-1">
		{#each data.charts as chart}
			<li class="p-3 rounded-2xl bg-gray-500/20">
				<a href="/charts/{chart.id}">{chart.translations[0].title}</a>
			</li>
		{/each}
	</ul>
</div>
