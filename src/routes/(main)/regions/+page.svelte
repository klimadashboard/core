<script>
	export let data;
</script>

<div class="py-64 container">
	<ul>
		{#each data.regions as region}
			<li>
				<a href="/regions/{region.id}">{region.name}</a>
			</li>
		{/each}
	</ul>
</div>
