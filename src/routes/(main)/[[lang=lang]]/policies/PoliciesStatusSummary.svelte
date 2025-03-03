<script>
	import { page } from '$app/state';

	export let policies;
</script>

<div class="container">
	<p class="mt-8 mb-1 leading-tight text-base">
		{policies.length == 0
			? page.data.translations.noPolicyFound
			: policies.length == 1
				? page.data.translations.onePolicyFound
				: policies.length + ' ' + page.data.translations.policiesFound}
	</p>
	<ul class="flex gap-x-4 gap-y-1 flex-wrap">
		{#each page.data.status.filter((d) => policies.filter((p) => p.status.key == d.key).length > 0) as status}
			<li class="flex items-center gap-1">
				<div
					class="w-6 h-6 rounded-full font-bold grid"
					style="background: {status.color}; color: {status.colorText}"
				>
					<span class="m-auto">
						{policies.filter((p) => p.status.key == status.key).length}
					</span>
				</div>
				{#if status.description}
					<div class="underline underline-offset-2 decoration-current/20 relative group">
						{status.label}
						<span
							class="hidden group-hover:block absolute bottom-full left-1/2 bg-gray-100 dark:bg-gray-900 p-3 text-sm text-center w-64 -translate-x-1/2"
							>{status.description}</span
						>
					</div>
				{:else}
					{status.label}
				{/if}
			</li>
		{/each}
	</ul>
	<div class="rounded-full h-2 mt-1 w-full flex overflow-hidden">
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
