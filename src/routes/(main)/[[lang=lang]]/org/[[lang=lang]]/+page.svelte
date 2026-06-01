<script lang="ts">
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import { browser } from '$app/environment';
	import { t } from '$lib/utils/t';
	import { Button } from '$lib/components/ui';
	import dayjs from 'dayjs';

	export let data;

	/* ─── i18n ─────────────────────────────────────────────── */
	const trDE: Record<string, string> = {
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
		'org.projects.visit': 'Zum Projekt',
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
		'org.cta.contact': 'Kontakt aufnehmen'
	};

	const trEN: Record<string, string> = {
		'org.kicker': 'Klimadashboard.org',
		'org.hero.title1': 'We make the climate transition',
		'org.hero.title2': 'tangible with data.',
		'org.hero.subtitle':
			'Our interactive dashboards show the challenges, impacts, and solutions of the climate crisis — up to date, regional, and accessible to everyone.',
		'org.hero.cta.projects': 'Our Projects',
		'org.hero.cta.support': 'Support us',
		'org.projects.title': 'Our Projects',
		'org.projects.subtitle':
			'We build data visualisations for Austria, Germany, and the entire European Union.',
		'org.projects.status.featured': 'Project',
		'org.projects.status.active': 'Active',
		'org.projects.status.done': 'Completed',
		'org.projects.status.planned': 'Planned',
		'org.projects.visit': 'Visit project',
		'org.events.title': 'Events',
		'org.events.subtitle':
			'We run workshops, organise exhibitions, and regularly appear at conferences.',
		'org.team.title': 'Our Team',
		'org.team.subtitle':
			'We bring together expertise from science, design, engineering, and communications in our international team.',
		'org.open.title': 'Open by default',
		'org.open.subtitle':
			'Klimadashboard makes climate data accessible to everyone. Our own work is transparent too.',
		'org.open.tag': 'Principle',
		'org.open.source.title': 'Open Source',
		'org.open.source.text': 'Our software is open to all — to inspect, copy, and improve.',
		'org.open.data.title': 'Open Data',
		'org.open.data.text': 'We make datasets accessible — traceable, verifiable, and reusable.',
		'org.open.finance.title': 'Open Finance',
		'org.open.finance.text': 'We publish our budgets, expenses, and income.',
		'org.open.finance.income': 'Income',
		'org.open.finance.expenses': 'Expenses',
		'org.open.finance.balance': 'Balance',
		'org.open.finance.report': 'Full Report',
		'org.media.title': 'In the Media',
		'org.media.subtitle': 'Our data & visualisations are regularly picked up in media coverage.',
		'org.media.contact': 'Press enquiries:',
		'org.cta.title': 'Support our work.',
		'org.cta.text':
			'As a non-profit, we depend on donations and grants. Your contribution enables new data projects that accelerate the climate transition.',
		'org.cta.donate': 'Donate now',
		'org.cta.contact': 'Get in touch'
	};

	$: tr = {
		...(data.language?.code === 'en' ? trEN : trDE),
		...(data.translations ?? {})
	} as Record<string, string>;

	/* ─── Data ─────────────────────────────────────────────── */
	const team: any[] = data.team ?? [];
	const mediaReports: any[] = data.media ?? [];
	const moments: any[] = data.moments ?? [];
	const rawProjects: any[] = data.projects ?? [];
	const events: any[] = data.events ?? [];
	const financeSummary = data.financeSummary ?? null;

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

	/* ─── Projects: featured → active → done → planned ─────── */
	const sortedProjects = [
		...rawProjects.filter((p) => p.featured),
		...rawProjects.filter((p) => !p.featured && p.status === 'active'),
		...rawProjects.filter((p) => !p.featured && p.status === 'done'),
		...rawProjects.filter((p) => !p.featured && p.status === 'planned'),
		...rawProjects.filter((p) => !p.featured && !['active', 'done', 'planned'].includes(p.status))
	];

	/* ─── Project popup ──────────────────────────────────────── */
	let projectDialog: HTMLDialogElement;
	let selectedProject: any = null;
	function openProject(p: any) {
		selectedProject = p;
		if (browser) projectDialog?.showModal();
	}
	function closeProject() {
		projectDialog?.close();
		selectedProject = null;
	}
</script>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 1. HERO                                                      -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section
	class="flex flex-col items-center justify-center overflow-hidden bg-white py-10 text-center dark:bg-gray-950 md:py-14"
