<script>
	import dayjs from 'dayjs';

	export let policies;
</script>

<div class="grid gap-1 grid-cols-2 lg:grid-cols-4 my-8 p-1">
	{#each policies as policy}
		<a
			href={`/policies/${policy.id}`}
			class="p-3 bg-current/5 rounded-2xl hover:opacity-70 transition"
		>
			<h3 class="font-bold text-xl leading-tight">
				{policy.translations[0].title}
			</h3>
			<div class="flex gap-1 items-center mt-2 flex-wrap">
				<span class="rounded-full px-3 py-1 bg-blue-500 text-sm">{policy.status}</span>
				{#each policy.attributes as attribute}
					<span class="rounded-full px-3 py-1 bg-current/10 text-sm">
						{attribute.policies_attributes_key.translations[0].title}
					</span>
				{/each}
			</div>

			<p class="text-sm opacity-80 mt-2">
				Letzte Aktualisierung: {dayjs(policy.date_updated).format('D.M.YYYY')}
			</p>
		</a>
	{/each}
</div>
