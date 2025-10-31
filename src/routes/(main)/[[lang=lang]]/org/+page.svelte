<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import getDirectusInstance from '$lib/utils/directus';
	import { readUsers, readItems } from '@directus/sdk';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';
	export let data;

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

	/* ---------------- Data: Directus ---------------- */
	let team: any[] = [];
	async function getTeam() {
		const directus = getDirectusInstance(fetch);
		const response = await directus.request(readUsers({ filter: {} }));
		return response as any[];
	}
	let teamPromise: Promise<void> = getTeam().then((r) => {
		team = r ?? [];
	});

	/* Presse (media) with pagination */
	let mediaReports: any[] = [];
	const MEDIA_LIMIT = 12;
	let mediaPage = 0;
	let mediaHasMore = true;

	async function fetchMedia(page: number) {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('org_press_reports', {
				fields: ['id', 'title', 'summary', 'date', 'link', { medium: ['name', 'logo'] }],
				limit: MEDIA_LIMIT,
				offset: page * MEDIA_LIMIT,
				sort: ['-date']
			})
		);
		return Array.isArray(data) ? data : [];
	}
	async function loadMediaPage(page = mediaPage) {
		const items = await fetchMedia(page);
		if (items.length < MEDIA_LIMIT) mediaHasMore = false;

		const existingIds = new Set(mediaReports.map((m) => m.id));
		const newItems = items.filter((it) => !existingIds.has(it.id));

		// immutable update to trigger reactivity
		mediaReports = [...mediaReports, ...newItems];
	}

	let mediaPromise: Promise<void> = loadMediaPage(0).then(() => {
		mediaPage = 1;
	});

	/* Events with pagination */
	let orgEvents: any[] = [];
	const EVENTS_LIMIT = 10;
	let eventsPage = 0;
	let eventsHasMore = true;

	async function fetchEvents(page: number) {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('org_events', {
				fields: ['id', 'title', 'date', 'date_end'],
				limit: EVENTS_LIMIT,
				page: page,
				sort: ['-date'],
				filter: { date_end: { _lte: '$NOW' } }
			})
		);
		return Array.isArray(data) ? data : [];
	}
	async function loadEventsPage(page = eventsPage) {
		const items = await fetchEvents(page);
		if (items.length < EVENTS_LIMIT) eventsHasMore = false;

		const existingIds = new Set(orgEvents.map((e) => e.id));
		const newItems = items.filter((it) => !existingIds.has(it.id));

		// immutable update to trigger reactivity
		orgEvents = [...orgEvents, ...newItems];
	}

	let eventsPromise: Promise<void> = loadEventsPage(0).then(() => {
		eventsPage = 1;
	});

	/* ---------------- Helpers & card mappers ---------------- */
	function shuffle<T>(arr: T[]) {
		const a = arr.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function mediaToCard(item: any) {
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
	function eventToCard(item: any) {
		return {
			key: `event:${item.id}`,
			type: 'event',
			title: item.title,
			subtitle: item.subtitle,
			date: item.date,
			date_end: item.date_end,
			href: item.link ?? '#'
		};
	}

	/* Projects (seeded to center when "Alles") */
	const projectCards = [
		{
			key: 'project:at',
			type: 'project',
			title: 'Klimadashboard.at',
			subtitle: 'Daten & Fakten zur Klimakrise in Österreich',
			href: 'https://klimadashboard.at',
			tag: 'Project'
		},
		{
			key: 'project-eu',
			type: 'project',
			title: 'EU Emission Tracker',
			subtitle: 'Emissions past & future of all EU countries',
			href: 'https://emission-tracker.eu',
			tag: 'Project'
		},
		{
			key: 'project-de',
			type: 'project',
			title: 'Klimadashboard.de',
			subtitle: 'Dashboard zur Klimakrise in Deutschland',
			href: 'https://klimadashboard.de',
			tag: 'Project'
		}
	] as const;

	/* Base value cards (unchanged) */
	const baseCards = [
		{
			key: 'value-data',
			type: 'value',
			title: 'Open Data',
			body: 'Wir machen Datensätze zugänglich – nachvollziehbar, prüfbar, wiederverwendbar.',
			icon: '📂',
			tag: 'Value',
			links: [
				{ url: 'https://api.klimadashboard.org', label: 'API' },
				{ url: 'https://klimadashboard.org/data', label: 'Data' }
			]
		},
		{
			key: 'value-finance',
			type: 'value',
			title: 'Open Finance',
			body: 'Budgets, Ausgaben und Einnahmen legen wir offen.',
			icon: '💶',
			tag: 'Value'
		},
		{
			key: 'value-source',
			type: 'value',
			title: 'Open Source',
			body: 'Unsere Software steht allen offen – zum Prüfen, Kopieren, Verbessern.',
			icon: '🛠️',
			tag: 'Value',
			links: [{ url: 'https://github.com/klimadashboard', label: 'GitHub' }]
		}
	] as const;

	type MemberCard = {
		key: string;
		type: 'member';
		first_name: string;
		last_name: string;
		avatar?: string;
		role?: string;
	};
	function memberToCard(m: any): MemberCard {
		return {
			key: `member:${m.id ?? `${m.first_name}-${m.last_name}`}`,
			type: 'member',
			first_name: m.first_name,
			last_name: m.last_name,
			avatar: m.avatar,
			role: m.title || ''
		};
	}

	/* Weave helper */
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

	/* Reactive card pools */
	$: teamCards = team.map(memberToCard);
	$: mediaCards = shuffle(mediaReports.map(mediaToCard));
	$: eventsCards = orgEvents.map(eventToCard);
	$: restCards = shuffle(
		weave(baseCards as any[], teamCards, 1, 2)
			.concat(mediaCards)
			.concat(eventsCards)
	);
	$: allCards = (projectCards as any[]).concat(restCards);

	/* Filtering */
	const TABS = ['Alles', 'Team', 'Projekte', 'Events', 'Presse'] as const;
	type Tab = (typeof TABS)[number];
	let activeTab: Tab = 'Alles';

	function matchesActiveTab(card: any, tab: Tab) {
		if (tab === 'Alles') return true;
		if (tab === 'Team') return card.type === 'member';
		if (tab === 'Projekte') return card.type === 'project';
		if (tab === 'Events') return card.type === 'event';
		if (tab === 'Presse') return card.type === 'media';
		return true;
	}

	/* Build columns; seed projects only for "Alles" */
	function centerIndices(n: number, k: number) {
		const idx: number[] = [];
		const mid = Math.floor((n - 1) / 2);
		if (n <= 2) return [0, Math.min(1, n - 1), Math.min(1, n - 1)];
		const order = [mid - 1, mid, mid + 1, mid - 2, mid + 2, mid - 3, mid + 3];
		for (const o of order) if (o >= 0 && o < n && idx.length < k) idx.push(o);
		while (idx.length < k) idx.push(idx[idx.length - 1] ?? 0);
		return idx;
	}
	function buildColumns(n: number, heads: any[], tail: any[]) {
		const cols: any[][] = Array.from({ length: n }, () => []);
		const headTargets = centerIndices(n, heads.length);
		headTargets.forEach((cIdx, i) => {
			cols[cIdx].push(heads[i]);
		});
		let start = headTargets[0] ?? 0;
		tail.forEach((item, i) => {
			const colIndex = (start + i) % n;
			cols[colIndex].push(item);
		});
		return cols;
	}

	/* Columns change with filter */
	$: filteredHeads = activeTab === 'Alles' ? (projectCards as any[]) : ([] as any[]);
	$: filteredTail =
		activeTab === 'Alles' ? restCards : allCards.filter((c) => matchesActiveTab(c, activeTab));
	$: columns = buildColumns(numCols, filteredHeads, filteredTail);

	/* Load more (Presse + Events) */
	let isLoadingMore = false;
	async function loadMore() {
		if (isLoadingMore) return;
		isLoadingMore = true;
		await Promise.all([
			mediaHasMore ? loadMediaPage(mediaPage) : Promise.resolve(),
			eventsHasMore ? loadEventsPage(eventsPage) : Promise.resolve()
		]);
		if (mediaHasMore) mediaPage += 1;
		if (eventsHasMore) eventsPage += 1;
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

<!-- Fixed rounded nav -->
<nav
	class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-1 py-1 rounded-full border border-current/10 bg-white/80 dark:bg-black/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm flex gap-3 items-center"
	role="tablist"
	aria-label="Filter"
>
	<ul class="flex gap-1">
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
</nav>

<div class="m-1">
	<!-- Header / Intro -->
	<div class="max-w-3xl mx-auto mt-8 px-4">
		<h1 class="text-5xl text-center leading-none">
			Wir machen Klimawissenschaft zugänglich. Für alle.
		</h1>
		<p class="mt-4 text-xl text-center opacity-80">
			Unsere interaktiven Dashboards schaffen Einordnung und Beschleunigung für die Reise zur
			Klimaneutralität in Österreich, Deutschland und der EU. TV-Nachrichten, Zeitungen,
			Schulbücher, TED-Talks und wissenschaftliche Berichte verwenden unsere Visualisierungen.
		</p>
	</div>

	<section class="mt-8 px-2 md:px-4">
		<div
			class="grid"
			style="grid-template-columns: repeat({numCols}, minmax(0, 1fr)); gap: 0.25rem; align-items: start;"
		>
			{#await Promise.all([teamPromise, mediaPromise, eventsPromise])}
				{#each Array(numCols) as _, i}
					<div
						class="relative will-change-transform"
						use:parallaxColumn={{ speed: speedFor(i) }}
						style="margin-top: {staggerFor(i)}px"
					>
						<div class="flex flex-col gap-1">
							{#each Array(3) as __}
								<div class="rounded-2xl bg-gray-50 h-40"></div>
							{/each}
						</div>
					</div>
				{/each}
			{:then}
				{#each columns as col, i}
					<div
						class="relative will-change-transform"
						use:parallaxColumn={{ speed: speedFor(i) }}
						style="margin-top: {staggerFor(i)}px"
					>
						<div class="flex flex-col gap-1">
							{#each col as card (card.key)}
								<div transition:fade={{ duration: 150 }}>
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
												<p class="mt-auto text-xl">
													{card.first_name}
													{card.last_name}
												</p>
												<p class="text-sm opacity-80">{card.role}</p>
											</div>
										</div>
									{:else if card.type === 'value'}
										<div class="p-3 bg-current/5 rounded-2xl">
											<h3 class="font-bold uppercase tracking-wide text-sm">{card.title}</h3>
											<div class="bg-gray-100 h-24"></div>
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
											class="flex flex-col min-h-[20em] rounded-2xl bg-gray-800 text-white p-3 border border-current/5"
										>
											<p class="text-sm tracking-wider uppercase font-bold">Medienbericht</p>
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
											<h3 class="text-3xl leading-[1.05em] font-condensed text-balance">
												{card.title}
											</h3>
										</a>
									{:else if card.type === 'event'}
										<a
											href={card.href}
											class=" rounded-2xl bg-[#386261] text-white p-3 flex flex-col"
										>
											<span class="uppercase text-sm tracking-wide font-bold">Event</span>

											<h3 class=" mt-16 text-3xl leading-[1.1em]">{card.title}</h3>
											<span class="text-sm tracking-wide font-bold mt-2">
												{dayjs(card.date).format('DD.MM.YYYY') +
													(card.date_end == card.date
														? ''
														: ' - ' + dayjs(card.date_end).format('DD.MM.YYYY'))}
											</span>
											<span class="mt-2">{card.location}</span>
											{#if card.subtitle}<p class="opacity-80 mt-1">{card.subtitle}</p>{/if}
										</a>
									{:else if card.type === 'project'}
										<a href={card.href} class="block rounded-2xl bg-gradient-green p-3">
											<h3 class="mt-24 text-2xl leading-snug">{card.title}</h3>
											{#if card.subtitle}<p class="text-lg leading-tight">{card.subtitle}</p>{/if}
										</a>
									{:else}
										<div class="p-4 rounded-2xl bg-gray-50 text-sm">Karte</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{/await}
		</div>

		<!-- Load more -->
		<div class="flex justify-center my-6">
			<button
				type="button"
				on:click={loadMore}
				disabled={isLoadingMore || (!mediaHasMore && !eventsHasMore)}
				class="px-4 py-2 rounded-full border border-current/20 hover:border-current/40 disabled:opacity-50"
			>
				{#if isLoadingMore}Lade …{/if}
				{#if !isLoadingMore}
					{#if mediaHasMore || eventsHasMore}Mehr laden{/if}
					{#if !mediaHasMore && !eventsHasMore}Alles geladen{/if}
				{/if}
			</button>
		</div>
	</section>
</div>

<style>
	:global(.will-change-transform) {
		will-change: transform;
	}
</style>
