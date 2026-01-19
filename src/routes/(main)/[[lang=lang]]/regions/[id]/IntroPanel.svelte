<script>
	import formatNumber from '$lib/stores/formatNumber';
	export let data;
</script>

<div
	class="reg-card lg:!h-full flex flex-col p-4 relative overflow-hidden"
	style="background: {data.colorBackground}; color: {data.colorText}"
>
	<h3 class="font-bold relative z-10">{data.title}</h3>

	<p class="text-6xl font-light mt-auto relative z-10">
		{formatNumber(parseFloat(data.number))} <span class="text-2xl font-normal">{data.unit}</span>
	</p>
	<p class="text-lg relative z-10 leading-tight">{data.subtitle.replace('(undefined)', '')}</p>
	<ul class="mt-2 relative z-10">
		{#if data.list}
			{#each data.list as item}
				<li class="border-t py-1">{item.text}</li>
			{/each}
		{/if}
	</ul>
	<p class="text-sm opacity-80 relative z-10">
		{data.source}
	</p>

	{#if data.title == 'Eistage'}
		<img
			src="https://base.klimadashboard.org/assets/177f2233-3658-4616-b6af-cce005996ff0"
			class="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay z-0"
			alt=""
		/>
	{:else if data.title == 'Hitzetage'}
		<img
			src="https://base.klimadashboard.org/assets/9cffb1fd-93cc-410c-aff2-915abe603f53"
			class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay z-0"
			alt=""
		/>
	{:else if data.title == 'Sommertage'}
		<img
			src="https://base.klimadashboard.org/assets/4604aa49-75f1-420c-9456-135ddb98ddc8?key=medium"
			class="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay z-0"
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
