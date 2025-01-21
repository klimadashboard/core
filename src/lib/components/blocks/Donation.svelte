<script>
	let values = [
		{
			value: '10€',
			link: 'https://donate.stripe.com/8wM03o9ZS0OX28U4gg'
		},
		{
			value: '50€',
			link: 'https://donate.stripe.com/9AQ5n6g5g9XQ58U6o0'
		},
		{
			value: '100€',
			link: 'https://donate.stripe.com/dR66p7g5g9XQ58U6o0'
		},
		{
			value: 'Flexible Spende',
			link: 'https://donate.stripe.com/dR66p7g5g9XQ58U6o0'
		}
	];
</script>

<div class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 py-10">
	<h2 class="text-center text-3xl font-bold leading-tight">
		Klimawissenschaft zugänglich machen. <br />Für alle, immer, kostenlos.
	</h2>
	<p class="text-lg text-center mx-auto max-w-md leading-snug mb-4 mt-2 text-balance">
		Das machen wir als Verein Klimadashboard. Unterstütze unsere Arbeit 2025 mit einer Spende.
	</p>
	<div class="flex items-center gap-4 justify-center text-2xl">
		{#each values as value}
			<a href={value.link} class="border-b">{value.value}</a>
		{/each}
	</div>
</div>
