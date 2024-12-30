<script>
	let clicked = -1;
	let quizQuestions = [];
	let questionIndex = 0;
	let quizCompleted = false;
	let correctAnswers = 0;

	// Fetch and initialize questions
	fetch('https://base.klimadashboard.org/items/quiz_questions?fields=*.*')
		.then(async (response) => {
			const data = await response.json();
			quizQuestions = shuffleArray(data.data);
		})
		.catch((error) => console.error('Error fetching questions:', error));

	function shuffleArray(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	// Handle answer click
	async function handleAnswerClick(answerIndex) {
		if (clicked !== -1) return;

		clicked = answerIndex;

		// Check if the answer is correct
		if (quizQuestions[questionIndex].answers[answerIndex].is_true) {
			quizQuestions[questionIndex].correct = true;
		} else {
			quizQuestions[questionIndex].correct = false;
		}

		// Submit the clicked answer
		submitAnswer(quizQuestions[questionIndex].uuid, answerIndex);
	}

	$: console.log(quizQuestions);

	// Go to the next question
	function nextQuestion() {
		if (questionIndex < quizQuestions.length - 1) {
			clicked = -1;
			questionIndex++;
		} else {
			quizCompleted = true;
		}
	}

	// Placeholder for submitting the answer
	function submitAnswer(questionUuid, answerIndex) {
		// Implement this function to send data to the backend
		console.log(`Submitting answer: questionUuid=${questionUuid}, answerIndex=${answerIndex}`);
	}
</script>

<div class="bg-gray-100 p-4">
	<div class="max-w-4xl mx-auto p-4 bg-white">
		{#if quizQuestions.length > 0}
			<div class="flex gap-1">
				{#each quizQuestions as q}
					<div
						class="h-1 w-full bg-gray-100 {q.correct == true ? 'bg-green-500' : ''} {q.correct ==
						false
							? 'bg-red-500'
							: ''}"
					/>
				{/each}
			</div>
			{#if !quizCompleted}
				<div class="quiz-container">
					<h4 class="text-2xl my-4">{@html quizQuestions[questionIndex].question}</h4>
					{#if quizQuestions[questionIndex].text_question}
						<div class="text-lg mb-4">
							{@html quizQuestions[questionIndex].text_question}
						</div>
					{/if}
					<div class="flex flex-col gap-2">
						{#each quizQuestions[questionIndex].answers as answer, i}
							<button
								class="bg-gray-100 hover:bg-gray-200 rounded p-4 text-lg leading-tight transition duration-500 {clicked >
								-1
									? answer.is_true
										? 'bg-green-300 hover:bg-green-300'
										: 'bg-red-300 hover:bg-red-300 line-through'
									: ''}"
								on:click={() => handleAnswerClick(i)}
								disabled={clicked !== -1}
							>
								{answer.label}
							</button>
						{/each}
					</div>
					{#if clicked !== -1}
						{#if quizQuestions[questionIndex].text_answer}
							<div class="my-4 text-lg">
								{@html quizQuestions[questionIndex].text_answer}
							</div>
						{/if}
						<div class="flex mt-4">
							<button
								class="mx-auto bg-gray-100 rounded p-4 text-lg leading-tight hover:bg-gray-200"
								on:click={nextQuestion}>Nächste Frage</button
							>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-lg">
					<h3 class="text-xl font-bold my-4">Gratuliere, du hast alle Fragen beantwortet!</h3>
					<p>
						Von {quizQuestions.length} Fragen hast du {quizQuestions.filter((d) => d.correct)
							.length} korrekt beantwortet.
					</p>
				</div>
			{/if}
		{:else}
			<p>Loading questions...</p>
		{/if}
	</div>
</div>
