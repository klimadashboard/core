<script>
	export let data;
</script>

<div
	class="reg-card flex flex-col p-4"
	style="background: {data.colorBackground}; color: {data.colorText}"
>
	<h3 class="font-bold uppercase">{data.title}</h3>

	<p class="text-6xl font-light mt-auto">{data.number}</p>
	<p class="text-lg">{data.unit} {data.subtitle}</p>
	<ul class="mt-2">
		{#if data.list}
			{#each data.list as item}
				<li class="border-t py-1">{item.text}</li>
			{/each}
		{/if}
	</ul>
	<p class="text-sm opacity-80">
		{data.source}
	</p>
</div>
