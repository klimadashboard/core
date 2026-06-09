<script lang="ts">
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

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
		'org.cta.contact': 'Kontakt aufnehmen',
		'org.wwd.title': 'Wie wir arbeiten',
		'org.wwd.1.title': 'Klimawissenschaft übersetzen',
		'org.wwd.1.text':
			'Die Daten & Fakten von anerkannten Institutionen bereiten wir leicht verständlich für alle auf. So ermöglichen wir datenbasierten Diskurs und Entscheidungen.',
		'org.wwd.2.title': 'Open Source, Data, Finance',
		'org.wwd.2.text':
			'Wir legen unseren Code, unsere Daten und unsere Finanzen offen. Die Transparenz, die wir von anderen fordern, leben wir selbst. Und wir freuen uns, wenn wir kopiert werden.',
		'org.wwd.3.title': 'Bewusstsein durch Aufmerksamkeit',
		'org.wwd.3.text':
			'ZiB1, Falter, APA, DPA, CORRECTIV – viele Medien, aber auch Schulen, Universitäten und Behörden arbeiten mit unseren Visualisierungen.',
		'org.wwd.4.title': 'Unabhängig und gemeinnützig',
		'org.wwd.4.text':
			'Als gemeinnütziger Verein in Österreich sind wir unabhängig von kommerziellen und politischen Interessen. Wir verpflichten uns dem Pariser Klimaabkommen und wissenschaftlichen Standards.',
		'org.wwd.5.title': 'Vor Ort & up-to-date',
		'org.wwd.5.text':
			'Mit mehr als 13.000 regionalen Klimadashboards beschleunigen wir die Klimawende bei dir vor Ort – stets aktuell, teils täglich aktualisiert.',
		'org.wwd.6.title': 'Gemeinsam für die Klimawende',
		'org.wwd.6.text':
			'Wir arbeiten eng mit Wissenschaft, Behörden, Medien und Zivilgesellschaft zusammen, damit auf Daten auch Taten folgen.',
		'org.financing.title': '',
		'org.financing.text':
			'Hier kannst du Text einfügen – wie die Projekte bisher finanziert wurden und warum ihr Unterstützung braucht.',
		'org.featured.label': 'Bekannt aus',
		'org.featured.alt': 'Medien, in denen Klimadashboard vertreten ist',
		'org.funded.label': 'Gefördert von',
		'org.funded.alt': 'Förderinnen und Förderer des Klimadashboards',
		'org.events.past': 'Vergangene Events',
		'org.dialog.close': 'Schließen',
		'org.carousel.prev': 'Zurück',
		'org.carousel.next': 'Weiter',
		'org.letter.title': 'Hi, wir sind das Team Klimadashboard!',
		'org.letter.p1':
			'In den letzten fünf Jahren haben wir nicht nur über 13.000 Klimadashboards entwickelt, sondern auch Workshops gegeben, Behörden und Medien beraten, Ausstellungen organisiert und einen gemeinnützigen Verein aufgebaut.',
		'org.letter.p2':
			'Weil wir finden, dass <strong>Fakten für alle</strong> zugänglich sein müssen, sind unsere Dashboards kostenlos und werbefrei. Das war uns immer wichtig und wird so bleiben. Unsere Arbeit wird – neben ehrenamtlichem Einsatz – durch <strong>Förderungen und Spenden</strong> ermöglicht.',
		'org.letter.p3':
			'Wir merken, dass wir <strong>einen Unterschied machen</strong>. Und wollen jetzt den nächsten Schritt gehen, unser Team ausbauen und noch mehr <strong>Datenprojekte in ganz Europa</strong> umsetzen. Wenn du uns dabei unterstützen magst, <a href="mailto:team@klimadashboard.org" class="underline decoration-1 underline-offset-2">schreib uns</a> oder <a href="https://klimadashboard.org/donate" class="underline decoration-1 underline-offset-2">spende an das Klimadashboard</a>. Danke für deine Unterstützung!'
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
		'org.cta.contact': 'Get in touch',
		'org.wwd.title': 'What we do',
		'org.wwd.1.title': 'Translating climate science',
		'org.wwd.1.text':
			'We translate data & facts from recognised institutions into easy-to-understand formats for everyone — enabling data-driven discourse and decisions.',
		'org.wwd.2.title': 'Open Source, Data, Finance',
		'org.wwd.2.text':
			'We publish our code, data, and finances openly. We practise the transparency we demand from others. And we are happy to be copied.',
		'org.wwd.3.title': 'Awareness through attention',
		'org.wwd.3.text':
			'ZiB2, Falter, APA, DPA, CORRECTIV — many media outlets, as well as schools, universities, and authorities, use our visualisations.',
		'org.wwd.4.title': 'Independent & non-profit',
		'org.wwd.4.text':
			'As a non-profit association in Austria, we are independent of commercial and political interests. We are committed to the Paris Agreement and scientific standards.',
		'org.wwd.5.title': 'Local & up to date',
		'org.wwd.5.text':
			'With more than 13,000 regional climate dashboards, we accelerate the climate transition in your area — always current, sometimes updated daily.',
		'org.wwd.6.title': 'Together for the climate transition',
		'org.wwd.6.text':
			'We work closely with science, authorities, media, and civil society to ensure that data leads to action.',
		'org.financing.title': 'How is this financed?',
		'org.financing.text':
			'Add your text here — how these projects have been financed so far and why you need support.',
		'org.featured.label': 'Featured in',
		'org.featured.alt': 'Media outlets that have featured Klimadashboard',
		'org.funded.label': 'Funded by',
		'org.funded.alt': 'Funders of Klimadashboard',
		'org.events.past': 'Past Events',
		'org.dialog.close': 'Close',
		'org.carousel.prev': 'Previous',
		'org.carousel.next': 'Next',
		'org.letter.title': 'Hi, we are the Klimadashboard team!',
		'org.letter.p1':
			'Over the past five years, we have not only built more than 13,000 climate dashboards, but also run workshops, advised authorities and media, organised exhibitions, and established a non-profit association.',
		'org.letter.p2':
			'Because we believe that <strong>facts must be accessible to everyone</strong>, our dashboards are free of charge and ad-free. This has always mattered to us and will remain so. Our work is made possible — alongside volunteer effort — through <strong>grants and donations</strong>.',
		'org.letter.p3':
			'We can see that we <strong>are making a difference</strong>. And we now want to take the next step, grow our team, and realise even more <strong>data projects across Europe</strong>. If you\'d like to support us, <a href="mailto:team@klimadashboard.org" class="underline decoration-1 underline-offset-2">write to us</a> or <a href="https://klimadashboard.org/donate" class="underline decoration-1 underline-offset-2">donate to Klimadashboard</a>. Thank you for your support!'
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
	const pastEvents: any[] = data.pastEvents ?? [];
	const financeSummary = data.financeSummary ?? null;

	function projectStatus(p: any): string {
		if (p.featured) return t(tr, 'org.projects.status.featured');
		if (p.status === 'done') return t(tr, 'org.projects.status.done');
		if (p.status === 'planned') return t(tr, 'org.projects.status.planned');
		return t(tr, 'org.projects.status.active');
	}

	/* ─── Moments strips: shuffle once, split 50/50, no repeats ── */
	const shuffledMoments = [...moments].sort(() => Math.random() - 0.5);
	const mid = Math.ceil(shuffledMoments.length / 2);
	const momentsStrip1 = shuffledMoments.slice(0, mid);
	const momentsStrip2 = shuffledMoments.slice(mid);

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

	/* ─── Scroll-linked photo strips + letter parallax ─────── */
	let strip1El: HTMLElement | null = null;
	let strip2El: HTMLElement | null = null;
	let strip1X = 0;
	let strip2X = 0;
	let letterEl: HTMLElement | null = null;
	let letterY = 0;

	function handleScroll() {
		if (strip1El) {
			const rect = strip1El.getBoundingClientRect();
			strip1X = -(rect.top + rect.height / 2 - window.innerHeight / 2) * 0.1;
		}
		if (strip2El) {
			const rect = strip2El.getBoundingClientRect();
			strip2X = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.1;
		}
		if (letterEl) {
			const rect = letterEl.getBoundingClientRect();
			letterY = -(rect.top + rect.height / 2 - window.innerHeight / 2) * 0.06;
		}
	}

	onMount(() => handleScroll());

	const defaultSplideOptions = {
		gap: '0.25rem',
		type: 'slide' as const,
		perPage: 3,
		perMove: 3,
		pagination: false,
		breakpoints: {
			640: { perPage: 1, perMove: 1 },
			960: { perPage: 2, perMove: 2 }
		}
	};
