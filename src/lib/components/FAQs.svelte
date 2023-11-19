<script>
	const getFAQs = async function () {
		const res = await fetch('https://klimadashboard.org/faq.json').then(function (response) {
			if (!response.ok) {
				throw error(500, response.statusText);
			}
			return response;
		});
		const json = await res.json();
		return json;
		throw error(500, 'Timeout when loading glossary.');
	};

	$: promise = getFAQs();
</script>

<section class="bg-gray-100 pt-4">
	<div class="container">
		<h2 class="mb-1 font-bold text-gray-700">Fragen und Antworten</h2>
		<div class=" border-t text-lg py-4">
			{#await promise then faqs}
				{#each faqs as faq}
					<details class="py-2">
						<summary class="border-b mb-1">{faq.question.value}</summary>
						<div class="max-w-4xl">
							{@html faq.answer.value}
						</div>
					</details>
				{/each}
			{/await}
		</div>
	</div>
</section>
