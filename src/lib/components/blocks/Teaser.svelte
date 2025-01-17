<script>
	import News from '$lib/components/cards/News.svelte';

	export let block;
</script>

<div class="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 font-display">
	<a href="#" class="bg-gray-100 lg:col-span-2 relative overflow-hidden min-h-[50vh] group">
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
		<a href="#" class="flex flex-col lg:flex-row lg:items-center gap-4">
			<img
				class="max-w-40"
				src="https://images.unsplash.com/photo-1491864483946-1f06be97b71d?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt=""
			/>
			<div class="">
				<p class="uppercase font-bold tracking-wider text-sm">Schnee</p>
				<h3 class="mt-auto text-xl leading-tight">
					Wann gab’s eigentlich zuletzt weiße Weihnachten?
				</h3>
			</div>
		</a>

		<a href="#" class="flex flex-col lg:flex-row lg:items-center gap-4">
			<img
				class="max-w-40"
				src="https://images.unsplash.com/photo-1491864483946-1f06be97b71d?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt=""
			/>
			<div class="">
				<p class="uppercase font-bold tracking-wider text-sm">Erneuerbare Energien</p>
				<h3 class="mt-auto text-xl leading-tight">Sind die Bundesländer auf Kurs?</h3>
			</div>
		</a>

		<a href="#" class="flex flex-col lg:flex-row lg:items-center gap-4">
			<img
				class="max-w-40"
				src="https://images.unsplash.com/photo-1491864483946-1f06be97b71d?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt=""
			/>
			<div class="">
				<p class="uppercase font-bold tracking-wider text-sm">Erneuerbare Energien</p>
				<h3 class="mt-auto text-xl leading-tight">Sind die Bundesländer auf Kurs?</h3>
			</div>
		</a>

		<a href="#" class="flex flex-col lg:flex-row lg:items-center gap-4">
			<img
				class="max-w-40"
				src="https://images.unsplash.com/photo-1491864483946-1f06be97b71d?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt=""
			/>
			<div class="">
				<p class="uppercase font-bold tracking-wider text-sm">Erneuerbare Energien</p>
				<h3 class="mt-auto text-xl leading-tight">Sind die Bundesländer auf Kurs?</h3>
			</div>
		</a>
	</div>
	<div class="p-4 border">
		<News />
	</div>
</div>