</script>

<svelte:window on:scroll={handleScroll} />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 1. HERO                                                      -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section
	class="flex flex-col items-center justify-center overflow-hidden bg-white text-center dark:bg-gray-950 pt-10 pb-4"
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
<!-- BEKANNT AUS                                                   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<a class=" flex flex-col items-center p-4" href="#presse">
	<p class="text-xs font-bold uppercase tracking-widest opacity-60 text-center">
		{t(tr, 'org.featured.label')}
	</p>

	<img
		src="https://base.klimadashboard.org/assets/b5e9bf34-6190-481e-8656-a79caf828f14"
		alt={t(tr, 'org.featured.alt')}
		class="max-w-sm w-full saturate-0 hover:saturate-100 transition -mt-2 dark:hidden"
	/>

	<img
		src="https://base.klimadashboard.org/assets/90a6898e-88a2-4820-9361-1adca0345eb4"
		alt={t(tr, 'org.featured.alt')}
		class="max-w-sm w-full saturate-0 hover:saturate-100 transition -mt-2 not-dark:hidden"
	/>
</a>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 2. PROJEKTE – bento grid (directly below hero, no heading)   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section id="projekte" class="pt-2">
	{#if sortedProjects.length}
		<div
			class="grid grid-cols-2 md:grid-cols-6 auto-rows-[9rem] md:auto-rows-[9rem] gap-1 px-1 max-w-7xl mx-auto"
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
				aria-label={t(tr, 'org.dialog.close')}
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
					<p class="mt-3 text-sm leading-relaxed opacity-75">{@html selectedProject.description}</p>
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
<!-- LETTER – team message                                        -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section class="relative z-10 -my-6 px-4 py-12 flex justify-center">
	<div
		class="letter-wrapper max-w-xl w-full"
		bind:this={letterEl}
		style="transform: rotate(-1.5deg) translateY({letterY}px);"
	>
		<div class="letter-paper handwriting relative rounded p-8 pb-4">
			{#if team.length}
				<div class="flex flex-row flex-wrap gap-1 mb-5">
					{#each team as member}
						{#if member.avatar}
							<img
								src="https://base.klimadashboard.org/assets/{member.avatar}?key=small"
								alt={member.first_name}
								class="w-9 h-9 rounded-full object-cover ring-2 ring-[#fef9e4] shrink-0"
							/>
						{:else}
							<div
								class="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-900 ring-2 ring-[#fef9e4] shrink-0"
							>
								{(member.first_name ?? '?')[0]}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
			<h2 class="text-2xl md:text-3xl font-bold leading-[28px] mb-1">
				{t(tr, 'org.letter.title')}
			</h2>

			<div class="letter-lined-area">
				<p class="letter-text mb-[28px]">
					{t(tr, 'org.letter.p1')}
				</p>
				<p class="letter-text mb-[28px]">
					{@html t(tr, 'org.letter.p2')}
				</p>
				<p class="letter-text">
					{@html t(tr, 'org.letter.p3')}
				</p>
			</div>

			{#if team.length}
				<p class="text-sm mt-8 opacity-80 leading-snug">
					{team.map((m) => m.first_name).join(', ')}
				</p>
			{/if}
		</div>
	</div>
</section>

{#snippet splideArrows()}
	<button class="splide__arrow splide__arrow--prev" aria-label={t(tr, 'org.carousel.prev')}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg
		>
	</button>
	<button class="splide__arrow splide__arrow--next" aria-label={t(tr, 'org.carousel.next')}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg
		>
	</button>
{/snippet}

{#snippet splideSection(
	id: string,
	title: string,
	subtitle: string,
	arrowsClass: string,
	slides: any
)}
	<section {id} class="pt-16 max-w-7xl mx-auto px-1">
		<Splide hasTrack={false} options={defaultSplideOptions}>
			<div class="flex items-end border-b border-current/10 pb-2 mb-3 px-1">
				<div>
					<h2 class="text-2xl font-bold">{title}</h2>
					<p class="text-sm opacity-60">{subtitle}</p>
				</div>
				<div class="ml-auto flex gap-1 splide__arrows {arrowsClass}">
					{@render splideArrows()}
				</div>
			</div>
			<SplideTrack>
				{@render slides()}
			</SplideTrack>
		</Splide>
	</section>
{/snippet}

{#snippet mediaSlides()}
	{#each mediaReports as item}
		<SplideSlide class="h-52">
			<a
				href={item.link}
				target="_blank"
				rel="noopener noreferrer"
				style="background: linear-gradient(to top right, #093637, #44a08d);"
				class="flex h-full flex-col rounded-xl p-4 text-white transition"
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
					<h4 class="text-2xl font-light leading-tight hyphens-auto text-balance">
						{item.title}
					</h4>
					{#if item.date}
						<p class="mt-1.5 text-sm opacity-70">{dayjs(item.date).format('DD.MM.YYYY')}</p>
					{/if}
				</div>
			</a>
		</SplideSlide>
	{/each}
{/snippet}

{#snippet eventSlides()}
	{#each events as event}
		<SplideSlide class="h-32">
			<div class="flex h-full flex-col rounded-xl border border-current/10 bg-current/5 p-4">
				{#if event.date}
					<p class="mb-1 text-xs font-bold uppercase tracking-widest opacity-40">
						{dayjs(event.date).format('DD. MMMM YYYY')}
					</p>
				{/if}
				<h3 class="text-base font-bold leading-tight">{event.title}</h3>
				{#if event.location}
					<p class="mt-0.5 text-sm opacity-50">{event.location}</p>
				{/if}
			</div>
		</SplideSlide>
	{/each}
{/snippet}

{#snippet openSlides()}
	<SplideSlide class="h-32">
		<div class="flex h-full flex-col rounded-xl border border-current/10 bg-current/5 p-4">
			<h3 class="text-base font-bold">{t(tr, 'org.open.source.title')}</h3>
			<p class="mt-1 text-sm leading-snug opacity-70">{t(tr, 'org.open.source.text')}</p>
			<div class="mt-auto flex flex-wrap gap-1 pt-2">
				<Button
					variant="secondary"
					size="sm"
					href="https://github.com/klimadashboard"
					target="_blank"
					rel="noopener noreferrer">GitHub</Button
				>
			</div>
		</div>
	</SplideSlide>
	<SplideSlide class="h-32">
		<div class="flex h-full flex-col rounded-xl border border-current/10 bg-current/5 p-4">
			<h3 class="text-base font-bold">{t(tr, 'org.open.data.title')}</h3>
			<p class="mt-1 text-sm leading-snug opacity-70">{t(tr, 'org.open.data.text')}</p>
			<div class="mt-auto flex flex-wrap gap-1 pt-2">
				<Button
					variant="secondary"
					size="sm"
					href="https://github.com/klimadashboard"
					target="_blank"
					rel="noopener noreferrer">GitHub</Button
				>
				<Button
					variant="secondary"
					size="sm"
					href="https://api.klimadashboard.org"
					target="_blank"
					rel="noopener noreferrer">API (Beta)</Button
				>
			</div>
		</div>
	</SplideSlide>
	<SplideSlide class="h-32">
		<div class="flex h-full flex-col rounded-xl border border-current/10 bg-current/5 p-4">
			<h3 class="text-base font-bold">{t(tr, 'org.open.finance.title')}</h3>
			<p class="mt-1 text-sm leading-snug opacity-70">{t(tr, 'org.open.finance.text')}</p>
			<div class="mt-auto flex flex-wrap gap-1 pt-2">
				<Button variant="secondary" size="sm" href="/finance">Open Finance</Button>
			</div>
		</div>
	</SplideSlide>
{/snippet}

{#snippet stripImages(arr: any[])}
	{#each arr as moment}
		{#if moment.image?.id}
			<div class="strip-card relative shrink-0 h-full overflow-hidden rounded-2xl shadow-lg">
				<img
					src="https://base.klimadashboard.org/assets/{moment.image.id}?key=small"
					alt=""
					class="h-full w-auto object-cover"
				/>
				{#if moment.title}
					<div
						class="strip-overlay pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity"
					>
						<p class="text-xs font-medium leading-tight text-white">{moment.title}</p>
					</div>
				{/if}
			</div>
		{/if}
	{/each}
{/snippet}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHOTO STRIP 1 – left-to-right (before What we do)           -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if momentsStrip1.length}
	<div class="overflow-hidden" aria-hidden="true" bind:this={strip1El}>
		<div
			class="flex justify-center gap-1 h-36"
			style="transform: translateX({strip1X}px); will-change: transform;"
		>
			{@render stripImages(momentsStrip1)}
		</div>
	</div>
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- WHAT WE DO                                                   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section class="mt-10 px-1 max-w-7xl mx-auto">
	<div class="flex items-end border-b border-current/10 pb-2 mb-3 px-1">
		<h2 class="text-2xl font-bold">{t(tr, 'org.wwd.title')}</h2>
	</div>
	<div class="grid md:grid-cols-2 gap-4 px-1">
		{#each [1, 2, 3, 4, 5, 6] as n}
			<div>
				<h3 class="font-semibold text-base leading-snug">
					{t(tr, `org.wwd.${n}.title`)}
				</h3>
				<p class="opacity-60 text-sm leading-snug mt-0.5">{t(tr, `org.wwd.${n}.text`)}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHOTO STRIP 2 – right-to-left (after What we do)            -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if momentsStrip2.length}
	<div class="mt-10 overflow-hidden" aria-hidden="true" bind:this={strip2El}>
		<div
			class="flex justify-center gap-1 h-36"
			style="transform: translateX({strip2X}px); will-change: transform;"
		>
			{@render stripImages(momentsStrip2)}
		</div>
	</div>
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- GEFÖRDERT VON                                                 -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="flex flex-col items-center p-4 mt-10">
	<p class="text-xs font-bold uppercase tracking-widest opacity-60 text-center mb-2">
		{t(tr, 'org.funded.label')}
	</p>

	<img
		src="https://base.klimadashboard.org/assets/87e66587-ed85-44fa-bb04-d7a7d04999c3"
		alt={t(tr, 'org.funded.alt')}
		class="max-w-md w-full dark:hidden"
	/>

	<img
		src="https://base.klimadashboard.org/assets/5207074c-2620-49dc-9700-e3fddcfd069d"
		alt={t(tr, 'org.funded.alt')}
		class="max-w-md w-full not-dark:hidden"
	/>
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 3. TEAM – slider on mobile, grid on desktop                  -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section id="team" class="pt-10">
	<div class="flex items-end border-b border-current/10 pb-2 mb-3 px-1 max-w-7xl mx-auto">
		<div>
			<h2 class="text-2xl font-bold">{t(tr, 'org.team.title')}</h2>
			<p class="text-sm opacity-60">{t(tr, 'org.team.subtitle')}</p>
		</div>
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
<!-- 4. IN DEN MEDIEN                                             -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if mediaReports.length}
	{@render splideSection(
		'presse',
		t(tr, 'org.media.title'),
		t(tr, 'org.media.subtitle'),
		'',
		mediaSlides
	)}
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 5. EVENTS                                                    -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if events.length}
	{@render splideSection(
		'events',
		t(tr, 'org.events.title'),
		t(tr, 'org.events.subtitle'),
		events.length <= 3 ? 'invisible' : '',
		eventSlides
	)}
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 5b. PAST EVENTS                                               -->
<!-- ═══════════════════════════════════════════════════════════ -->
{#if pastEvents.length}
	<section class="pt-6 max-w-7xl mx-auto px-1">
		<p class="text-xs font-bold uppercase tracking-widest opacity-40 px-1 mb-2">
			{t(tr, 'org.events.past')}
		</p>
		<div class="flex flex-wrap gap-1">
			{#each pastEvents as event}
				<div
					class="flex flex-col rounded-xl border border-current/10 bg-current/5 px-3 py-2 min-w-[10rem]"
				>
					{#if event.date}
						<p class="text-[10px] font-bold uppercase tracking-widest opacity-40">
							{dayjs(event.date).format('DD. MMM YYYY')}
						</p>
					{/if}
					<p class="text-sm font-semibold leading-snug">{event.title}</p>
					{#if event.location}
						<p class="text-xs opacity-50 mt-0.5">{event.location}</p>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- 6. OPEN BY DEFAULT                                           -->
<!-- ═══════════════════════════════════════════════════════════ -->
{@render splideSection(
	'grundsaetze',
	t(tr, 'org.open.title'),
	t(tr, 'org.open.subtitle'),
	'md:invisible',
	openSlides
)}

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- FOOTER CTA                                                   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<section class="pt-16">
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
	/* ── Handwriting font ── */
	.handwriting {
		font-family: 'Caveat', cursive;
	}

	/* ── Letter paper ── */
	.letter-wrapper {
		/* rotation + parallax translateY applied via inline style */
		filter: drop-shadow(3px 5px 0 rgba(0, 0, 0, 0.06))
			drop-shadow(6px 12px 28px rgba(0, 0, 0, 0.18));
	}
	.letter-paper {
		background-color: #fef9e4;
		/* Lines span the full paper; text baseline sits on each line.
		   With pt-10 (40px) and ~28px heading, body text starts ~68px in.
		   background-position-y: 5px offsets tiles so baseline ≈ 68px lands on a line. */
		background-image: linear-gradient(
			to bottom,
			transparent 21px,
			rgba(160, 130, 55, 0.28) 21px,
			rgba(160, 130, 55, 0.28) 22px,
			transparent 22px
		);
		background-size: 100% 28px;
		background-position: 0 5px;
		color: #1c1609;
	}
	.letter-lined-area {
		/* lines now on .letter-paper — this is a structural wrapper only */
	}
	.letter-text {
		font-size: 20px;
		line-height: 28px;
	}

	/* ── Photo strip hover overlays ── */
	.strip-card:hover .strip-overlay {
		opacity: 1;
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
