<script>
	import { page } from '$app/stores';

	export let policies;
	function getUrl(policy) {
		let url =
			$page.data.language.code == 'de'
				? '/policies/' + policy.id
				: '/' + $page.data.language.code + '/policies/' + policy.id;
		return url;
	}
</script>

<div class="grid gap-1 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 my-8 p-1">
	{#each policies.sort((a, b) => a.status.sort - b.status.sort) as policy}
		<a
			href={getUrl(policy)}
			class="p-3 bg-current/5 rounded-2xl hover:opacity-70 transition text-sm"
		>
			<h3 class="font-bold text-xl lg:text-2xl leading-tight hyphens-auto">
				{policy.title}
			</h3>
			<div class="flex gap-1 items-center mt-2 flex-wrap font-bold">
				<div
					class="px-3 py-1 rounded-full flex items-center"
					style="background-color: {policy.status.color};  color: {policy.status.colorText}"
				>
					{policy.status.label}
				</div>
				{#each policy.attributes.filter((a) => a.type == 'topic') as attribute}
					<span class="rounded-full px-3 py-1 bg-current/10">
						{attribute.title}
					</span>
				{/each}

				{#each policy.attributes.filter((a) => a.type == 'source') as attribute}
					<span class="bg-current/10 rounded-full px-2 py-1">
						{@html attribute.icon}
					</span>
				{/each}
			</div>

			<!--
			<p class="text-sm opacity-80 mt-2">
				Letzte Aktualisierung: {dayjs(policy.date_updated).format('D.M.YYYY')}
			</p>
			-->
		</a>
	{/each}
</div>

<div class="container">
	<p class="my-8 opacity-80 text max-w-xl">
		Unser Maßnahmenmonitor wird laufend ergänzt. Änderungsvorschläge und Feedback gerne an
		<a href="mailto:team@klimadashboard.org">team@klimadashboard.org</a>.
	</p>
</div>
