<!-- $lib/components/charts/custom/greenJobAds/index.svelte
	Share of job ads with a green economy reference: ranking of the region's districts (district pages: the
	districts of their state) with the averages of the region, its parents and the country on top. -->
<script lang="ts">
	import type { Region } from '$lib/utils/getRegion';
	import type { ChartData } from '$lib/components/charts/types';
	import RankingBars from '$lib/components/charts/RankingBars.svelte';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import { loadGreenJobAds, buildChartData, type GreenJobAdsData, type Reference } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let data: GreenJobAdsData | null = null;
	let loading = true;
	let error: string | null = null;
	let level: 'district' | 'state' = 'district';

	$: load(region?.id ?? null);
	async function load(id: string | null) {
		loading = true;
		error = null;
		try {
			data = await loadGreenJobAds(fetch, id);
			onChartData?.(data ? buildChartData(data) : null);
		} catch (e) {
			console.error('[greenJobAds]', e);
			error = 'Die Daten konnten nicht geladen werden.';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	const avgNote = (r: Reference) => (r.count > 1 ? `Ø von ${r.count} Kreisen` : undefined);
	$: country = data?.references.at(-1);
	// the ranking is compared with the average of the districts it shows: the state on district pages
	$: meanRef = data
		? data.district
			? data.references.find((r) => r.layer === 'state')
			: level === 'state'
				? country
				: data.references[0]
		: undefined;
	$: byState = level === 'state' && !!data?.states.length;
	$: rows = data
		? byState
			? data.states.map((s) => ({ id: s.id, label: s.name, value: s.share, note: avgNote(s) }))
			: data.members.map((d) => ({ id: d.id, label: d.name, value: d.share, note: d.layerLabel ?? undefined }))
		: [];
	$: references = data
		? data.references.map((r) => ({ id: `ref-${r.id}`, label: r.name, value: r.share, note: avgNote(r) }))
		: [];
	$: rankOf = new Map((data?.members ?? []).map((d) => [d.id, d.rank]));

	const pointsDiff = (v: number, ref: number) =>
		`${v >= ref ? '+' : '−'}${formatNumber(Math.abs(v - ref), 1)} Prozentpunkte`;
</script>

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data}
	<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
		Keine Daten verfügbar
	</div>
{:else}
	{#if data.shownAs}
		<p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
			Daten liegen nur für Kreise vor, gezeigt wird {data.shownAs}.
		</p>
	{/if}
	{#if data.states.length}
		<div class="mb-4">
			<RadioGroup
				label="Ebene"
				bind:value={level}
				options={[
					{ value: 'district', label: 'Kreise' },
					{ value: 'state', label: 'Bundesländer' }
				]}
				small
			/>
		</div>
	{/if}
	<RankingBars
		{rows}
		references={byState ? references.slice(-1) : references}
		mean={meanRef?.share ?? null}
		meanLabel={meanRef ? `Ø ${meanRef.name}` : undefined}
		highlightId={data.district?.id ?? null}
		format={(v) => formatPercent(v)}
		valueLabel="Anteil Stellenanzeigen mit Green-Economy-Bezug"
		itemsLabel={byState ? 'Bundesländer' : 'Kreise'}
		topN={byState ? 16 : 10}
		tooltip={(row) => [
			...(meanRef && !row.id.startsWith('ref-')
				? [{ label: `Abstand zu Ø ${meanRef.name}`, value: pointsDiff(row.value, meanRef.share) }]
				: []),
			...(rankOf.has(row.id) ? [{ label: 'Rang in Deutschland', value: `${rankOf.get(row.id)} von ${data?.total}` }] : [])
		]}
	/>
	<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
		Durchschnittswerte sind ungewichtete Mittelwerte der Kreise: Die Quelle nennt keine Zahl der Stellenanzeigen
		je Kreis.
	</p>
{/if}
