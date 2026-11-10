<script>
	import dayjs from 'dayjs';

	export let updates;

	$: sorted = [...updates].sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
</script>

<section class="mb-8">
	<h2 class="text-xl font-bold mb-4">Updates</h2>
	<ol class="relative border-l border-current/20 space-y-6 ml-2 max-w-2xl">
		{#each sorted as update}
			<li class="pl-4">
				<span class="absolute -left-[3px] mt-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
				<p class="text-sm opacity-60 font-medium mb-0.5">
					{dayjs(update.date).format('DD.MM.YYYY')}
				</p>
				<h3 class="text-lg font-bold leading-snug">{update.title}</h3>
				{#if update.text}
					<div class="text mt-1 opacity-80">{@html update.text}</div>
				{/if}
			</li>
		{/each}
	</ol>
</section>
