<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import { page } from '$app/state';
	console.log(page.data);
</script>

<section id="projects" class="my-4">
	<Splide
		hasTrack={false}
		options={{
			type: 'slide',
			perPage: 2,
			gap: '0.25rem',
			autoplay: true,
			perMove: 1,
			rewind: true
		}}
	>
		<div class="splide__arrows text-3xl mb-2 font-light">
			<button class="splide__arrow splide__arrow--prev">&#8249;</button>
			<button class="splide__arrow splide__arrow--next">&#8250;</button>
		</div>
		<SplideTrack>
			{#each page.data.projects as project}
				<SplideSlide>
					<div class="p-4 bg-[#313B72] rounded-2xl text-white">
						<p
							class="bg-white inline-block rounded-full text-sm font-bold uppercase tracking-wide text-[#313B72] py-0.5 px-2"
						>
							{page.data.translations[project.status] || project.status}
						</p>
						<h3 class="text-2xl mt-2 font-bold leading-[1.1em]">{project.title}</h3>
						<p class="text-base leading-snug mt-1">{project.summary}</p>
					</div>
				</SplideSlide>
			{/each}
		</SplideTrack>
	</Splide>
</section>
