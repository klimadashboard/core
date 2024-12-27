<script>
	export let data;
</script>

<div class="">
	<ul class="m-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
		{#each data.charts as chart}
			<li class="border p-4">
				<a href="/charts/{chart.id}">{chart.translations[0].title}</a>
			</li>
		{/each}
	</ul>
</div>
