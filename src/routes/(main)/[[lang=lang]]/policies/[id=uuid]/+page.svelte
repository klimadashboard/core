<script>
	import { page } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import dayjs from 'dayjs';
	export let data;

	console.log(data);
</script>

<PageHeader />

<div class="container">
	<div id="status" class=" mb-10 border border-current/10 rounded-full inline-flex gap-2">
		<span
			class="rounded-full p-1 {data.policy.status === 'not_started'
				? 'bg-current/10 font-bold px-3'
				: ''}"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="inline w-4 h-4 -translate-y-0.5 mr-1"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"
				/><path
					d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"
				/><path d="M10 12l4 4m0 -4l-4 4" /></svg
			>
			Nicht gestartet</span
		>
		{#if data.policy.status === 'deferred' || data.policy.status === 'partially_implemented'}
			<span class="rounded-full p-1 bg-current/10 font-bold px-3">{data.policy.status}</span>
		{:else}
			<span
				class="rounded-full p-1 {data.policy.status === 'started' ? 'bg-current/10 font-bold' : ''}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="inline w-4 h-4 -translate-y-0.5 mr-1"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"
					/><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path
						d="M6 12l2 -3l4 -1l3 3l3 1"
					/></svg
				>
				Gestartet</span
			>
		{/if}
		<span
			class="rounded-full p-1 pr-3 {data.policy.status === 'implemented'
				? 'bg-current/10 font-bold px-3'
				: ''}"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="inline w-4 h-4 -translate-y-0.5 mr-1"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg
			>Umgesetzt</span
		>
	</div>
	<div class="grid md:grid-cols-3 gap-4">
		<div class="md:col-span-2">
			{#if data.policy.content}
				<div class="text-lg text mb-10">{@html data.policy.content}</div>
			{/if}
			{#if data.policy.updates.length}
				<h2 class="text-2xl font-bold">Updates</h2>
				{#each data.policy.updates.sort((a, b) => dayjs(b.date).diff(dayjs(a.date))) as update}
					<div class="border-l-2 py-4 my-2 border-current/20 pl-3">
						<p class="text-sm opacity-80 font-bold">{dayjs(update.date).format('DD.MM.YYYY')}</p>
						<h2 class="text-2xl">{update.title}</h2>
						<div class="text-lg text">{@html update.text}</div>
					</div>
				{/each}
			{/if}
		</div>
		<div>
			<ul class="my-2 attribute-list">
				{#if data.policy.type}
					<li>Typ: {data.policy.type}</li>
				{/if}

				{#if data.policy.attributes.find((d) => d.key == 'governmentProgramAT2530')}
					<li class="flex items-center gap-1 font-bold text-green-800">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="w-5 h-5"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"
							/><path d="M9 12l2 2l4 -4" /></svg
						>
						<span> im Regierungsprogramm 2025-30 </span>
					</li>
				{:else}
					<li class="flex items-center gap-1 font-bold text-red-800">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="w-5 h-5"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"
							/><path d="M10 10l4 4m0 -4l-4 4" /></svg
						>
						<span>nicht im Regierungsprogramm 2025-30 </span>
					</li>
				{/if}
				{#if data.policy.attributes.find((d) => d.key == 'citizensAssemblyAT22')}
					<li class="flex items-center gap-1 font-bold text-green-800">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="w-5 h-5"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
							/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path
								d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
							/><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path
								d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
							/><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg
						><span>empfohlen vom Klimarat der Bürger:innen 2022</span>
					</li>
				{/if}
			</ul>

			<div class="mt-4">
				{#each data.policy.attributes.filter((d) => d.type == 'topic') as attribute}
					<a
						class="rounded-full p-1 bg-current/5 hover:bg-current/30 transition font-bold px-3"
						href="/policies/{attribute.key}">{attribute.title}</a
					>
				{/each}
			</div>

			{#if data.policy.stakeholders.length}
				<p class="text-lg mt-4">Relevante Stakeholder für diese Handlung sind</p>
				<ul class="my-2">
					{#each data.policy.stakeholders as stakeholder}
						<li>
							{#if stakeholder.stakeholders_id.image}
								<img
									src="https://base.klimadashboard.org/assets/{stakeholder.stakeholders_id.image}"
									alt={stakeholder.stakeholders_id.title}
									class="h-16 bg-white p-1 rounded-2xl"
								/>
							{/if}
							<p class="opacity-80">{stakeholder.stakeholders_id.title}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<p class="my-8 opacity-80 text">
			Diese Seite wurde zuletzt am {dayjs(page.data.policy.date_updated).format('D.M.YYYY')} aktualisiert.
			Änderungsvorschläge können an
			<a href="mailto:team@klimadashboard.org">team@klimadashboard.org</a> geschickt werden.
		</p>
	</div>
</div>

<style>
	@reference "tailwindcss/theme";

	.attribute-list li:not(:last-child) {
		@apply border-b py-1 border-current/10;
	}

	.attribute-list li {
		@apply py-1;
	}
</style>
