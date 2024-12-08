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

<div class="p-3">
	<h2 class="text-center text-2xl font-bold mb-4">Spende für unsere Arbeit</h2>
	<div class="flex items-center gap-4 justify-center text-2xl">
		{#each values as value}
			<a href={value.link} class="shadow-lg px-2 py-1 rounded-md border">{value.value}</a>
		{/each}
	</div>
</div>
