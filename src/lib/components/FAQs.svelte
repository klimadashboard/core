<script>
	import { page } from '$app/stores';
	const getFAQs = async function () {
		const res = await fetch('https://klimadashboard.org/faq.json').then(function (response) {
			if (!response.ok) {
				throw error(500, response.statusText);
			}
			return response;
		});
		const json = await res.json();
		return json;
	};

	$: promise = getFAQs();
</script>

<section class="bg-gray-100 dark:bg-gray-900 pt-4">
	<div class="container">
		<h2 class="mb-1 font-bold leading-none">{$page.data.translations.questionsAndAnswers}</h2>
		<div class=" border-t text-lg">
			{#await promise then faqs}
				{#each faqs as faq}
					<details class=" my-2">
						<summary class="hover:underline underline-offset-2 mb-1">{faq.question.value}</summary>
						<div class="max-w-4xl">
							{@html faq.answer.value}
						</div>
					</details>
				{/each}
			{/await}
		</div>
	</div>
</section>
