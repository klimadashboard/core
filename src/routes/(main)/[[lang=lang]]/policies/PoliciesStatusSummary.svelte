<script>
	import { page } from '$app/state';

	export let policies;

	$: policyStates = ['started', 'not_started', 'in progress', 'completed', 'archived'];
	$: policyColors = ['#CEC51F', '#913B3B', '#0E3661'];
</script>

<div class="container">
	<p class="mt-8 text-lg">
		{policies.length == 0
			? page.data.translations.noPolicyFound
			: policies.length == 1
				? page.data.translations.onePolicyFound
				: policies.length + ' ' + page.data.translations.policiesFound}
	</p>
	<div class="rounded-full h-2 w-full flex overflow-hidden">
		{#each policyStates as state, i}
			<div
				class=" h-full"
				style="background: {policyColors[i]};width: {(policies.filter((p) => p.status == state)
					.length /
					policies.length) *
					100}%"
			></div>
		{/each}
	</div>
</div>
