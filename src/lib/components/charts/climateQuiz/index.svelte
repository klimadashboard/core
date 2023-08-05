<script lang="ts">
	import { clickOutside } from '$lib/utils/clickOutside';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';

	let clicked: number = -1;
	let quizQuestions: QuizQuestion[];
	$: questionIndex = 0;
	$: questionText = '';

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
		quizQuestions[questionIndex].maxClicked = answerCounts.reduce(
			(max, ans) => Math.max(max, ans.count),
			0
		);
		quizQuestions[questionIndex].answers.forEach((ans, a) => {
			const count = answerCounts.find((answer) => answer.answerId == String(a))?.count || 0;
			console.log(
				ans,
				count,
				a,
				quizQuestions[questionIndex].clickedCount,
				quizQuestions[questionIndex].maxClicked
			);

			quizQuestions[questionIndex].answers[a].percent =
				(count / quizQuestions[questionIndex].clickedCount) * 100;
			quizQuestions[questionIndex].answers[a].width =
				count / quizQuestions[questionIndex].maxClicked;
		});

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
				<h4 class="text-3xl pb-4">
					{quizQuestions[questionIndex].question}
					{#if quizQuestions[questionIndex].text_question != ''}
						<div class="inline-block ml-2 translate-y-2">
							<span
								class="glossary-label"
								on:mousedown={() => {
									questionText = quizQuestions[questionIndex].text_question;
								}}
							/>
						</div>
					{/if}
				</h4>
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
								<span class="absolute top-1/2 left-2 -translate-y-1/2 font-bold">
									{String.fromCharCode(65 + i)}
								</span>
								<span>{answer.label}</span>
							</button>
						</div>
					{/each}
				</div>
				<div class="grid grid-cols-[1fr_200px] height-32 my-4">
					{#if clicked >= 0}
						<div
							class="text-3xl flex justify-center items-center"
							transition:fade={{ duration: 200 }}
						>
							{#if quizQuestions[questionIndex].text_answer != ''}
								<span
									class="bg-white text-black p-2 m-1 block rounded-md text-xl cursor-pointer"
									on:mousedown={() => {
										questionText = quizQuestions[questionIndex].text_answer;
									}}>Erklärung</span
								>
							{/if}
						</div>
						{#if quizQuestions[questionIndex].clickedCount}
							<div class="progress-wrapper border-l-4 border-white">
								<span class="uppercase inline-block ml-2">Ergebnisse</span>
								{#each quizQuestions[questionIndex].answers as answer, i}
									<div class="relative flex justify-start items-center gap-x-[1ch]">
										<span
											class="inline-block bg-white"
											style="height: 1em; width: {answer.width * 120}px;"
										/>
										<span>{Math.round(answer.percent)} %</span>
										<span class="absolute left-[-1rem] top-[-0.2rem]"
											>{String.fromCharCode(65 + i)}</span
										>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
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
				<!-- <h4 class="text-xl py-4">Teile dein Ergebnis auf Social Media!</h4> -->
			{/if}
		</div>
	</div>
{/if}

{#if questionText != ''}
	<div
		class="popup fixed inset-0 grid bg-black bg-opacity-50 p-4 z-50"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-white m-auto shadow-lg p-4 max-w-md lg:max-w-lg relative overflow-scroll"
			style="max-height: 70vh;"
			use:clickOutside
			on:click_outside={() => {
				questionText = '';
			}}
		>
			<button
				on:mousedown={() => {
					questionText = '';
				}}
				class="absolute top-4 right-4"
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-x"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
			<h3 class="text-gradient-green text-xl mt-[24px] pb-2 mb-2">
				{@html questionText}
			</h3>
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
