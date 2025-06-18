<script>
	import formatNumber from '$lib/stores/formatNumber';
	export let data;
</script>

<div
	class="reg-card flex flex-col p-4 relative"
	style="background: {data.colorBackground}; color: {data.colorText}"
>
	<h3 class="font-bold uppercase">{data.title}</h3>

	<p class="text-6xl font-light mt-auto">
		{formatNumber(parseFloat(data.number))} <span class="text-2xl font-normal">{data.unit}</span>
	</p>
	<p class="text-lg">{data.subtitle.replace('(undefined)', '')}</p>
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
			src="https://base.klimadashboard.org/assets/177f2233-3658-4616-b6af-cce005996ff0"
			class="absolute right-0 top-0 left-0 bottom-0 object-cover opacity-20 mix-blend-overlay"
			alt=""
		/>
	{:else if data.title == 'Hitzetage'}
		<img
			src="https://base.klimadashboard.org/assets/9cffb1fd-93cc-410c-aff2-915abe603f53"
			class="absolute right-0 left-0 -top-32 bottom-0 w-full h-[140%] object-cover opacity-40 mix-blend-overlay"
			alt=""
		/>
	{:else if data.title == 'Sommertage'}
		<img
			src="https://base.klimadashboard.org/assets/4604aa49-75f1-420c-9456-135ddb98ddc8?key=medium"
			class="absolute right-0 left-0 top-0 bottom-0 object-cover opacity-20 mix-blend-overlay z-0"
			alt=""
		/>
	{:else if data.title == 'Frosttage'}
		<img
			src="https://base.klimadashboard.org/assets/5e9f03e0-c775-452d-b691-8801e616749e"
			class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay z-0"
			alt=""
		/>
	{:else if data.title == 'Autos je 1.000 Einwohner:innen'}
		<img
			src="https://base.klimadashboard.org/assets/5abed827-5533-48bc-b17c-6879a36514dc"
			class="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay z-0"
			alt=""
		/>
	{/if}
</div>
