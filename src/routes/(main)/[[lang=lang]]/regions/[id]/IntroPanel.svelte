<script>
	export let data;
</script>

<div
	class="reg-card flex flex-col p-4 relative"
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

	{#if data.title == 'Eistage'}
		<img
			src="https://base.klimadashboard.org/assets/4dc04fc5-069d-4831-9738-4717ddcc6538?key=medium"
			class="absolute right-0 top-0 left-0 bottom-0 object-cover opacity-20 mix-blend-overlay"
			alt=""
		/>
	{:else if data.title == 'Hitzetage'}
		<img
			src="https://base.klimadashboard.org/assets/879fb8e5-3e8f-4110-a5f6-b4b3b76a26a2?key=medium"
			class="absolute right-0 left-0 -top-32 bottom-0 w-full h-[140%] object-cover opacity-40 mix-blend-overlay"
			alt=""
		/>
	{:else if data.title == 'Sommertage'}
		<img
			src="https://base.klimadashboard.org/assets/4604aa49-75f1-420c-9456-135ddb98ddc8?key=medium"
			class="absolute right-0 left-0 top-0 bottom-0 object-cover opacity-50 mix-blend-difference z-0"
			alt=""
		/>
	{:else if data.title == 'Frosttage'}
		<img
			src="https://base.klimadashboard.org/assets/aed3240d-e8cd-4229-bfc3-ef0fa554c4c0?key=medium"
			class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-difference z-0"
			alt=""
		/>
	{/if}
</div>
