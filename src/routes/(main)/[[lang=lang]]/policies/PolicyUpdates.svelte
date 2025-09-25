<script>
	import dayjs from 'dayjs';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';

	dayjs.locale('de');

	export let updates;
</script>

<Splide
	class="mb-4"
	options={{
		autoWidth: true,
		autoHeight: true,
		trimSpace: true,
		omitEnd: true,
		arrows: false
	}}
>
	{#each updates.sort((a, b) => dayjs(a.date).diff(dayjs(b.date))) as update}
		<SplideSlide>
			<div class="border-t-2 w-[80vh] max-w-sm pt-2 pr-4">
				<p class="text-sm opacity-80 font-bold">{dayjs(update.date).format('DD.MM.YYYY')}</p>
				<h2 class="text-2xl">{update.title}</h2>
				<div class="text-lg text">{@html update.text}</div>
			</div>
		</SplideSlide>
	{/each}
</Splide>
