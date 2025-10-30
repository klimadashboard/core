<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import getDirectusInstance from '$lib/utils/directus';
	import { readUsers, readItems } from '@directus/sdk';
	import dayjs from 'dayjs';

	/** Column-level parallax to keep intra-column spacing uniform (SSR-safe) */
	export function parallaxColumn(node: HTMLElement, { speed = 0.04 } = {}) {
		// Respect reduced motion and SSR
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

	// --- Data: pull real team members from Directus (SSR-friendly) ---
	let team: any[] = [];
	async function getTeam() {
		const directus = getDirectusInstance(fetch);
		const response = await directus.request(readUsers({ filter: {} }));
		return response as any[];
	}
	let teamPromise: Promise<void> = getTeam().then((r) => {
		team = r ?? [];
	});

	let mediaReports: any[] = [];

	async function getMediaReports() {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('org_press_reports', {
				fields: ['id', 'title', 'summary', 'date', 'link', { medium: ['name', 'logo'] }],
				limit: 12,
				sort: ['-date']
			})
		);
		return Array.isArray(data) ? data : [];
	}
	let mediaPromise: Promise<void> = getMediaReports().then((r) => {
		mediaReports = r;
	});

	let orgEvents: any[] = [];

	async function getEvents() {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('org_events', {
				sort: ['-date'],
				filter: {
					date_end: {
						_lte: '$NOW'
					}
				}
			})
		);
		return Array.isArray(data) ? data : [];
	}
	let eventsPromise: Promise<void> = getEvents().then((r) => {
		orgEvents = r;
	});

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
			type: 'event',
			title: item.title,
			date: item.date,
			date_end: item.date_end
		};
	}

	// Project cards (now included IN masonry and seeded toward the center columns)
	const projectCards = [
		{
			type: 'project',
			title: 'Klimadashboard.at',
			subtitle: 'Daten & Fakten zur Klimakrise in Österreich',
			href: 'https://klimadashboard.at',
			tag: 'Project'
		},
		{
			type: 'project',
			title: 'EU Emission Tracker',
			subtitle: 'Emissions past & future of all EU countries',
			href: 'https://emission-tracker.eu',
			tag: 'Project'
		},
		{
			type: 'project',
			title: 'Klimadashboard.de',
			subtitle: 'Dashboard zur Klimakrise in Deutschland',
			href: 'https://klimadashboard.de',
			tag: 'Project'
		}
	] as const;

	// Other placeholder cards; team members will be woven in
	const baseCards = [
		{
			type: 'value',
			title: 'Open Data',
			body: 'Wir machen Datensätze zugänglich – nachvollziehbar, prüfbar, wiederverwendbar.',
			icon: '📂',
			tag: 'Value',
			links: [
				{
					url: 'https://api.klimadashboard.org',
					label: 'API'
				},
				{
					url: 'https://klimadashboard.org/data',
					label: 'Data'
				}
			]
		},
		{
			type: 'value',
			title: 'Open Finance',
			body: 'Budgets, Ausgaben und Einnahmen legen wir offen.',
			icon: '💶',
			tag: 'Value'
		},
		{
			type: 'value',
			title: 'Open Source',
			body: 'Unsere Software steht allen offen – zum Prüfen, Kopieren, Verbessern.',
			icon: '🛠️',
			tag: 'Value',
			links: [
				{
					link: 'https://github.com/klimadashboard',
					label: 'GitHub'
				}
			]
		}
	] as const;

	// Convert team members to individual member cards
	type MemberCard = {
		type: 'member';
		first_name: string;
		last_name: string;
		avatar?: string;
		role?: string;
	};
	function memberToCard(m: any): MemberCard {
		return {
			type: 'member',
			first_name: m.first_name,
			last_name: m.last_name,
			avatar: m.avatar,
			role: m.title || ''
		};
	}

	// Interleave arrays: weave members into base cards (e.g., 2 members after every 1 base card)
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

	// Responsive column count: SSR renders 1 col; client ups to 7 on very large screens
	let numCols = 1;
	function recomputeCols() {
		if (!browser) return;
		const w = window.innerWidth;
		numCols = w >= 1600 ? 7 : w >= 1024 ? 5 : w >= 900 ? 3 : w >= 640 ? 2 : 1;
	}
	onMount(() => {
		if (!browser) return;
		recomputeCols();
		window.addEventListener('resize', recomputeCols);
	});
	onDestroy(() => {
		if (browser) window.removeEventListener('resize', recomputeCols);
	});

	// Build cards once team is loaded; weave to get a dynamic mix (excluding projectCards for now)
	$: teamCards = team.map(memberToCard);
	$: mediaCards = shuffle(mediaReports.map(mediaToCard));
	$: eventsCards = orgEvents.map(eventToCard); // keep your ratio of values/events to team; then add real media and shuffle lightly
	$: restCards = shuffle(
		weave(baseCards as any[], teamCards, 1, 2)
			.concat(mediaCards)
			.concat(eventsCards)
	);

	// Create columns and seed projectCards toward center columns
	function centerIndices(n: number, k: number) {
		const idx: number[] = [];
		const mid = Math.floor((n - 1) / 2);
		// spread around the middle: mid-1, mid, mid+1 for k=3 when possible
		if (n <= 2) return [0, Math.min(1, n - 1), Math.min(1, n - 1)];
		const order = [mid - 1, mid, mid + 1, mid - 2, mid + 2, mid - 3, mid + 3];
		for (const o of order) {
			if (o >= 0 && o < n && idx.length < k) idx.push(o);
		}
		while (idx.length < k) idx.push(idx[idx.length - 1] ?? 0);
		return idx;
	}

	function buildColumns(n: number, heads: any[], tail: any[]) {
		const cols: any[][] = Array.from({ length: n }, () => []);
		const headTargets = centerIndices(n, heads.length);
		headTargets.forEach((cIdx, i) => {
			cols[cIdx].push(heads[i]);
		});
		// Then distribute rest round-robin, starting at the first filled center column for balance
		let start = headTargets[0] ?? 0;
		tail.forEach((item, i) => {
			const colIndex = (start + i) % n;
			cols[colIndex].push(item);
		});
		return cols;
	}

	$: columns = buildColumns(numCols, projectCards as any[], restCards);

	// Subtle per-column speeds & vertical staggers (support up to 7 columns)
	const speeds = [0.0, 0.03, 0.06, 0.09, 0.06, 0.03, 0.0];
	const staggers = [0, 12, 6, 18, 8, 14, 4]; // px offset per column
	const speedFor = (i: number) => speeds[i % speeds.length];
	const staggerFor = (i: number) => staggers[i % staggers.length];
