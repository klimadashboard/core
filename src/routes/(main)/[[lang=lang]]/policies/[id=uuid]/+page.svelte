<script>
	import { page } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PolicyUpdates from '../PolicyUpdates.svelte';
	import dayjs from 'dayjs';

	export let data;

	$: displayedStatus = [];

	$: if (data.policy.status == 'noTrack') {
		displayedStatus = page.data.status.filter((d) => d.key == 'noTrack');
	} else if (data.policy.status.includes('goal')) {
		displayedStatus = page.data.status.filter((d) => d.key.includes('goal'));
	} else {
		displayedStatus = page.data.status.filter(
			(d) => d.key == 'notStarted' || d.key == 'implemented'
		);
	}
</script>

<PageHeader />

<div class="container">
	<div
		id="status"
		class="overflow-scroll -translate-y-8 border border-current/10 text-sm md:text-base rounded-full inline-flex"
	>
		{#each displayedStatus as status}
			{@const isActive = status.key == data.policy.status}
			<div
				class="shrink-0 rounded-full p-1 px-3 flex gap-0.5 items-center {isActive
					? 'font-bold'
					: ''}"
				style={isActive ? `background: ${status.color}; color: ${status.colorText};` : ''}
			>
				{@html status?.icon}
				{status?.label}
			</div>
		{/each}
	</div>

	<div class="grid md:grid-cols-3 max-w-[90vw] gap-8">
		<div class="md:col-span-2">
			{#if data.policy.content}
				<div class="text-lg text mb-8">{@html data.policy.content}</div>
			{/if}
			{#if data.policy.governmentPlan}
				<div class="text-lg text mb-8">
					<h2 class="mb-2 flex items-center gap-2">
						{@html data.policy.attributes.find((d) => d.key == 'governmentProgramAT2529')?.icon}
						<span>Regierungsprogramm 2025-29</span>
						{#if data.language.code !== 'de'}
							<span class="opacity-70 font-normal">auto-translated using AI</span>
						{/if}
					</h2>
					<blockquote>
						{@html data.policy.governmentPlan}
					</blockquote>
				</div>
			{/if}
			{#if data.policy.citizenDemand}
				<div class="text-lg text mb-8">
					<h2 class="mb-2 flex items-center gap-2">
						{@html data.policy.attributes.find((d) => d.key == 'citizensAssemblyAT22')?.icon}
						<span>Forderungen des Klimarats der Bürger:innen 2022</span>
						{#if data.language.code !== 'de'}
							<span class="opacity-70 font-normal">auto-translated using AI</span>
						{/if}
					</h2>
					<blockquote>
						{@html data.policy.citizenDemand}
					</blockquote>
				</div>
			{/if}
		</div>
		<div>
			<ul class="my-2 attribute-list">
				{#if data.policy.type}
					<li>Typ: {data.policy.type}</li>
				{/if}

				{#if data.policy.attributes.find((d) => d.key == 'governmentProgramAT2529')}
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
						<span>
							im <a href="/policies/governmentProgramAT2529" class="underline underline-offset-4"
								>Regierungsprogramm 2025-29</a
							>
						</span>
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
						><span
							>empfohlen vom <a
								href="/policies/citizensAssemblyAT22"
								class="underline underline-offset-4">Klimarat der Bürger:innen 2022</a
							></span
						>
					</li>
				{/if}
				<li class="overflow-scroll">
					<div class="flex items-center gap-1">
						{#each data.policy.attributes.filter((d) => d.type == 'topic') as attribute}
							<a
								class="rounded-full p-1 bg-current/5 hover:bg-current/30 transition font-bold px-3"
								href="/policies/{attribute.key}">{attribute.title}</a
							>
						{/each}
					</div>
				</li>

				{#if data.policy.stakeholders.length}
					<li>
						<p>Stakeholder</p>
						<ul class="my-2">
							{#each data.policy.stakeholders as stakeholder}
								<li>
									{#if stakeholder.stakeholders_id.image}
										<img
											src="https://base.klimadashboard.org/assets/{stakeholder.stakeholders_id
												.image}"
											alt={stakeholder.stakeholders_id.title}
											class="h-16 bg-white p-1 rounded-2xl"
										/>
									{/if}
									<p class="opacity-80">{stakeholder.stakeholders_id.title}</p>
								</li>
							{/each}
						</ul>
					</li>
				{/if}
			</ul>
		</div>
	</div>

	{#if data.policy.updates.length}
		<PolicyUpdates updates={data.policy.updates} />
	{/if}

	<div>
		<p class="my-8 opacity-80 text max-w-xl">
			Diese Seite wurde zuletzt am {page.data.policy.date_updated
				? dayjs(page.data.policy.date_updated).format('D.M.YYYY')
				: dayjs(page.data.policy.date_created).format('D.M.YYYY')} aktualisiert. Unser Maßnahmenmonitor
			wird laufend ergänzt. Änderungsvorschläge und Feedback gerne an
			<a href="mailto:team@klimadashboard.org">team@klimadashboard.org</a>.
		</p>
	</div>
</div>

<style>
	@reference "tailwindcss/theme";

	.attribute-list li:not(:last-child) {
		@apply border-b py-1 border-current/10;
	}

	.attribute-list li {
		@apply py-3;
	}
</style>
