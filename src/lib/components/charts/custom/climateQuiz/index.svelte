<script lang="ts">
	import { clickOutside } from '$lib/utils/clickOutside';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';

	let clicked: number = -1;
	let clickAnimation: boolean = false;
	let quizQuestions: QuizQuestion[];
	$: questionIndex = 0;
	$: questionText = '';

	$: console.log($page);

	fetch('https://klimadashboard.org/quiz.json').then(async (response) => {
		const questions = (await response.json()) as QuizQuestion[];
		// filter only questions for this page!
		quizQuestions = questions
			.filter((q) => {
				return q.showOnVersions == '' || q.showOnVersions.split(', ').indexOf(PUBLIC_VERSION) >= 0;
			})
			.filter((q) => {
				const uuid = $page.data.uuid;
				if ($page.data.content.title == 'Startseite') return true; // q.showOnPages == null   // only STARTPAGE
				return q.showOnPages?.filter((p) =>
					p.uid.split('-')[0].includes($page.data.content.title.toLocaleLowerCase())
				).length;
			});

		// randomise questions
		shuffleArray(quizQuestions);

		// possible TODO: randomise answers?
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
		setTimeout(() => {
			clickAnimation = true;
		}, 1000);

		await postAnswerToDb();
		let answerCounts: DbCountQuizAnswer[] = await getClickedAnswersFromDb();

		// answerCounts = quizQuestions[questionIndex].answers.map((ans, a) => {
		// 	return {
		// 		_id: ans.id,
		// 		answerId: ans.id,
		// 		count: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : clicked == a ? 1 : 0
		// 	};
		// });
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

			quizQuestions[questionIndex].answers[a].percent =
				(count / quizQuestions[questionIndex].clickedCount) * 100;
			quizQuestions[questionIndex].answers[a].width =
				count / quizQuestions[questionIndex].clickedCount;
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
	<div class="text-black m-4 bg-gray-100 py-8 overflow-hidden">
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
						<button
							class="relative text-black p-2 pl-16 m-1 block w-full text-left rounded-md quiz-button {clicked >=
							0
								? 'animate-bar'
								: ''} {clickAnimation ? 'animate' : ''}"
							disabled={clicked >= 0 ? 'disabled' : ''}
							style="background-color: {clicked >= 0
								? clicked == i
									? 'rgba(255,255,255,0.6)'
									: 'rgba(255,255,255,0.1)'
								: 'white'}; --bar-width: {answer.width * 100}%;"
							on:click={() => questionClicked(i)}
						>
							<span class="bar" />
							<span class="absolute top-1/2 left-2 -translate-y-1/2">
								<strong>{String.fromCharCode(65 + i)}</strong>
								<span class="text-fade-in">
									{#if clicked >= 0}
										⋅ <small>{Math.round(answer.percent)}%</small>
									{/if}
								</span>
							</span>
							<span>{answer.label}</span>
							{#if clicked == i || (clicked >= 0 && answer.istrue === 'true')}
								<span
									class="absolute top-1/2 right-2 -translate-y-1/2 {isCorrect
										? 'fill-green-600 text-white'
										: isWrong
										? 'text-red-600 text-white'
										: ''}"
								>
									{#if answer.istrue === 'true'}<svg
											xmlns="http://www.w3.org/2000/svg"
											x="0px"
											y="0px"
											width="20"
											height="20"
											viewBox="0 0 48 48"
										>
											<path
												fill={clicked == i ? 'green' : 'rgba(150,150,150,0.8)'}
												d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
											/>
											<path
												fill="white"
												d="M21.293,32.707l-8-8c-0.391-0.391-0.391-1.024,0-1.414l1.414-1.414	c0.391-0.391,1.024-0.391,1.414,0L22,27.758l10.879-10.879c0.391-0.391,1.024-0.391,1.414,0l1.414,1.414	c0.391,0.391,0.391,1.024,0,1.414l-13,13C22.317,33.098,21.683,33.098,21.293,32.707z"
											/>
										</svg>{/if}
									{#if answer.istrue === 'false'}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											x="0px"
											y="0px"
											width="20"
											height="20"
											viewBox="0 0 48 48"
										>
											<path
												fill="red"
												d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"
											/><path
												fill="#fff"
												d="M31.071,15.515l1.414,1.414c0.391,0.391,0.391,1.024,0,1.414L18.343,32.485	c-0.391,0.391-1.024,0.391-1.414,0l-1.414-1.414c-0.391-0.391-0.391-1.024,0-1.414l14.142-14.142	C30.047,15.124,30.681,15.124,31.071,15.515z"
											/><path
												fill="#fff"
												d="M32.485,31.071l-1.414,1.414c-0.391,0.391-1.024,0.391-1.414,0L15.515,18.343	c-0.391-0.391-0.391-1.024,0-1.414l1.414-1.414c0.391-0.391,1.024-0.391,1.414,0l14.142,14.142	C32.876,30.047,32.876,30.681,32.485,31.071z"
											/>
										</svg>
									{/if}
								</span>
							{/if}
						</button>
					{/each}
				</div>
				<div class={clickAnimation ? 'animate' : ''}>
					{#if clicked >= 0}
						<p class="mx-3 my-4 text-fade-in">
							<span
								><strong
									>{quizQuestions[questionIndex].answers[clicked].istrue == 'true'
										? 'Richtig!'
										: 'Leider Falsch!'}</strong
								>
								{quizQuestions[questionIndex].answers
									.find((a) => a.istrue == 'true')
									.percent?.toFixed(0)
									.replace('.', ',')}% der Besucher:innen haben die Frage richtig beantwortet.</span
							><br />
							<span class="opacity-50"
								>Diese Frage wurde insgesamt {quizQuestions[questionIndex].clickedCount} mal beantwortet.</span
							>
						</p>
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
					{/if}
				</div>
			{/if}
			{#if clicked != -1 && questionIndex < quizQuestions.length}
				<div class="text-right max-w-prose">
					<button
						class="bg-white text-black p-2 rounded-md ml-auto"
						on:click={() => {
							clicked = -1;
							clickAnimation = false;
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
	.quiz-button {
		margin-bottom: 0.4em;
		isolation: isolate;
	}

	.text-fade-in {
		opacity: 0;
		transition-delay: 2s;
		transition: opacity 1s ease-out;
	}
	.animate .text-fade-in {
		opacity: 1;
	}

	.quiz-button.animate-bar::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 0px;
		background-color: rgb(210, 255, 200);
		border-radius: 0.375rem;
		transition-delay: 0s;
		transition: width 2s ease-out;
		z-index: -1;
	}
	.animate-bar.animate::before {
		width: var(--bar-width);
	}
</style>
