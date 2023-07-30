<script lang="ts">
	import { PUBLIC_VERSION } from '$env/static/public';

	let clicked: number = -1;
	let quizQuestions: QuizQuestion[];
	$: questionIndex = 0;

	fetch('https://klimadashboard.org/quiz.json').then(async (response) => {
		const questions = (await response.json()) as QuizQuestion[];
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
		console.log(quizQuestions);

		// TODO: randomise answers

		console.log(PUBLIC_VERSION);
	});

	function shuffleArray(arr: QuizQuestion[]) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}

	$: questionClicked = async function (answerIndex: number) {
		if (clicked != -1) return;
		clicked = answerIndex;

		await postAnswerToDb();
		let answerCounts: DbCountQuizAnswer[] = await getClickedAnswersFromDb();

		// answerCounts = quizQuestions[questionIndex].answers.map((ans, a) => {
		// 	return {
		// 		_id: ans.id,
		// 		answerId: ans.id,
		// 		count: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : clicked == a ? 1 : 0
		// 	};
		// });
		console.log(answerCounts);
		quizQuestions[questionIndex].clickedCount = answerCounts.reduce(
			(sum, ans) => sum + ans.count,
			0
		);

		if (answerCounts.length > 0) {
			answerCounts.forEach((answer) => {
				quizQuestions[questionIndex].answers[answer.answerId].count = answer.count;
			});
		}
	};

	async function postAnswerToDb() {
		try {
			const postAnswer: DbQuizAnswer = {
				questionUuid: quizQuestions[questionIndex].uuid,
				answerId: clicked
			};
			await fetch('/api/quiz', {
				method: 'POST',
				body: JSON.stringify({ postAnswer }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
		} catch (error) {
			// should we do error handling here or is it not interesting?
		}
	}

	async function getClickedAnswersFromDb(): Promise<DbCountQuizAnswer[]> {
		try {
			const response = await fetch(`/api/quiz?questionUuid=${quizQuestions[questionIndex].uuid}`);
			const result = await response.json();
			return result;
		} catch (error) {
			// should we do error handling here or is it not interesting?
			return [];
		}
	}
</script>

{#if quizQuestions != null}
	<div
		class="w-full flex justify-center bg-gradient-green bg-opacity-50 text-white py-8 overflow-hidden"
	>
		<div class="container max-w-prose">
			{#if questionIndex < quizQuestions.length}
				<h4 class="text-3xl pb-4">{quizQuestions[questionIndex].question}</h4>
				<small class="block pb-4">{@html quizQuestions[questionIndex].text_question}</small>
				<div class="max-w-prose">
					{#each quizQuestions[questionIndex].answers as answer, i}
						{@const isCorrect = clicked === i && answer.istrue === 'true'}
						{@const isWrong = clicked === i && answer.istrue === 'false'}
						<div class="quiz-button">
							<button
								class="relative bg-white text-black p-2 m-1 block w-full rounded-md {isCorrect
									? 'bg-green-600 text-white'
									: isWrong
									? 'bg-red-600 text-white'
									: ''}"
								on:click={() => questionClicked(i)}
							>
								<div class="progress-bar" />
								<span class="absolute top-1/2 left-2 -translate-y-1/2 font-bold">
									{String.fromCharCode(65 + i)}
								</span>
								<span>{answer.label}</span>
								{#if quizQuestions[questionIndex].clickedCount}
									<p>{answer.count || 0} / {quizQuestions[questionIndex].clickedCount}</p>
									{#if answer.count >= 0}
										<div
											class="absolute bottom-0 left-0 bg-blue-600"
											style="height: 0.3em; width: {(answer.count /
												quizQuestions[questionIndex].clickedCount) *
												100}%;"
										/>
									{/if}
								{/if}
							</button>
						</div>
					{/each}
				</div>
				<small>{@html quizQuestions[questionIndex].text_answer}</small>
			{/if}
			{#if clicked != -1 && questionIndex < quizQuestions.length}
				<div class="text-right max-w-prose">
					<button
						class="bg-white text-black p-2 rounded-md ml-auto"
						on:click={() => {
							clicked = -1;
							questionIndex++;
						}}>Nächste Frage</button
					>
				</div>
			{:else if questionIndex == quizQuestions.length}
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
	.quiz-button {
		display: flex;
		align-items: center;
	}
</style>
