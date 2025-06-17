<script>
	import dayjs from 'dayjs';
	import duration from 'dayjs/plugin/duration';
	import relativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(duration);
	dayjs.extend(relativeTime);

	let interval;
	const launchDate = dayjs('2025-06-18T11:55:00');
	let countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

	const updateCountdown = () => {
		const now = dayjs();
		const diff = launchDate.diff(now);
		const dur = dayjs.duration(diff);

		countdown = {
			days: dur.days(),
			hours: dur.hours(),
			minutes: dur.minutes(),
			seconds: dur.seconds()
		};
	};

	updateCountdown();

	interval = setInterval(() => {
		updateCountdown();
	}, 1000);

	import { onDestroy } from 'svelte';
	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="rounded-2xl p-3 bg-red-700 text-white">
	<h2 class="font-bold border-b">Die Klimakrise in deiner Region</h2>

	<div
		class="flex justify-between xl:justify-center xl:gap-6 bg-white dark:bg-gray-950 text-red-700 rounded-xl p-4 my-2"
	>
		<div class="flex flex-col items-center">
			<div class="text-6xl font-light">{countdown.days}</div>
			<div class="text-sm uppercase tracking-wide mt-1 font-bold">Tage</div>
		</div>
		<div class="flex flex-col items-center">
			<div class="text-6xl font-light">{countdown.hours}</div>
			<div class="text-sm uppercase tracking-wide mt-1 font-bold">Stunden</div>
		</div>
		<div class="flex flex-col items-center">
			<div class="text-6xl font-light">{countdown.minutes}</div>
			<div class="text-sm uppercase tracking-wide mt-1 font-bold">Minuten</div>
		</div>
		<div class="flex flex-col items-center">
			<div class="text-6xl font-light">{countdown.seconds}</div>
			<div class="text-sm uppercase tracking-wide mt-1 font-bold">Sekunden</div>
		</div>
	</div>

	<p class="leading-tight">
		Klima, Energie, Mobilität bei dir vor Ort. Auf den regionalen Klimadashboards. Ab 18. Juni 2025.
	</p>
</div>
