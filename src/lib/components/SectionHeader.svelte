<script>
	export let attrs;
</script>

<div class="container pt-4">
	<a
		href={attrs.link ? attrs.link : '#'}
		class="flex gap-2 items-center border-b border-gray-200 py-4 hover:underline underline-offset-2"
	>
		{@html attrs.icon}
		<h2 class="uppercase tracking-wide text-base font-semibold">{attrs.headline}</h2>
		{#if attrs.link}
			<svg
				width="16"
				height="14"
				viewBox="0 0 16 14"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class="w-3"
			>
				<path
					d="M1 7H15"
					stroke="black"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M9 13L15 7"
					stroke="black"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M9 1L15 7"
					stroke="black"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</a>
</div>
