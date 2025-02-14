<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';

	let quizQuestions = [];
	let questionIndex = 0;
	let quizCompleted = false;

	// ID of the selected answer in the current question. Null means none selected yet.
	let selectedAnswerId = null;

	// Fetch and initialize questions
	fetch('https://base.klimadashboard.org/items/quiz_questions?fields=*.*')
		.then(async (response) => {
			const data = await response.json();

			// Reformat questions
			const reformattedQuestions = data.data
				.filter((d) => d.countries.indexOf(PUBLIC_VERSION) > -1)
				.map((question) => {
					const totalAnswerCount = question.answers.reduce(
						(sum, answer) => sum + (answer.answer_count || 0),
						0
					);

					const reformattedAnswers = question.answers.map((answer) => ({
						...answer,
						percentage:
							totalAnswerCount > 0 ? ((answer.answer_count || 0) / totalAnswerCount) * 100 : 0
					}));

					return {
						...question,
						total_answer_count: totalAnswerCount,
						answers: reformattedAnswers
					};
				});

			quizQuestions = shuffleArray(reformattedQuestions).slice(0, 10); // shuffle array and get first 10 questions
		})
		.catch((error) => {
			console.error('Error fetching questions:', error);
		});

	function shuffleArray(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	// Derived store: current question for convenience
	$: currentQuestion = quizQuestions[questionIndex];

	// Handle answer click
	async function handleAnswerClick(answerId) {
		// If an answer has already been selected, do nothing
		if (selectedAnswerId !== null) return;

		selectedAnswerId = answerId;

		const selectedAnswer = currentQuestion.answers.find((a) => a.id === answerId);
		if (!selectedAnswer) return;

		// Mark the question as correct/incorrect
		quizQuestions[questionIndex].correct = selectedAnswer.is_true == true;

		// Submit the clicked answer
		submitAnswer(answerId, selectedAnswer.answer_count);
	}

	// Go to the next question
	function nextQuestion() {
		if (questionIndex < quizQuestions.length - 1) {
			questionIndex++;
			selectedAnswerId = null; // Reset for the next question
		} else {
			quizCompleted = true;
		}
	}

	// Placeholder for submitting the answer
	function submitAnswer(answerId, currentAnswerCount) {
		const payload = {
			id: answerId,
			data: {
				answer_count: (currentAnswerCount ?? 0) + 1
			}
		};

		fetch('/api/items/quiz_answers/update', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to update answer count: ${response.statusText}`);
				}
				return response.json();
			})
			.catch((error) => {
				console.error('Error updating answer count:', error);
			});
	}
</script>

{#if page.data.language.code == 'de'}
	<div class="bg-gray-100 dark:bg-gray-800 p-4">
		<div class="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-700">
			<h2 class="font-bold pb-1">{page.data.translations.climateQuiz}</h2>
			{#if quizQuestions.length > 0}
				<!-- Progress indicator -->
				<div class="flex gap-1">
					{#each quizQuestions as q}
						<div
							class="h-1 w-full bg-gray-100
							{q.correct === true ? 'bg-green-500' : ''} 
							{q.correct === false ? 'bg-red-500' : ''}"
						/>
					{/each}
				</div>

				{#if !quizCompleted}
					{#if currentQuestion}
						<div class="quiz-container">
							<h4 class="text-2xl my-4">{@html currentQuestion.question}</h4>

							{#if currentQuestion.text_question}
								<div class="text-lg mb-4">
									{@html currentQuestion.text_question}
								</div>
							{/if}

							<div class="flex flex-col gap-2">
								{#each currentQuestion.answers as answer}
									<button
										class="relative overflow-hidden bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-900 rounded-2xl p-4 text-lg leading-tight transition duration-500
										{selectedAnswerId !== null
											? answer.is_true
												? 'bg-green-300 hover:bg-green-300'
												: 'bg-red-300 hover:bg-red-300'
											: ''}"
										on:click={() => handleAnswerClick(answer.id)}
										disabled={selectedAnswerId !== null}
									>
										<!-- Colored bar -->
										<div
											class="absolute bottom-0 left-0 top-0
											{answer.is_true ? 'bg-green-400' : 'bg-red-400'} 
											transition-[width]"
											style="width: {selectedAnswerId !== null ? answer.percentage : 0}%"
										/>
										<div class="relative">
											{answer.label}
										</div>
									</button>
								{/each}
							</div>

							<!-- Feedback / Explanation after click -->
							{#if selectedAnswerId !== null}
								<div class="space-y-4 mt-4 text-lg">
									<p>
										{#if currentQuestion.correct}
											Korrekt!
										{:else}
											Leider falsch.
										{/if}

										{Math.round(currentQuestion.answers.find((d) => d.is_true).percentage)}% der
										{currentQuestion.total_answer_count} Quiz-Teilnehmer:innen haben die Frage richtig
										beantwortet.
									</p>

									{#if currentQuestion.text_answer}
										<div>
											{@html currentQuestion.text_answer}
										</div>
									{/if}

									<div class="flex">
										<button
											class="mx-auto bg-gray-100 dark:bg-gray-800 rounded-sm p-4 text-lg leading-tight hover:bg-gray-200 dark:hover:bg-gray-900"
											on:click={nextQuestion}
										>
											Weiter
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				{:else}
					<!-- Quiz complete -->
					<div class="text-lg">
						<h3 class="text-xl font-bold my-4">Gratuliere, du hast alle Fragen beantwortet!</h3>
						<p>
							Von {quizQuestions.length} Fragen hast du
							{quizQuestions.filter((d) => d.correct).length} korrekt beantwortet.
						</p>
					</div>
				{/if}
			{:else}
				<p>Loading questions...</p>
			{/if}
		</div>
	</div>
{/if}