>
	<div class="max-w-4xl px-6">
		<h1 class="text-4xl font-bold md:text-5xl lg:text-6xl text-balance">
			{t(tr, 'org.hero.title1')}<br />{t(tr, 'org.hero.title2')}
		</h1>
		<p class="mt-4 mx-auto max-w-2xl text-xl leading-snug text-balance opacity-80">
			{t(tr, 'org.hero.subtitle')}
		</p>
		<div class="mt-7 flex flex-wrap justify-center gap-3">
			<Button variant="primary" size="lg" href="#projekte">{t(tr, 'org.hero.cta.projects')}</Button>
			<Button variant="secondary" size="lg" href="/donate">{t(tr, 'org.hero.cta.support')}</Button>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 2. PROJEKTE – bento grid (directly below hero, no heading)   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section id="projekte" class="pt-2">
	{#if sortedProjects.length}
		<div
			class="grid grid-cols-2 md:grid-cols-6 auto-rows-[11rem] md:auto-rows-[13rem] gap-1 px-1 max-w-7xl mx-auto"
		>
			{#each sortedProjects as project}
				<button
					on:click={() => openProject(project)}
					class="relative rounded-xl overflow-hidden group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-current cursor-pointer
					       {project.featured ? 'col-span-2 row-span-1 md:row-span-2' : 'col-span-1 row-span-1'}
					       {!project.image?.id
						? project.featured
							? 'bg-gradient-green text-white'
							: 'bg-current/5 border border-current/10'
						: 'bg-gray-800 text-white'}
					       "
				>
					{#if project.image?.id}
						<img
							src="https://base.klimadashboard.org/assets/{project.image.id}?key=medium"
							alt=""
							class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
						/>
					{/if}
					<div
						class="absolute inset-0 bg-gradient-to-t {project.image?.id
							? 'from-black/80 via-black/20 to-transparent'
							: project.featured
								? 'from-black/20 to-transparent'
								: 'from-transparent to-transparent'}"
					></div>
					<div class="absolute inset-x-0 bottom-0 p-3 md:p-4">
						<h3
							class="font-bold leading-tight
							       {project.featured ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}
							       {project.image?.id || project.featured ? 'text-white' : ''}"
						>
							{project.title}
						</h3>
						{#if project.summary && project.featured}
							<p class="mt-0.5 text-sm text-white/80 line-clamp-2 leading-snug">
								{project.summary}
							</p>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</section>

<!-- Project popup -->
<dialog
	bind:this={projectDialog}
	on:click|self={closeProject}
	class="m-auto w-full max-w-lg rounded-2xl bg-white p-0 backdrop:bg-black/60 dark:bg-gray-900 dark:text-white"
>
	{#if selectedProject}
		<div class="relative">
			{#if selectedProject.image?.id}
				<div class="h-56 overflow-hidden rounded-t-2xl">
					<img
						src="https://base.klimadashboard.org/assets/{selectedProject.image.id}?key=medium"
						alt=""
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}
			<button
				on:click={closeProject}
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
				<span
					class="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-current/10 mb-3"
				>
					{projectStatus(selectedProject)}
				</span>
				<h2 class="text-2xl font-bold leading-tight">{selectedProject.title}</h2>
				{#if selectedProject.description}
					<p class="mt-3 text-sm leading-relaxed opacity-75">{selectedProject.description}</p>
				{:else if selectedProject.summary}
					<p class="mt-3 text-sm leading-relaxed opacity-75">{selectedProject.summary}</p>
				{/if}
				{#if selectedProject.link}
					<Button
						variant="primary"
						size="lg"
						href={selectedProject.link}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-5"
					>
						{t(tr, 'org.projects.visit')}
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
						</svg>
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</dialog>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- MOMENTS STRIP                                                -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if momentsStrip.length}
	<div class="overflow-hidden border-b border-t border-current/10 bg-black py-1 mt-16" aria-hidden="true">
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
<!-- 3. TEAM – slider on mobile, grid on desktop                  -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section id="team" class="pt-16">
	<div class="mb-4 text-center">
		<h2 class="text-4xl font-bold">{t(tr, 'org.team.title')}</h2>
		<p class="mt-1 mx-auto max-w-2xl text-lg leading-snug text-balance opacity-80">
			{t(tr, 'org.team.subtitle')}
		</p>
	</div>

	{#if team.length}
		<!-- Mobile: Splide carousel -->
		<div class="md:hidden">
			<Splide
				class="m-1 pb-8"
				options={{
					gap: '0.25rem',
					type: 'loop',
					fixedWidth: '10rem',
					fixedHeight: '13rem',
					padding: { left: '1rem', right: '2rem' },
					arrows: false,
					pagination: true,
					autoplay: true
				}}
			>
				{#each team as member}
					<SplideSlide>
						<a
							href="team/{member.id}"
							class="group relative block h-full w-full overflow-hidden rounded-xl bg-gray-800"
						>
							{#if member.avatar}
								<img
									src="https://base.klimadashboard.org/assets/{member.avatar}?key=small"
									alt=""
									class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
								/>
							{:else}
								<div
									class="absolute inset-0 flex items-center justify-center text-xl font-bold text-white opacity-30"
								>
									{(member.first_name ?? '?')[0]}{(member.last_name ?? '')[0]}
								</div>
							{/if}
							<div
								class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6"
							>
								<p class="text-sm font-semibold leading-tight text-white">
									{member.first_name}
									{member.last_name}
								</p>
								{#if member.title}
									<p class="text-xs text-white/50">{member.title}</p>
								{/if}
							</div>
						</a>
					</SplideSlide>
				{/each}
			</Splide>
		</div>

		<!-- Desktop: full grid -->
		<div
			class="hidden md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 px-1 max-w-7xl mx-auto"
		>
			{#each team as member}
				<a
					href="team/{member.id}"
					class="group relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-800"
				>
					{#if member.avatar}
						<img
							src="https://base.klimadashboard.org/assets/{member.avatar}?key=small"
							alt=""
							class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
						/>
					{:else}
						<div
							class="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white opacity-30"
						>
							{(member.first_name ?? '?')[0]}{(member.last_name ?? '')[0]}
						</div>
					{/if}
					<div
						class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 transition duration-200 opacity-80 group-hover:opacity-100"
					>
						<p class="font-semibold leading-tight text-white">
							{member.first_name}
							{member.last_name}
						</p>
						{#if member.title}
							<p class="text-sm text-white/70">{member.title}</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 4. OFFENE GRUNDSÄTZE                                        -->
<!-- ═══════════════════════════════════════════════════════════ -->

{#snippet openCard(title, text, links)}
	<div class="text-center">
		<h2 class="text-2xl font-bold">{title}</h2>
		<p class="leading-tight mt-1 mb-2">{text}</p>
		{#each links as link}
			<Button
				variant="secondary"
				size="sm"
				href={link.url}
				target="_blank"
				rel="noopener noreferrer"
				class="m-1"
			>
				{link.label}
			</Button>
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
	<section id="presse" class="pt-16 max-w-7xl mx-auto px-1">
		<Splide
			hasTrack={false}
			options={{
				gap: '0.25rem',
				type: 'loop',
				fixedWidth: '16rem',
				fixedHeight: '20rem',
				pagination: true
			}}
		>
			<!-- Title row with arrows on the right, Gallery.svelte style -->
			<div class="flex items-end border-b border-current/10 pb-2 mb-3 px-1">
				<div>
					<h2 class="text-2xl font-bold">{t(tr, 'org.media.title')}</h2>
					<p class="text-sm opacity-60">{t(tr, 'org.media.subtitle')}</p>
				</div>
				<div class="ml-auto flex gap-1 splide__arrows">
					<button class="splide__arrow splide__arrow--prev" aria-label="Zurück">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" />
						</svg>
					</button>
					<button class="splide__arrow splide__arrow--next" aria-label="Weiter">
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" />
						</svg>
					</button>
				</div>
			</div>
			<SplideTrack>
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
										class="max-h-5 max-w-[90px] object-contain"
									/>
								{:else if item.medium?.name}
									<span class="text-sm font-bold opacity-70">{item.medium.name}</span>
								{/if}
							</div>
							<div class="mt-auto">
								<h4 class="text-2xl font-bold leading-tight hyphens-auto">
									{item.title}
								</h4>
								{#if item.date}
									<p class="mt-1.5 text-sm opacity-70">
										{dayjs(item.date).format('DD.MM.YYYY')}
									</p>
								{/if}
							</div>
						</a>
					</SplideSlide>
				{/each}
			</SplideTrack>
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
<section class="">
	<div class="mx-auto max-w-3xl px-4 text-center">
		<h2 class="text-balance text-4xl font-bold md:text-5xl">{t(tr, 'org.cta.title')}</h2>
		<p class="mt-4 text-base opacity-50 md:text-lg">{t(tr, 'org.cta.text')}</p>
		<div class="mt-10 flex flex-wrap justify-center gap-1">
			<Button variant="accent" size="xl" href="/donate">{t(tr, 'org.cta.donate')}</Button>
			<Button variant="secondary" size="xl" href="mailto:team@klimadashboard.org"
				>{t(tr, 'org.cta.contact')}</Button
			>
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

	/* ── Dialogs ── */
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

	/* ── Splide arrows – inline, Gallery.svelte style ── */
	:global(.splide__arrow) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		opacity: 0.55;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}
	:global(.splide__arrow:hover:not(:disabled)) {
		opacity: 1;
	}
	:global(.splide__arrow:disabled) {
		opacity: 0.2;
		cursor: default;
	}
	:global(.splide__arrow svg) {
		width: 1.375rem;
		height: 1.375rem;
	}

	/* ── Splide pagination dots – pill style ── */
	:global(.splide__pagination) {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.3rem;
		padding: 0.65rem 0 0;
		list-style: none;
		margin: 0;
	}
	:global(.splide__pagination__page) {
		display: block;
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 9999px;
		background: currentColor;
		opacity: 0.25;
		border: none;
		padding: 0;
		cursor: pointer;
		transition:
			opacity 0.2s,
			width 0.25s ease;
	}
	:global(.splide__pagination__page.is-active) {
		opacity: 0.7;
		width: 1.5rem;
	}
</style>
