<script>
	import { page } from '$app/state';

	export let policies;
	console.log(policies);
</script>

<div class="container">
	<p class="mt-8 mb-1 leading-tight text-base">
		{policies.length == 0
			? page.data.translations.noPolicyFound
			: policies.length == 1
				? page.data.translations.onePolicyFound
				: policies.length + ' ' + page.data.translations.policiesFound}
		{#each page.data.status.filter((d) => policies.filter((p) => p.status.key == d.key).length > 0) as status}
			<div
				class="w-2 h-2 rounded-full ml-3 inline-block -translate-y-0.5"
				style="background: {status.color}"
			></div>
			{policies.filter((p) => p.status.key == status.key).length}
			{status.label}
		{/each}
	</p>
	<div class="rounded-full h-2 w-full flex overflow-hidden">
		{#each page.data.status as status, i}
			<div
				class=" h-full"
				style="background: {status.color};width: {(policies.filter(
					(p) => p.status.key == status.key
				).length /
					policies.length) *
					100}%"
			></div>
		{/each}
	</div>
</div>
