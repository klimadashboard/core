<script>
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';

	let quizQuestions = null;
	$: index = 0;
	$: clicked = null;

	fetch('https://klimadashboard.org/quiz.json')
		.then((data) => data.json())
		.then((questions) => {
			// TODO: filter only questions for this page!
			// get uid of page I am on
			const uuid = 'xjupJCcUKMP1vzer'; // e.g. Detail-Emissionen
			quizQuestions = questions.filter((q) => {
				// 	console.log(PUBLIC_VERSION);
				return q.showOnVersions == '' || q.showOnVersions.split(', ').indexOf(PUBLIC_VERSION) >= 0;
			});
			// .filter((q) => {
			// 	// return q.showOnPages == null   // only STARTPAGE
			// 	return q.showOnPages?.filter((p) => p.uuid == uuid).length;
			// });

			// randomise questions
			// shuffleArray(quizQuestions);

			// TODO: randomise answers

			console.log(quizQuestions);
		});

	function shuffleArray(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	$: questionClicked = function (i) {
		if (clicked != null) return;

		clicked = i;
		console.log('question clicked', i, quizQuestions[index].answers[clicked]);

		console.log('fetching question answer', {
			uuid: quizQuestions[index].uuid,
			clicked: quizQuestions[index].answers[clicked].label,
			correct: quizQuestions[index].answers[clicked].istrue == true
		});
	};
</script>

{#if quizQuestions != null}
	<div class="w-screen bg-gradient-green bg-opacity-50 text-white py-8 overflow-hidden">
		<div class="container">
			{#if index < quizQuestions.length}
				<h4 class="text-3xl pb-4">{quizQuestions[index].question}</h4>
				<small class="block pb-4">{@html quizQuestions[index].text_question}</small>
				<div class="max-w-prose">
					{#each quizQuestions[index].answers as answer, i}
						{@const isCorrect = clicked == i && answer.istrue == 'true'}
						{@const isWrong = clicked == i && answer.istrue == 'false'}
						<button
							class="relative bg-white text-black p-2 m-1 block w-full rounded-md {clicked != null
								? isCorrect
									? 'bg-green-600 text-white'
									: isWrong
									? 'bg-red-600 text-white'
									: ''
								: ''}"
							on:click={questionClicked(i)}
							><div class="progress-bar" />
							<span class="absolute top-1/2 left-2 -translate-y-1/2 font-bold"
								>{String.fromCharCode(65 + i)}</span
							>
							<span>{answer.label}</span>
						</button>
					{/each}
				</div>
				<small>{@html quizQuestions[index].text_answer}</small>
			{/if}
			{#if clicked != null && index < quizQuestions.length}
				<div class="text-right max-w-prose">
					<button
						class="bg-white text-black p-2 rounded-md ml-auto"
						on:click={() => {
							clicked = null;
							index++;
						}}>Nächste Frage</button
					>
				</div>
			{:else if index == quizQuestions.length}
				<strong>Gratuliere, du hast alle Fragen beantwortet!</strong>
				<h4 class="text-xl py-4">Teile dein Ergebnis auf Social Media!</h4>
			{/if}
		</div>
	</div>
{/if}

<style>
	.bg-green-600 {
		background-color: green;
	}
	.bg-red-600 {
		background-color: red;
	}
</style>
