<script>
	export let block;
</script>

<a
	href={block.link}
	class="block bg-gray-800 relative overflow-hidden min-h-[50vh] group h-full hover:opacity-90 transition"
>
	{#if block.image}
		<img
			class="inset-0 w-full h-full object-cover object-center absolute group-hover:scale-105 transition duration-500"
			src="https://base.klimadashboard.org/assets/{block.image}?key=large"
			alt=""
		/>
		<div
			class="bg-linear-to-b from-transparent to-black opacity-90 absolute h-2/3 w-full bottom-0"
		/>
		<div class="bg-linear-to-br from-black to-transparent opacity-20 absolute inset-0" />
	{/if}

	<div class="absolute p-3 text-white font-bold hyphens-auto leading-tight">
		{block.eyebrow}
	</div>

	<div class="p-3 absolute bottom-0 text-white max-w-xl text-balance">
		<h3 class="font-bold text-3xl lg:text-4xl leading-none mb-2">
			{block.title}
		</h3>
		<p class="text-lg leading-snug">
			{block.description}
		</p>
	</div>
</a>
