<script>
	import { page } from '$app/stores';

	export let data;

	const shareData = {
		title: data.heading,
		text: data.intro,
		url: $page.url
	};
</script>

<section
	id="page-header"
	class="bg-gradient-green shadow-inner text-white pt-14 pb-4 mb-8 relative"
	style={data.cover_styles}
>
	{#if data.cover_background}
		<img
			src="https://klimadashboard.org/@/file/{data.cover_background.replace('- file://', '')}"
			class="object-cover absolute inset-0 w-full h-full"
			alt=""
		/>
	{/if}
	<div class="container z-10 relative">
		<div class="max-w-2xl break-words">
			{#if data.eyebrow}
				<div class="flex gap-2">
					<span class="uppercase font-semibold tracking-wider">{data.eyebrow}</span>
					<button
						id="share"
						on:mousedown={() => navigator.share(shareData)}
						aria-label="Seite teilen"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-share"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<circle cx="6" cy="12" r="3" />
							<circle cx="18" cy="6" r="3" />
							<circle cx="18" cy="18" r="3" />
							<line x1="8.7" y1="10.7" x2="15.3" y2="7.3" />
							<line x1="8.7" y1="13.3" x2="15.3" y2="16.7" />
						</svg>
					</button>
				</div>
			{/if}
			<h1 class="text-4xl sm:text-5xl tracking-tight my-2">{data.heading}</h1>
			<div class="text-xl mt-4 page-intro">
				{@html data.intro}
			</div>
		</div>
	</div>
</section>

<style>
	:global(.page-intro ul) {
		@apply list-disc pl-6;
	}

	:global(.page-intro p, .page-intro ul) {
		@apply my-1;
	}
</style>
