<script>
	export let selectedFeature;
	$: console.log(selectedFeature);
</script>

<div class="bg-white dark:bg-dark-800 rounded-2xl p-3 -mt-8 relative z-50 max-w-3xl mx-auto shadow">
	<h2>Inspector</h2>
	{#if selectedFeature}
		<div></div>
	{/if}
</div>