</script>

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
			{#await teamPromise}
				{#each Array(numCols) as _, i}
					<div
						class="relative will-change-transform"
						use:parallaxColumn={{ speed: speedFor(i) }}
						style="margin-top: {staggerFor(i)}px"
					>
						<div class="flex flex-col gap-1">
							<!-- skeletons while loading -->
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
							{#each col as card}
								<!-- Card (no shadow; just rounded + backgrounds) -->
								{#if card.type === 'member'}
									<div class="w-full min-h-[20em] bg-gray-800 relative rounded-2xl overflow-hidden">
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
											<p class="mt-auto text-xl text-center">
												{card.first_name}
												{card.last_name}
											</p>
											<p class="text-sm opacity-80 text-center">{card.role}</p>
										</div>
									</div>
								{:else if card.type === 'value'}
									<div class="p-3 bg-current/5 rounded-2xl flex flex-col items-center">
										<h3 class="font-bold uppercase tracking-wide mt-48">{card.title}</h3>
										<p class="text-lg text-center leading-snug">{card.body}</p>
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
										class="min-h-[20em] rounded-2xl bg-current/5 flex flex-col items-center"
									>
										<div class="p-3 text-center">
											<h3 class="text-xl leading-snug font-condensed">{card.title}</h3>
											{#if card.medium?.logo}
												<img
													class="h-10"
													src="https://base.klimadashboard.org/assets/{card.medium.logo}"
													alt=""
												/>
											{:else}
												<p class="text-sm opacity-80">{card.medium?.name}</p>
											{/if}
										</div>
									</a>
								{:else if card.type === 'event'}
									<a href={card.href} class="block rounded-2xl border-current/10 border">
										<div class="p-3">
											<span class="text-sm tracking-wide font-bold"
												>{dayjs(card.date).format('DD.MM.YYYY') +
													(card.date_end == card.date
														? ''
														: ' - ' + dayjs(card.date_end).format('DD.MM.YYYY'))}</span
											>
											<h3 class="text-2xl leading-snug">{card.title}</h3>
											{#if card.subtitle}<p class="opacity-80 mt-1">{card.subtitle}</p>{/if}
										</div>
									</a>
								{:else if card.type === 'project'}
									<a href={card.href} class="block rounded-2xl bg-gradient-green">
										<div class="p-3 text-center">
											<h3 class="text-2xl leading-snug">{card.title}</h3>
											{#if card.subtitle}<p class="text-lg leading-tight">{card.subtitle}</p>{/if}
										</div>
									</a>
								{:else}
									<!-- fallback small note card -->
									<div class="p-4 rounded-2xl bg-gray-50 text-sm">Karte</div>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			{/await}
		</div>
	</section>
</div>

<style>
	:global(.will-change-transform) {
		will-change: transform;
	}
</style>
