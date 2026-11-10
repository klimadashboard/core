<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
	let email = '';
	let isSubmitting = false;
</script>

<div class="max-w-md mx-auto p-4">
	<h1 class="text-3xl mt-8 mb-4">Deine Spende verwalten</h1>
	<p class="text-lg">
		Gib die Email-Adresse an, mit der du gespendet hast. Wir schicken dir einen Link, mit dem du
		deine monatliche Spende verwalten oder kündigen kannst.
	</p>

	{#if form?.success}
		<div class="mt-6 rounded-2xl border border-green-300 dark:border-green-800 bg-green-100 dark:bg-green-900/25 px-4 py-3 text-green-900 dark:text-green-200">
			{form.message}
		</div>
	{:else}
		<form
			method="POST"
			class="mt-6 flex flex-col gap-3"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}
		>
			<div class="flex flex-col gap-1">
				<label for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					bind:value={email}
					required
					class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
				/>
			</div>
			{#if form?.error}
				<p class="text-red-600 text-sm">{form.error}</p>
			{/if}
			<button
				type="submit"
				disabled={isSubmitting || !email}
				class="py-3 rounded-full bg-green-700 text-white font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
			>
				{isSubmitting ? 'Wird gesendet …' : 'Link zusenden'}
			</button>
		</form>
	{/if}
</div>
