<script>
	export let block;
	/** true inside a block_grid (full-bleed tile layout); false = single tile, shown in the content width */
	export let nested = false;

	$: hasImage = !!block.image;
</script>

<!--
	Teaser tile (CMS block "block_teaser"): eyebrow at the top, title + description at the bottom.
	Text sits in normal flow (flex column), so eyebrow and title never overlap, also on narrow phones;
	the tile grows with its text.
	- with image: image as background behind a dark overlay, white text
	- without image: light gray tile with dark text (dark gray in dark mode)
	An arrow in a circle (bottom right) shows that the whole tile is a link.
-->
{#snippet tile()}
<a
	href={block.link}
	class="group relative flex h-full flex-col justify-between gap-6 overflow-hidden p-3 transition sm:p-4
		{hasImage
		? 'min-h-[14rem] bg-gray-800 text-white hover:opacity-90'
		: 'min-h-[9rem] border border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-800'}
		{nested ? (hasImage ? 'sm:min-h-[40vh]' : '') : 'rounded-2xl'}
		{!nested && hasImage ? 'sm:min-h-[16rem]' : ''}"
>
	{#if hasImage}
		<img
			class="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
			src="https://base.klimadashboard.org/assets/{block.image}?key=medium"
			alt=""
		/>
		<!-- overlay keeps white text readable on any image -->
		<div class="absolute inset-0 bg-black/30" aria-hidden="true"></div>
		<div
			class="absolute bottom-0 h-2/3 w-full bg-linear-to-b from-transparent to-black opacity-90"
			aria-hidden="true"
		></div>
	{/if}

	{#if block.eyebrow}
		<div
			class="relative font-bold leading-tight hyphens-auto {hasImage
				? ''
				: 'text-gray-600 dark:text-gray-300'}"
		>
			{block.eyebrow}
		</div>
	{/if}

	<div class="relative mt-auto flex items-end justify-between gap-4">
		<div class="max-w-xl text-balance">
			<h3 class="mb-2 text-2xl font-bold leading-none hyphens-auto break-words sm:text-3xl lg:text-4xl">
				{@html block.title}
			</h3>
			{#if block.description}
				<div class="text-base leading-snug sm:text-lg {hasImage ? '' : 'text-gray-700 dark:text-gray-300'}">
					{@html block.description}
				</div>
			{/if}
		</div>
		<!-- link cue -->
		<span
			aria-hidden="true"
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1
				{hasImage ? 'bg-white text-gray-900' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'}"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-5 w-5"><path d="M5 12h14" /><path d="M13 18l6-6" /><path d="M13 6l6 6" /></svg
			>
		</span>
	</div>
</a>
{/snippet}

{#if nested}
	{@render tile()}
{:else}
	<div class="container my-6">{@render tile()}</div>
{/if}
