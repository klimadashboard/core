<script lang="ts">
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import { browser } from '$app/environment';
	import { t } from '$lib/utils/t';
	import dayjs from 'dayjs';

	export let data;

	/* ─── i18n ─────────────────────────────────────────────── */
	const tr: Record<string, string> = {
		'org.kicker': 'Klimadashboard.org',
		'org.hero.title1': 'Wir machen die Klimawende',
		'org.hero.title2': 'mit Daten greifbar.',
		'org.hero.subtitle':
			'Unsere interaktiven Dashboards zeigen aktuell, regional und zugänglich für alle die Herausforderungen, Auswirkungen und Lösungen der Klimakrise.',
		'org.hero.cta.projects': 'Unsere Projekte',
		'org.hero.cta.support': 'Unterstützen',
		'org.projects.title': 'Unsere Projekte',
		'org.projects.subtitle':
			'Wir bauen Datenvisualisierungen für Österreich, Deutschland und die gesamte europäische Union.',
		'org.projects.status.featured': 'Projekt',
		'org.projects.status.active': 'Laufend',
		'org.projects.status.done': 'Abgeschlossen',
		'org.projects.status.planned': 'Geplant',
		'org.events.title': 'Events',
		'org.events.subtitle':
			'Wir geben Workshops, organisieren Ausstellungen und sind regelmäßig auf Konferenzen anzutreffen.',
		'org.team.title': 'Unser Team',
		'org.team.subtitle':
			'Wir vereinen Expertise aus Wissenschaft, Design, Technik und Kommunikation in unserem internationalen Team.',
		'org.open.title': 'Open by default',
		'org.open.subtitle':
			'Das Klimadashboard macht Klimadaten für alle zugänglich. Auch unsere eigene Arbeit ist transparent.',
		'org.open.tag': 'Grundsatz',
		'org.open.source.title': 'Open Source',
		'org.open.source.text': 'Unsere Software steht allen offen – zum Prüfen, Kopieren, Verbessern.',
		'org.open.data.title': 'Open Data',
		'org.open.data.text':
			'Wir machen Datensätze zugänglich – nachvollziehbar, prüfbar, wiederverwendbar.',
		'org.open.finance.title': 'Open Finance',
		'org.open.finance.text': 'Budgets, Ausgaben und Einnahmen legen wir offen.',
		'org.open.finance.income': 'Einnahmen',
		'org.open.finance.expenses': 'Ausgaben',
		'org.open.finance.balance': 'Saldo',
		'org.open.finance.report': 'Vollständiger Bericht',
		'org.media.title': 'In den Medien',
		'org.media.subtitle':
			'Unsere Daten & Visualisierungen werden regelmäßig in medialer Berichterstattung aufgegriffen.',
		'org.media.contact': 'Presseanfragen:',
		'org.cta.title': 'Unterstütze unsere Arbeit.',
		'org.cta.text':
			'Als gemeinnütziger Verein sind wir auf Spenden und Förderungen angewiesen. Mit deinem Beitrag ermöglichst du neue Datenprojekte, die die Klimawende beschleunigen.',
		'org.cta.donate': 'Jetzt spenden',
		'org.cta.contact': 'Kontakt aufnehmen',
		...(data.translations ?? {})
	};

	/* ─── Data ─────────────────────────────────────────────── */
	const team: any[] = data.team ?? [];
	const mediaReports: any[] = data.media ?? [];
	const moments: any[] = data.moments ?? [];
	const rawProjects: any[] = data.projects ?? [];
	const events: any[] = data.events ?? [];
	const financeSummary = data.financeSummary ?? null;

	/* ─── Projects: featured → active → done → planned ─────── */
	const sortedProjects = [
		...rawProjects.filter((p) => p.featured),
		...rawProjects.filter((p) => !p.featured && p.status !== 'active' && p.status !== 'planned'),
		...rawProjects.filter((p) => !p.featured && p.status === 'done'),
		...rawProjects.filter((p) => !p.featured && p.status === 'active')
	];

	function projectStatus(p: any): string {
		if (p.featured) return t(tr, 'org.projects.status.featured');
		if (p.status === 'done') return t(tr, 'org.projects.status.done');
		if (p.status === 'planned') return t(tr, 'org.projects.status.planned');
		return t(tr, 'org.projects.status.active');
	}

	/* ─── Moments strip (doubled for seamless loop) ──────────── */
	$: momentsStrip = moments.length ? [...moments, ...moments] : [];

	/* ─── Finance ─────────────────────────────────────────────── */
	function formatEUR(n: number) {
		return new Intl.NumberFormat('de-AT', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(n);
	}

	/* ─── Bio modal ──────────────────────────────────────────── */
	let bioDialog: HTMLDialogElement;
	let selectedMember: any = null;
	function openBio(m: any) {
		selectedMember = m;
		if (browser) bioDialog?.showModal();
	}
	function closeBio() {
		bioDialog?.close();
		selectedMember = null;
	}

	/* ─── Splide options – portrait story format ─────────────── */
	const storyOptions = {
		type: 'loop',
		fixedWidth: 176,
		gap: '0.25rem',
		padding: { left: '1rem', right: '2rem' },
		pagination: false
	};
</script>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 1. HERO                                                      -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section
	class="flex flex-col items-center justify-center overflow-hidden bg-white py-10 text-center dark:bg-gray-950 md:py-14"
>
	<div class="max-w-4xl px-6">
		<h1 class="text-4xl font-bold leading-[1.05] md:text-5xl lg:text-6xl text-balance">
			{t(tr, 'org.hero.title1')}<br />{t(tr, 'org.hero.title2')}
		</h1>
		<p class="mt-4 mx-auto max-w-2xl text-lg leading-snug text-balance opacity-80">
			{t(tr, 'org.hero.subtitle')}
		</p>
		<div class="mt-7 flex flex-wrap justify-center gap-3">
			<a
				href="#projekte"
				class="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
			>
				{t(tr, 'org.hero.cta.projects')}
			</a>
			<a
				href="/donate"
				class="rounded-full border border-current px-6 py-2.5 text-sm font-semibold opacity-60 transition hover:opacity-100"
			>
				{t(tr, 'org.hero.cta.support')}
			</a>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- MOMENTS STRIP                                                -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if momentsStrip.length}
	<div class="overflow-hidden border-b border-t border-current/10 bg-black py-1" aria-hidden="true">
		<div class="moments-strip flex gap-1">
			{#each momentsStrip as moment}
				{#if moment.image?.id}
					<div class="group relative h-52 shrink-0">
						<img
							src="https://base.klimadashboard.org/assets/{moment.image.id}?key=small"
							alt=""
							class="h-full w-auto object-cover"
						/>
						{#if moment.title}
							<div
								class="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<p class="text-xs font-medium leading-tight text-white">{moment.title}</p>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 2. PROJEKTE                                                  -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section id="projekte" class="pt-16">
	<div class="mb-4 px-4 text-center">
		<h2 class="text-4xl font-bold">{t(tr, 'org.projects.title')}</h2>
		<p class="mt-1 mx-auto max-w-2xl text-lg leading-snug text-balance opacity-80">
			{t(tr, 'org.projects.subtitle')}
		</p>
	</div>
	{#if sortedProjects.length > 5}
		<Splide
			class="m-1"
			options={{
				gap: '0.25rem',
				type: 'loop',
				fixedWidth: '20rem',
				arrows: false
			}}
		>
			{#each sortedProjects as project}
				<SplideSlide>
					<a
						href={project.link || '#'}
						target={project.link?.startsWith('http') ? '_blank' : undefined}
						rel="noopener noreferrer"
						class="flex h-full min-h-[290px] max-w-sm w-full flex-col rounded-xl p-4 transition {project.featured
							? 'bg-gradient-green text-white'
							: 'border border-current/10 bg-current/5 hover:bg-current/10'}"
					>
						<span
							class="inline-block self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest {project.featured
								? 'bg-black/10'
								: 'bg-current/10'}"
						>
							{projectStatus(project)}
						</span>
						<div class="mt-auto pt-4">
							<h3 class="text-xl font-bold leading-tight">{project.title}</h3>
							{#if project.summary}
								<p class="mt-1 line-clamp-4 leading-tight text-balance">
									{project.summary}
								</p>
							{/if}
						</div>
					</a>
				</SplideSlide>
			{/each}
		</Splide>
	{/if}
</section>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 3. TEAM                                                      -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section id="team" class="pt-16">
	<div class="mb-4 text-center">
		<h2 class="text-4xl font-bold">{t(tr, 'org.team.title')}</h2>
		<p class="mt-1 mx-auto max-w-2xl text-lg leading-snug text-balance opacity-80">
			{t(tr, 'org.team.subtitle')}
		</p>
	</div>

	{#if team.length}
		<Splide
			class="m-1"
			options={{
				gap: '0.25rem',
				type: 'loop',
				fixedWidth: '16rem',
				fixedHeight: '20rem',
				arrows: false,
				autoplay: true
			}}
		>
			{#each team as member}
				<SplideSlide>
					<button
						on:click={() => openBio(member)}
						class="group relative w-full h-full overflow-hidden rounded-xl bg-gray-800 transition hover:scale-[1.02]"
					>
						{#if member.avatar}
							<img
								src="https://base.klimadashboard.org/assets/{member.avatar}?key=small"
								alt=""
								class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
							/>
						{:else}
							<div
								class="absolute inset-0 flex items-center justify-center text-2xl font-bold opacity-20"
							>
								{(member.first_name ?? '?')[0]}{(member.last_name ?? '')[0]}
							</div>
						{/if}
						<div
							class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6"
						>
							<p class="text-xl font-semibold leading-tight text-white">
								{member.first_name}
								{member.last_name}
							</p>
							{#if member.title}
								<p class="text-sm opacity-50 text-white">{member.title}</p>
							{/if}
						</div>
					</button>
				</SplideSlide>
			{/each}
		</Splide>
	{/if}
</section>

<!-- Bio dialog -->
<dialog
	bind:this={bioDialog}
	on:click|self={closeBio}
	class="m-auto w-full max-w-md rounded-2xl bg-white p-0 backdrop:bg-black/60 dark:bg-gray-900 dark:text-white"
>
	{#if selectedMember}
		<div class="relative">
			{#if selectedMember.avatar}
				<div class="h-80 overflow-hidden rounded-t-2xl">
					<img
						src="https://base.klimadashboard.org/assets/{selectedMember.avatar}?key=medium"
						alt=""
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}
			<button
				on:click={closeBio}
				class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
				aria-label="Schließen"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
			<div class="p-5">
				{#if selectedMember.title}
					<p class="mb-1 text-xs font-bold uppercase tracking-widest opacity-80">
						{selectedMember.title}
					</p>
				{/if}
				<h3 class="text-xl font-bold">{selectedMember.first_name} {selectedMember.last_name}</h3>
				{#if selectedMember.description}
					<p class="mt-3 text-sm leading-relaxed opacity-80">{selectedMember.description}</p>
				{:else}
					<p class="mt-3 text-sm opacity-80">{selectedMember.title}</p>
				{/if}
			</div>
		</div>
	{/if}
</dialog>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 4. OFFENE GRUNDSÄTZE                                        -->
<!-- ═══════════════════════════════════════════════════════════ -->

{#snippet openCard(title, text, links)}
	<div class="text-center">
		<h2 class="text-2xl font-bold">{title}</h2>
		<p class="leading-tight mt-1 mb-2">{text}</p>
		{#each links as link}
			<a
				href={link.url}
				target="_blank"
				rel="noopener noreferrer"
				class="m-1 inline-flex items-center gap-1.5 rounded-full border border-current/25 px-3 py-1.5 text-xs font-semibold transition hover:border-current/50 hover:bg-current/10"
			>
				{link.label}
			</a>
		{/each}
	</div>
{/snippet}

<section
	id="grundsaetze"
	class="bg-current/5 p-6 rounded-2xl mt-16 grid max-w-7xl mx-auto md:grid-cols-3 gap-10"
>
	{@render openCard(t(tr, 'org.open.source.title'), t(tr, 'org.open.source.text'), [
		{
			url: 'https://github.com/klimadashboard',
			label: 'GitHub'
		}
	])}
	{@render openCard(t(tr, 'org.open.data.title'), t(tr, 'org.open.data.text'), [
		{
			url: 'https://github.com/klimadashboard',
			label: 'GitHub'
		},
		{
			url: 'https://api.klimadashboard.org',
			label: 'API (Beta)'
		}
	])}
	{@render openCard(t(tr, 'org.open.finance.title'), t(tr, 'org.open.finance.text'), [
		{
			url: '/finance',
			label: 'Open Finance'
		}
	])}
</section>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 5. IN DEN MEDIEN                                             -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if mediaReports.length}
	<section id="presse" class="pt-16 dark:bg-gray-900/40">
		<div class="">
			<h2 class="text-4xl font-bold text-center">{t(tr, 'org.media.title')}</h2>
			<p class="mt-1 mx-auto max-w-2xl text-lg leading-snug text-balance text-center opacity-80">
				{t(tr, 'org.media.subtitle')}
			</p>
		</div>

		<Splide
			class="m-1 mt-4"
			options={{
				gap: '0.25rem',
				type: 'loop',
				fixedWidth: '16rem',
				fixedHeight: '20rem',
				arrows: false
			}}
		>
			{#each mediaReports as item}
				<SplideSlide>
					<a
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
						class="flex h-full flex-col rounded-xl bg-gray-900 p-4 text-white transition hover:bg-gray-800"
					>
						<div class="mb-auto flex h-7 items-center">
							{#if item.medium?.logo}
								<img
									src="https://base.klimadashboard.org/assets/{item.medium.logo}"
									alt={item.medium.name ?? ''}
									class="max-h-5 max-w-[90px] object-contain brightness-0 invert"
								/>
							{:else if item.medium?.name}
								<span class="text-sm font-bold opacity-50">{item.medium.name}</span>
							{/if}
						</div>
						<div class="mt-auto">
							<h4 class="font-condensed text-2xl font-bold leading-tight hyphens-auto">
								{item.title}
							</h4>
							{#if item.date}
								<p class="mt-1.5 text-sm opacity-30">
									{dayjs(item.date).format('DD.MM.YYYY')}
								</p>
							{/if}
						</div>
					</a>
				</SplideSlide>
			{/each}
		</Splide>
	</section>
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 6. EVENTS                                                    -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if events.length}
	<section id="events" class="py-16">
		<div class="mx-auto max-w-7xl px-4">
			<h2 class="mb-1 text-4xl font-bold text-center">{t(tr, 'org.events.title')}</h2>
			<p class="mt-1 mx-auto max-w-2xl text-lg leading-snug text-balance opacity-80 text-center">
				{t(tr, 'org.events.subtitle')}
			</p>
			<div class="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
				{#each events as event}
					<div class="flex flex-col rounded-xl border border-current/10 bg-current/5 p-5">
						{#if event.date}
							<p class="mb-2 text-xs font-bold uppercase tracking-widest opacity-40">
								{dayjs(event.date).format('DD. MMMM YYYY')}
							</p>
						{/if}
						<h3 class="text-xl font-bold leading-tight">{event.title}</h3>
						{#if event.location}
							<p class="mt-1 text-sm opacity-50">{event.location}</p>
						{/if}
						{#if event.description}
							<p class="mt-3 line-clamp-3 text-sm leading-snug opacity-60">{event.description}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- FOOTER CTA                                                   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section class="bg-black py-20 text-white">
	<div class="mx-auto max-w-3xl px-4 text-center">
		<h2 class="text-balance text-4xl font-bold md:text-5xl">{t(tr, 'org.cta.title')}</h2>
		<p class="mt-4 text-base opacity-50 md:text-lg">{t(tr, 'org.cta.text')}</p>
		<div class="mt-10 flex flex-wrap justify-center gap-1">
			<a
				href="/donate"
				class="rounded-full bg-amber-400 px-8 py-3 text-sm font-bold text-black transition hover:bg-amber-300"
			>
				{t(tr, 'org.cta.donate')}
			</a>
			<a
				href="mailto:team@klimadashboard.org"
				class="rounded-full border border-white/20 px-8 py-3 text-sm font-semibold transition hover:border-white/40"
			>
				{t(tr, 'org.cta.contact')}
			</a>
		</div>
	</div>
</section>

<style>
	/* ── Moments strip ── */
	@keyframes moments-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
	.moments-strip {
		animation: moments-scroll 50s linear infinite;
	}
	.moments-strip:hover {
		animation-play-state: paused;
	}

	/* ── Bio dialog ── */
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
	}
	dialog[open] {
		animation: dialog-in 0.2s ease-out;
	}
	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* ── Splide: show slides before JS initializes ── */
	:global(.splide:not(.is-initialized) .splide__slide) {
		visibility: visible;
	}
</style>
