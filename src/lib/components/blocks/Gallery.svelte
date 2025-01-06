<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	export let block;
	console.log(block);
</script>

<Splide
	class="m-4"
	options={{
		autoWidth: true,
		autoHeight: true,
		gap: '1rem',
		trimSpace: true,
		omitEnd: true,
		type: 'loop',
		pagination: false
	}}
	hasTrack={false}
>
	<div class="flex border-b items-end pb-1">
		<h3 class="uppercase font-bold tracking-wide">{block.title}</h3>
		<div class="flex ml-auto splide__arrows">
			<button class="splide__arrow splide__arrow--prev"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg
				></button
			>
			<button class="splide__arrow splide__arrow--next"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg
				></button
			>
		</div>
	</div>
	<div class="mt-4">
		<SplideTrack>
			{#each block.files as item}
				{@const file = item.directus_files_id}
				<SplideSlide>
					<a class="block relative" href={file.link}>
						<img
							src="https://base.klimadashboard.org/assets/{file.id}?key=large"
							class="h-64 sm:h-80 md:h-[60vh] w-auto"
							alt={file.alt}
						/>
						{#if file.title || file.description || file.copyright}
							<div class="absolute bg-white p-3 bottom-3 left-3 max-w-[80%]">
								{#if file.title}
									<p class="font-bold">{file.title}</p>
								{/if}
								{#if file.description}
									<p>{file.description}</p>
								{/if}
								{#if file.copyright}
									<p class="text-sm text-gray-700">&copy; {file.copyright}</p>
								{/if}
							</div>
						{/if}
					</a>
				</SplideSlide>
			{/each}
		</SplideTrack>
	</div>
</Splide>
