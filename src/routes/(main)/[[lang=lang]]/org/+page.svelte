<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import dayjs from 'dayjs';
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/state';

	export let data;

	let url = page.url;

	/** Column-level parallax to keep intra-column spacing uniform (SSR-safe) */
	export function parallaxColumn(node: HTMLElement, { speed = 0.04 } = {}) {
		if (!browser || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			return { update() {}, destroy() {} } as any;
		}
		let frame: number | null = null;
		let lastY = -1;
		const tick = () => {
			frame = null;
			const y = window.scrollY || 0;
			if (y === lastY) return;
			lastY = y;
			node.style.transform = `translateY(${-(y * speed)}px)`;
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(tick);
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		tick();
		return {
			update(p: any) {
				speed = p?.speed ?? speed;
				tick();
			},
			destroy() {
				window.removeEventListener('scroll', onScroll);
				if (frame) cancelAnimationFrame(frame);
			}
		};
	}

	/* ---------------- Data from server (SSR) ---------------- */
	let team: any[] = data.team ?? [];
	let mediaReports: any[] = data.media ?? [];
	let orgEvents: any[] = data.events ?? [];
	let moments: any[] = data.moments ?? [];
	let quotes: any[] = data.quotes ?? [];
	let projects: any[] = data.projects ?? [];

	/* ---------------- Client-side pagination ---------------- */
	const MEDIA_LIMIT = 12;
	const EVENTS_LIMIT = 10;
	const MOMENTS_LIMIT = 12;

	let mediaPage = 1;
	let eventsPage = 1;
	let momentsPage = 1;

	let mediaHasMore = mediaReports.length === MEDIA_LIMIT;
	let eventsHasMore = orgEvents.length === EVENTS_LIMIT;
	let momentsHasMore = moments.length === MOMENTS_LIMIT;

	/* ---------------- Helpers & card mappers ---------------- */
	function shuffle<T>(arr: T[]) {
		const a = arr.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
	const compact = <T,>(xs: (T | null | undefined)[]) => xs.filter(Boolean) as T[];

	type Card =
		| {
				key: string;
				type: 'member';
				first_name: string;
				last_name: string;
				avatar?: string;
				role?: string;
		  }
		| {
				key: string;
				type: 'value';
				title: string;
				body: string;
				icon: string;
				tag: 'Value';
				links?: { url: string; label: string }[];
		  }
		| {
				key: string;
				type: 'media';
				title: string;
				subtitle?: string;
				href?: string;
				date?: string;
				medium?: any;
		  }
		| {
				key: string;
				type: 'event';
				title: string;
				subtitle?: string;
				date: string;
				date_end?: string;
				href: string;
				location?: string;
		  }
		| {
				key: string;
				type: 'project';
				title: string;
				subtitle?: string;
				href: string;
				status: string;
				tag: 'Project';
		  }
		| { key: string; type: 'moment'; title?: string; copyright?: string; image?: string }
		| {
				key: string;
				type: 'quote';
				text: string;
				author_name?: string;
				author_role?: string;
				image?: string;
		  };

	function mediaToCard(item: any): Card {
		return {
			key: `media:${item.id}`,
			type: 'media',
			title: item.title,
			subtitle: item.summary,
			href: item.link,
			date: item.date,
			medium: item.medium
		};
	}
	function eventToCard(item: any): Card {
		return {
			key: `event:${item.id}`,
			type: 'event',
			title: item.title,
			subtitle: item.subtitle,
			date: item.date,
			date_end: item.date_end,
			href: item.link ?? '#',
			location: item.location
		};
	}
	function momentToCard(item: any): Card {
		return {
			key: `moment:${item.id}`,
			type: 'moment',
			title: item.title,
			copyright: item.copyright,
			image: item.image?.id
		};
	}
	function quoteToCard(item: any): Card {
		return {
			key: `quote:${item.id}`,
			type: 'quote',
			text: item.text,
			author_name: item.author_name,
			author_role: item.author_role,
			image: item.author_image?.id
		};
	}
	function memberToCard(m: any): Card {
		return {
			key: `member:${m.id ?? `${m.first_name}-${m.last_name}`}`,
			type: 'member',
			first_name: m.first_name,
			last_name: m.last_name,
			avatar: m.avatar,
			role: m.title || ''
		};
	}

	function projectToCard(item: any): Card {
		return {
			key: `project:${item.id}`,
			type: 'project',
			title: item.title,
			href: item.link,
			subtitle: item.summary,
			status: item.status,
			tag: 'Project'
		};
	}

	/* Base value cards */
	const baseCards: Card[] = [
		{
			key: 'value:data',
			type: 'value',
			title: 'Open Data',
			body: 'Wir machen Datensätze zugänglich – nachvollziehbar, prüfbar, wiederverwendbar.',
			icon: 'cae5be62-3e2c-4bc4-9867-8013150a69d1',
			tag: 'Value'
		},
		{
			key: 'value:finance',
			type: 'value',
			title: 'Open Finance',
			body: 'Budgets, Ausgaben und Einnahmen legen wir offen.',
			icon: '36861d61-5344-4857-8930-635798b88656',
			tag: 'Value',
			links: [{ url: '/finance', label: 'Einnahmen & Ausgaben' }]
		},
		{
			key: 'value:source',
			type: 'value',
			title: 'Open Source',
			body: 'Unsere Software steht allen offen – zum Prüfen, Kopieren, Verbessern.',
			icon: 'c21c6aed-9a90-425c-927a-dd9775da7a63',
			tag: 'Value',
			links: [{ url: 'https://github.com/klimadashboard', label: 'GitHub' }]
		}
	];

	/* Optional: mix base + team a bit at the top */
	function weave<T>(a: T[], b: T[], ratioA = 1, ratioB = 2) {
		const out: T[] = [];
		let i = 0,
			j = 0;
		while (i < a.length || j < b.length) {
			for (let x = 0; x < ratioA && i < a.length; x++) out.push(a[i++]);
			for (let y = 0; y < ratioB && j < b.length; y++) out.push(b[j++]);
		}
		return out;
	}

	/* Responsive columns */
	let numCols = 1;
	function recomputeCols() {
		if (!browser) return;
		const w = window.innerWidth;
		numCols = w >= 1600 ? 7 : w >= 1024 ? 5 : w >= 900 ? 3 : 2;
	}
	onMount(() => {
		if (!browser) return;
		recomputeCols();
		window.addEventListener('resize', recomputeCols);
	});
	onDestroy(() => {
		if (browser) window.removeEventListener('resize', recomputeCols);
	});

	/* -------- Per-type batches & flattening (media, moments) -------- */
	let mediaBatches: Card[][] = [];
	let momentsBatches: Card[][] = [];
	let mediaInited = false;
	let momentsInited = false;

	$: if (!mediaInited && mediaReports.length) {
		mediaBatches = [shuffle(compact(mediaReports.map(mediaToCard)))];
		mediaInited = true;
	}
	$: if (!momentsInited && moments.length) {
		momentsBatches = [shuffle(compact(moments.map(momentToCard)))];
		momentsInited = true;
	}

	$: mediaCards = mediaBatches.flat();
	$: momentsCards = momentsBatches.flat();

	/* -------- Other pools -------- */
	$: teamCards = shuffle(compact(team.map(memberToCard)));
	$: eventsCards = compact(orgEvents.map(eventToCard)); // keep API sort (date)
	$: quoteCards = compact(quotes.map(quoteToCard));
	$: projectCards = compact(projects.filter((d) => !d.featured).map(projectToCard));

	/* -------- Compose and interleave by type -------- */
	let allCardsBase: Card[] = [];
	let allCardsMixed: Card[] = [];

	$: {
		allCardsBase = []
			.concat(weave(baseCards, teamCards, 1, 2))
			.concat(mediaCards)
			.concat(eventsCards)
			.concat(momentsCards)
			.concat(quoteCards)
			.concat(projectCards);

		// Fully recompute mixed order whenever content changes
		allCardsMixed = interleaveByType(allCardsBase);
	}

	function interleaveByType(cards: Card[]): Card[] {
		const groups: Record<string, Card[]> = {};
		const types: string[] = [];

		for (const c of cards) {
			if (!groups[c.type]) {
				groups[c.type] = [];
				types.push(c.type);
			}
			groups[c.type].push(c);
		}

		const indices: Record<string, number> = {};
		for (const t of types) indices[t] = 0;

		const result: Card[] = [];
		const total = cards.length;

		while (result.length < total) {
			const candidates = types.filter((t) => indices[t] < groups[t].length);
			if (!candidates.length) break;

			const t = candidates[Math.floor(Math.random() * candidates.length)];
			result.push(groups[t][indices[t]++]); // preserve order within each type
		}

		return result;
	}

	/* Filtering */
	const TABS = ['Alles', 'Team', 'Projekte', 'Events', 'Presse', 'Momente'] as const;
	type Tab = (typeof TABS)[number];
	let activeTab: Tab = 'Alles';

	function matchesActiveTab(card: Card, tab: Tab) {
		if (tab === 'Alles') return true;
		if (tab === 'Team') return card.type === 'member';
		if (tab === 'Projekte') return card.type === 'project';
		if (tab === 'Events') return card.type === 'event';
		if (tab === 'Presse') return card.type === 'media';
		if (tab === 'Momente') return card.type === 'moment';
		return true;
	}

	/* ===== Column layout (simple) ===== */
	let columns: Card[][] = [];

	$: {
		const source = allCardsMixed.length ? allCardsMixed : allCardsBase;

		const filtered =
			activeTab === 'Alles' ? source : source.filter((c) => matchesActiveTab(c, activeTab));

		const cols: Card[][] = Array.from({ length: numCols }, () => []);
		filtered.forEach((card, i) => {
			cols[i % numCols].push(card);
		});
		columns = cols;
	}

	/* -------- Load more (append batches; batches shuffled internally) -------- */
	let isLoadingMore = false;

	async function loadMediaPage(pageNum = mediaPage) {
		const directus = getDirectusInstance(fetch);
		try {
			const arr = (await directus.request(
				readItems('org_press_reports', {
					fields: ['id', 'title', 'summary', 'date', 'link', { medium: ['name', 'logo'] }],
					limit: MEDIA_LIMIT,
					offset: pageNum * MEDIA_LIMIT,
					sort: ['-date']
				})
			)) as any[];

			const have = new Set(mediaCards.map((c) => c.key));
			const batch = compact(arr.map(mediaToCard)).filter((c) => !have.has(c.key));
			if (batch.length) mediaBatches = [...mediaBatches, shuffle(batch)];

			mediaHasMore = arr.length === MEDIA_LIMIT;
		} catch (e) {
			console.error('[media loadMore]', e);
			mediaHasMore = false;
		}
	}

	async function loadEventsPage(pageNum = eventsPage) {
		const directus = getDirectusInstance(fetch);
		try {
			const arr = (await directus.request(
				readItems('org_events', {
					fields: ['id', 'title', 'subtitle', 'link', 'date', 'date_end', 'location'],
					limit: EVENTS_LIMIT,
					offset: pageNum * EVENTS_LIMIT,
					sort: ['-date'],
					filter: { date_end: { _lte: '$NOW' } }
				})
			)) as any[];
			const have = new Set(orgEvents.map((e) => e.id));
			const add = arr.filter((x) => !have.has(x.id));
			if (add.length) orgEvents = [...orgEvents, ...add];
			eventsHasMore = arr.length === EVENTS_LIMIT;
		} catch (e) {
			console.error('[events loadMore]', e);
			eventsHasMore = false;
		}
	}

	async function loadMomentsPage(pageNum = momentsPage) {
		const directus = getDirectusInstance(fetch);
		try {
			const arr = (await directus.request(
				readItems('org_moments', {
					fields: ['id', 'title', 'copyright', { image: ['id'] }],
					limit: MOMENTS_LIMIT,
					offset: pageNum * MOMENTS_LIMIT,
					sort: ['-id']
				})
			)) as any[];
			const have = new Set(momentsCards.map((c) => c.key));
			const batch = compact(arr.map(momentToCard)).filter((c) => !have.has(c.key));
			if (batch.length) momentsBatches = [...momentsBatches, shuffle(batch)];
			momentsHasMore = arr.length === MOMENTS_LIMIT;
		} catch (e) {
			console.error('[moments loadMore]', e);
			momentsHasMore = false;
		}
	}

	async function loadMore() {
		if (isLoadingMore) return;
		isLoadingMore = true;

		if (activeTab === 'Presse') {
			if (mediaHasMore) await loadMediaPage(mediaPage++);
		} else if (activeTab === 'Events') {
			if (eventsHasMore) await loadEventsPage(eventsPage++);
		} else if (activeTab === 'Momente') {
			if (momentsHasMore) await loadMomentsPage(momentsPage++);
		} else if (activeTab === 'Alles') {
			if (mediaHasMore) await loadMediaPage(mediaPage++);
			if (eventsHasMore) await loadEventsPage(eventsPage++);
			if (momentsHasMore) await loadMomentsPage(momentsPage++);
		}

		isLoadingMore = false;
	}

	// Subtle per-column speeds & vertical staggers (support up to 7 columns)
	const speeds = [0.0, 0.03, 0.06, 0.09, 0.06, 0.03, 0.0] as const;
	const staggers = [0, 12, 6, 18, 8, 14, 4] as const;

	function speedFor(i: number) {
		return speeds[i % speeds.length];
	}
	function staggerFor(i: number) {
		return staggers[i % staggers.length];
	}
</script>

<!-- Fixed rounded nav (kept as in your last version) -->
<nav
	class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
	role="tablist"
	aria-label="Filter"
>
	<ul
		class="max-w-[60vw] overflow-scroll px-1 py-1 rounded-full border border-current/10 bg-white/80 dark:bg-black/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm flex items-center gap-1"
	>
		{#each TABS as tab}
			<li>
				<button
					type="button"
					aria-selected={activeTab === tab}
					on:click={() => (activeTab = tab)}
					class="px-3 py-1 rounded-full text-sm font-medium transition hover:bg-black hover:text-white dark:hover:text-black dark:hover:bg-white"
					class:bg-black={activeTab === tab}
					class:text-white={activeTab === tab}
					class:dark:text-black={activeTab === tab}
					class:dark:bg-white={activeTab === tab}
				>
					{tab}
				</button>
			</li>
		{/each}
	</ul>
	<a
		href="/donate?returnTo={url}"
		class="text-sm font-bold rounded-full px-3 py-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur bg-amber-300"
		>Spenden</a
	>
</nav>

<div class="m-1">
	<!-- Header / Intro -->
	<div class="max-w-3xl mx-auto mt-16 px-4">
		<h1 class="text-4xl md:text-5xl text-center leading-none hyphens-auto text-balance">
			Wir machen mit Daten & Fakten die Klimawende greifbar.
		</h1>
		<p class="mt-4 text-lg md:text-xl text-center opacity-80 leading-snug">
			Unsere interaktiven Dashboards zeigen Herausforderungen, Auswirkungen und Lösungen. Aktuell,
			regional und zugänglich für alle. Nachrichtensendungen, Hochschulvorträge, TED-Talks,
			Zeitungen und Schulbücher verwenden unsere Visualisierungen.
		</p>

		<div class="grid md:grid-cols-3 gap-1 mt-4">
			{#each data.projects.filter((d) => d.featured) as project}
				<a href={project.link} class="bg-gradient-green rounded-2xl p-3">
					<h3 class="text-2xl">{project.title}</h3>
					<p class="leading-tight text-lg">{project.summary}</p>
				</a>
			{/each}
		</div>
	</div>

	<section class="mt-8">
		<div
			class="grid"
			style="grid-template-columns: repeat({numCols}, minmax(0, 1fr)); gap: 0.25rem; align-items: start;"
		>
			{#each columns as col, i}
				<div
					class="relative will-change-transform"
					use:parallaxColumn={{ speed: speedFor(i) }}
					style="margin-top: {staggerFor(i)}px"
				>
					<div class="flex flex-col gap-1">
						{#each col as card (card.key)}
							{#if card}
								<div in:fly={{ y: 12, opacity: 0, duration: 180 }} out:fade={{ duration: 120 }}>
									<!-- Card (no shadow; just rounded + backgrounds) -->
									{#if card.type === 'member'}
										<div
											class="w-full min-h-[20em] bg-gray-800 relative rounded-2xl overflow-hidden"
										>
											{#if card.avatar}
												<img
													class="absolute inset-0 w-full h-full object-cover"
													src={`https://base.klimadashboard.org/assets/${card.avatar}?key=small`}
													alt=""
												/>
											{/if}
											<div
												class="bg-gradient-to-b from-transparent to-black/50 absolute bottom-0 left-0 right-0 h-1/2 flex flex-col text-white p-3"
											>
												<p class="mt-auto text-xl leading-[1.1em]">
													{card.first_name}
													{card.last_name}
												</p>
												<p class="text-sm opacity-80">{card.role}</p>
											</div>
										</div>
									{:else if card.type === 'value'}
										<div class="p-3 bg-current/5 border border-current/20 rounded-2xl">
											<h3 class="font-bold uppercase tracking-wide text-sm">{card.title}</h3>
											<img
												src="https://base.klimadashboard.org/assets/{card.icon}?key=small"
												class="max-h-24 my-4"
												alt=""
											/>
											<p class="text-lg leading-snug mt-auto">{card.body}</p>
											{#if card.links}
												<ul class="flex gap-2 mt-2 items-center flex-wrap">
													{#each card.links as link}
														<li>
															<a
																href={link.url}
																class="border font-bold hover:bg-black hover:text-white dark:hover:text-black px-2 rounded-full inline-block"
																>{link.label}</a
															>
														</li>
													{/each}
												</ul>
											{/if}
										</div>
									{:else if card.type === 'media'}
										<a
											href={card.href}
											target="_blank"
											class="flex flex-col min-h-[16em] rounded-2xl bg-gray-800 text-white p-3 border border-current/5"
										>
											<p class="text-sm tracking-wider uppercase font-bold mb-8">Medienbericht</p>
											<div class="mt-auto mb-2">
												{#if card.medium?.logo}
													<img
														class="max-h-10 max-w-28"
														src={`https://base.klimadashboard.org/assets/${card.medium.logo}`}
														alt=""
													/>
												{:else}
													<p class="text-sm">{card.medium?.name}</p>
												{/if}
											</div>
											<h3
												class="text-3xl leading-[1.05em] font-condensed font-bold text-balance hyphens-auto"
											>
												{card.title}
											</h3>
										</a>
									{:else if card.type === 'event'}
										<a
											href={card.href}
											class=" rounded-2xl bg-[#386261] text-white p-3 flex flex-col"
										>
											<span class="uppercase text-sm tracking-wide font-bold">Event</span>
											<h3 class=" mt-16 text-2xl md:text-3xl leading-[1.1em] hyphens-auto">
												{card.title}
											</h3>
											<span class="text-sm mt-2">
												{dayjs(card.date).format('DD.MM.YYYY') +
													(card.date_end == card.date
														? ''
														: ' - ' + dayjs(card.date_end).format('DD.MM.YYYY'))}
											</span>
											<span class="text-sm">{card.location}</span>
										</a>
									{:else if card.type === 'project'}
										<a
											href={card.href}
											class="group block rounded-2xl {card.status == 'done'
												? 'bg-[#723145]'
												: 'bg-[#313B72]'} p-3 text-white relative"
										>
											{#if card.href}
												<div class="absolute top-3 right-3 text-white">
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
															d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"
														/><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg
													>
												</div>
											{/if}
											<p class="uppercase text-sm tracking-wide font-bold text-white">
												{data.translations[card.type]} | {data.translations[card.status]}
											</p>
											<h3 class="mt-24 text-2xl leading-[1.1em] hyphens-auto">{card.title}</h3>
											{#if card.subtitle}<p
													class="mt-1 text-base leading-tight hyphens-auto hidden group-hover:block"
												>
													{card.subtitle}
												</p>{/if}
										</a>
									{:else if card.type === 'moment'}
										<div
											class="w-full min-h-[20em] bg-gray-800 relative rounded-2xl overflow-hidden"
										>
											{#if card.image}
												<img
													class="absolute inset-0 w-full h-full object-cover"
													src={`https://base.klimadashboard.org/assets/${card.image}?key=small`}
													alt=""
												/>
											{/if}
											<div
												class="bg-gradient-to-b from-transparent to-black/70 absolute bottom-0 left-0 right-0 flex flex-col text-white p-3 pt-20 pr-6"
											>
												{#if card.title}<p class="text-lg leading-[1.1em] hyphens-auto">
														{card.title}
													</p>{/if}
											</div>
											{#if card.copyright}
												<span
													class="absolute bottom-2 right-2 text-xs text-white opacity-70 select-none"
													style="writing-mode: vertical-rl; transform: rotate(180deg);"
												>
													© {card.copyright}
												</span>
											{/if}
										</div>
									{:else if card.type == 'quote'}
										<div
											class="w-full py-8 border border-current/20 text-black relative rounded-2xl overflow-hidden p-3"
										>
											<p class="text-6xl font-light opacity-50 -translate-x-2">»</p>
											<p class="text-lg leading-snug hyphens-auto">{card.text}</p>
											<p class="text-sm leading-[1.1em] mt-2">
												{card.author_name}, {card.author_role}
											</p>
										</div>
									{:else}
										<div class="p-4 rounded-2xl bg-gray-50 text-sm">Karte</div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Load more -->
		<div class="flex justify-center mt-2 mb-6">
			<button
				type="button"
				on:click={async () => {
					if (isLoadingMore) return;
					isLoadingMore = true;

					if (activeTab === 'Presse') {
						if (mediaHasMore) await loadMediaPage(mediaPage++);
					} else if (activeTab === 'Events') {
						if (eventsHasMore) await loadEventsPage(eventsPage++);
					} else if (activeTab === 'Momente') {
						if (momentsHasMore) await loadMomentsPage(momentsPage++);
					} else if (activeTab === 'Alles') {
						if (mediaHasMore) await loadMediaPage(mediaPage++);
						if (eventsHasMore) await loadEventsPage(eventsPage++);
						if (momentsHasMore) await loadMomentsPage(momentsPage++);
					}

					isLoadingMore = false;
				}}
				disabled={(!mediaHasMore && !eventsHasMore && !momentsHasMore) || isLoadingMore}
				aria-busy={isLoadingMore}
				class="px-4 py-2 rounded-full border border-current/20 hover:border-current/40 disabled:opacity-50 inline-flex items-center gap-2"
			>
				{#if isLoadingMore}
					<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-opacity="0.2"
							stroke-width="4"
						/>
						<path
							d="M22 12a10 10 0 0 1-10 10"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
						/>
					</svg>
					Lädt …
				{:else if mediaHasMore || eventsHasMore || momentsHasMore}Mehr laden{:else}Alles geladen{/if}
			</button>
		</div>
	</section>
</div>

<style>
	:global(.will-change-transform) {
		will-change: transform;
	}
</style>
