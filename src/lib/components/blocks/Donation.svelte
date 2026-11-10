<script>
	export let block;

	const DONATE_URL = 'https://klimadashboard.org/donate';

	function parseAmount(label) {
		const match = String(label ?? '').match(/(\d+)/);
		return match ? Number(match[1]) : null;
	}

	function donateHref(amount) {
		if (!amount) return DONATE_URL;
		const url = new URL(DONATE_URL);
		url.searchParams.set('amount', String(amount));
		return url.toString();
	}

	$: links = block.links ?? [];
</script>

<div
	class="relative h-full overflow-hidden rounded-3xl border border-current/10 bg-white p-6 shadow-xl md:p-10 dark:bg-gray-900"
>
	<div class="relative mx-auto max-w-lg text-center">
		<p
			class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-green-600/10 px-3 py-1 text-xs font-bold tracking-wide text-green-700 uppercase dark:text-green-400"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-3.5 w-3.5"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
				/></svg
			>
			Gemeinnützig &middot; keine Paywall
		</p>

		<h2 class="text-3xl leading-tight font-bold text-balance md:text-4xl">
			{@html block.title}
		</h2>
		<p class="mt-3 text-lg leading-snug text-balance opacity-80">
			{@html block.text}
		</p>

		<div class="mt-6 flex flex-wrap gap-2 w-max max-w-5/6 justify-center mx-auto">
			{#if links.length}
				{#each links as l}
					{@const amount = parseAmount(l.label)}
					<a
						href={donateHref(amount)}
						class="flex-shrink-0 rounded-full border border-current/15 py-2.5 px-4 font-bold transition-colors hover:border-green-600 hover:bg-green-600 hover:text-white"
					>
						{l.label}
					</a>
				{/each}
			{/if}
		</div>

		<a
			href={DONATE_URL}
			class="mt-5 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700"
		>
			Jetzt spenden
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-5 w-5"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path
					d="M13 18l6 -6"
				/><path d="M13 6l6 6" /></svg
			>
		</a>
	</div>
</div>
