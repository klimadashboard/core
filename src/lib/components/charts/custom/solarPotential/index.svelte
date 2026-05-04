<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchRegionData,
		fetchRankings,
		buildChartData,
		computeAwards,
		haversineKm,
		type SolarStats,
		type SolarRankEntry,
		type HistEntry,
		type SolarAverages,
		type SolarNeighbourEntry
	} from './config';
	import MunicipalityKPIs from './MunicipalityKPIs.svelte';
	import AwardsSection from './AwardsSection.svelte';
	import RankingTable from './RankingTable.svelte';

	export let region: Region | null = null;
	export let regionLoading: boolean = true;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let stats: SolarStats | null = null;
	let allRegions: SolarRankEntry[] = [];
	let history: HistEntry[] = [];
	let error: string | null = null;
	let rankingLoading = false;

	let loadSeq = 0;
	onDestroy(() => {
		loadSeq = -1;
	});

	$: if (!regionLoading) {
		if (region?.id) loadData(region.id);
		else {
			error = 'Region nicht gefunden';
			// Still call onChartData so Card's skeleton clears
			onChartData?.({ raw: [], placeholders: {}, meta: { source: '' } } as unknown as ChartData);
		}
	}

	async function loadData(regionId: string) {
		const seq = ++loadSeq;
		error = null;
		stats = null;
		allRegions = [];
		history = [];
		rankingLoading = false;

		// Phase 1 — region history (fast, fatal on failure)
		const ctrl1 = new AbortController();
		const t1 = setTimeout(() => ctrl1.abort(), 15_000);
		try {
			const regionData = await fetchRegionData(regionId, globalThis.fetch, ctrl1.signal);
			clearTimeout(t1);
			if (seq !== loadSeq) return;
			if (!regionData) {
				error = 'Keine Solardaten für diese Region';
				onChartData?.(buildChartData({ potential: 0, daecher: 0, dachPV: 0, unitCount: 0, trend: 0, neuAnlagenMonat: 0, neuLeistungMonat: 0, updateDate: '', avgDE: 0, avgDaecherDE: 0 }, [], region?.name ?? ''));
				return;
			}
			stats = regionData.stats;
			history = regionData.history;
			// Immediately unblock the card skeleton with partial data
			onChartData?.(buildChartData(stats, [], region?.name ?? ''));

			// Phase 2 — all-regions ranking (slow, never crashes the component)
			rankingLoading = true;
			const ctrl2 = new AbortController();
			const t2 = setTimeout(() => ctrl2.abort(), 30_000);
			try {
				const { allRegions: ranked, avgDE, avgDaecherDE } = await fetchRankings(
					regionData.latestDate,
					regionData.prevDate,
					globalThis.fetch,
					ctrl2.signal
				);
				clearTimeout(t2);
				if (seq !== loadSeq) return;
				allRegions = ranked;
				stats = { ...stats, avgDE, avgDaecherDE };
				onChartData?.(buildChartData(stats, allRegions, region?.name ?? ''));
			} finally {
				clearTimeout(t2);
				if (seq === loadSeq) rankingLoading = false;
			}
		} catch (e) {
			clearTimeout(t1);
			if (seq !== loadSeq) return;
			error = ctrl1.signal.aborted
				? 'Zeitüberschreitung beim Laden der Daten'
				: e instanceof Error
					? e.message
					: 'Fehler beim Laden';
			onChartData?.(buildChartData({ potential: 0, daecher: 0, dachPV: 0, unitCount: 0, trend: 0, neuAnlagenMonat: 0, neuLeistungMonat: 0, updateDate: '', avgDE: 0, avgDaecherDE: 0 }, [], region?.name ?? ''));
		}
	}

	$: stateId = region?.parents?.find((p) => p.layer === 'state')?.id;
	$: stateName = region?.parents?.find((p) => p.layer === 'state')?.name ?? 'Bundesland';

	type RegionCase = 'grossstadt' | 'mittelstadt' | 'kleinstadt';

	function getRegionCase(pop: number | undefined): RegionCase {
		if (pop == null) return 'mittelstadt';
		if (pop >= 100_000) return 'grossstadt';
		if (pop >= 20_000) return 'mittelstadt';
		return 'kleinstadt';
	}

	$: regionCase = getRegionCase(region?.population);

	$: allDEweit =
		regionCase === 'grossstadt'
			? allRegions.filter((r) => (r.region.population ?? 0) >= 100_000)
			: regionCase === 'mittelstadt'
				? allRegions.filter(
						(r) =>
							r.region.population != null &&
							r.region.population >= 20_000 &&
							r.region.population < 100_000
					)
				: [];

	$: byLand = stateId
		? allRegions.filter((r) =>
				r.region.parents?.some((p) => p.layer === 'state' && p.id === stateId)
			)
		: [];

	$: rankDE = allDEweit.findIndex((r) => r.region.id === region?.id) + 1 || 0;
	$: rankDEGesamt = allDEweit.length;
	$: rankLand = byLand.findIndex((r) => r.region.id === region?.id) + 1 || 0;
	$: rankLandGesamt = byLand.length;
	$: rankAll = allRegions.findIndex((r) => r.region.id === region?.id) + 1 || 0;

	$: awards = computeAwards(history);

	$: myLat = region?.center ? parseFloat(region.center[1]) : null;
	$: myLon = region?.center ? parseFloat(region.center[0]) : null;
	$: neighbours = computeNeighbours(allDEweit, allRegions, regionCase, region?.id, myLat, myLon);

	function computeNeighbours(
		dePool: SolarRankEntry[],
		all: SolarRankEntry[],
		kase: RegionCase,
		selfId: string | undefined,
		lat: number | null,
		lon: number | null
	): SolarNeighbourEntry[] {
		if (lat == null || lon == null) return [];
		const pool = kase === 'kleinstadt' ? all : dePool;
		const nearby = pool
			.filter((r) => r.region.id !== selfId && r.region.center != null)
			.map((r) => ({
				...r,
				distKm: haversineKm(
					lat,
					lon,
					parseFloat(r.region.center![1]),
					parseFloat(r.region.center![0])
				)
			}))
			.sort((a, b) => a.distKm - b.distKm)
			.slice(0, 9);
		// Self is looked up from allRegions so population gaps don't exclude it
		const self = all.find((r) => r.region.id === selfId);
		return self ? [{ ...self, distKm: 0 }, ...nearby] : nearby;
	}

	$: averages = stats
		? ({
				avgDE: stats.avgDE,
				avgDaecherDE: stats.avgDaecherDE,
				avgState: byLand.length
					? byLand.reduce((s, r) => s + r.potential, 0) / byLand.length
					: null,
				avgDaecherState: byLand.length
					? byLand.reduce((s, r) => s + r.daecher, 0) / byLand.length
					: null,
				stateName
			} satisfies SolarAverages)
		: null;
</script>

{#if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if stats}
	<!-- rendered once data arrives; Card.svelte skeleton covers the loading state -->
	<!-- ══ KPI CARDS ════════════════════════════════════════════════ -->
	<section>
		<MunicipalityKPIs {stats} {averages} />
	</section>

	<!-- ══ AWARDS ═══════════════════════════════════════════════════ -->
	<section class="mt-8">
		<AwardsSection {awards} gemeineName={region?.name ?? ''} />
	</section>

	<!-- ══ RANKING ═══════════════════════════════════════════════════ -->
	<section class="mt-8">
		{#key region?.id}
			<RankingTable
				{allDEweit}
				{byLand}
				{neighbours}
				regionId={region?.id ?? ''}
				regionName={region?.name ?? ''}
				{stateName}
				{regionCase}
				{rankDE}
				{rankDEGesamt}
				{rankLand}
				{rankLandGesamt}
				{rankAll}
				loading={rankingLoading}
			/>
		{/key}
	</section>
{/if}
