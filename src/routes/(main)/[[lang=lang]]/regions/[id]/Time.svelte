<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let time = '';

	function updateTime() {
		const now = new Date();
		const berlinNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));

		const h = berlinNow.getHours();
		const m = berlinNow.getMinutes().toString().padStart(2, '0');
		const s = berlinNow.getSeconds().toString().padStart(2, '0');

		time = `${h}:${m}:${s}`;
	}

	let interval: NodeJS.Timeout;

	onMount(() => {
		updateTime(); // set immediately
		interval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<p>{time}</p>
