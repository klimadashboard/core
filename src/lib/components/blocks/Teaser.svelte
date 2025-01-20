<script>
	import News from '$lib/components/cards/News.svelte';

	export let block;

	let secondaryItems = ['', '', '', ''];
</script>

<div class="p-1 grid grid-cols-1 lg:grid-cols-4 gap-1">
	<a
		href="#"
		class="bg-gray-100 lg:col-span-2 relative overflow-hidden min-h-[50vh] group rounded-2xl"
	>
		<img
			class="inset-0 w-full h-full object-cover object-center absolute group-hover:scale-105 transition duration-500"
			src="https://images.unsplash.com/photo-1581626221838-9715c0e06049?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
			alt=""
		/>
		<div
			class="bg-gradient-to-b from-transparent to-black opacity-90 absolute h-2/3 w-full bottom-0"
		/>
		<div class="absolute p-4 text-white uppercase font-bold tracking-wider">Unternehmen</div>

		<div class="p-4 absolute bottom-0 text-white max-w-xl text-balance">
			<h3 class="font-bold text-3xl lg:text-4xl leading-tight mb-2">
				Wie viele Emissionen stoßen Österreichs Unternehmen aus?
			</h3>
			<p class="text-lg leading-snug">
				Neue Recherchen des Klimadashboards zeigen Emissionen der OMV, UNIQA und vielen mehr.
			</p>
		</div>
	</a>
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-1">
		{#each secondaryItems as item}
			<a href={item.link} class="border-b p-3">
				<p class="uppercase font-bold tracking-wide">{item.eyebrow}</p>
				<p class="text-2xl">{item.title}</p>
			</a>
		{/each}
	</div>
	<div class="p-4 border rounded-2xl">
		<News />
	</div>
</div>
