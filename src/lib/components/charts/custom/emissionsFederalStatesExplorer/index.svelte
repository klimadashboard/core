<!--
	Bundesländer-Emissionsexplorer (AT): emissions of the nine federal states,
	as trend, index (selectable start year) and share.
	CMS option `sector` sets the initial sector, either as KSG key ("traffic")
	or as BLI category label ("Verkehr"); without it the explorer starts with "Gesamt".
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { Select } from '$lib/components/ui';
	import type { ChartData } from '../../types';
	import type { Region } from '$lib/utils/getRegion';
	import Explorer from './Explorer.svelte';

	export let chart: any = undefined;
	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	region; // not region-specific: always shows all federal states

	const SOURCE = 'BLI 2025 (1990-2023)';
	const SECTORS = [
		{ value: 'Gesamt', label: 'Alle Sektoren', key: null },
		{ value: 'Energie', label: 'Energie', key: 'energy' },
		{ value: 'Industrie', label: 'Industrie', key: 'industry' },
		{ value: 'Verkehr', label: 'Verkehr', key: 'traffic' },
		{ value: 'Gebäude', label: 'Gebäude', key: 'buildings' },
		{ value: 'Landwirtschaft', label: 'Landwirtschaft', key: 'agriculture' },
		{ value: 'Müll', label: 'Abfallwirtschaft', key: 'waste' },
		{ value: 'F-Gase', label: 'Fluorierte Gase', key: 'fluorinated' }
	];

	const option = chart?.options?.sector;
	let sector = SECTORS.find((s) => s.value === option || s.key === option)?.value ?? 'Verkehr';

	let loading = true;
	let error: string | null = null;
	// category -> state -> year -> t CO2eq
	let data: Record<string, Record<string, Record<number, number>>> = {};
	let years: number[] = [];
	// state -> year -> inhabitants (Statistik Austria, as of 1 January)
	let population: Record<string, Record<number, number>> = {};

	onMount(async () => {
		try {
			const directus = getDirectusInstance();
			const rows = (await directus.request(
				readItems('emissions_data', {
					filter: {
						_and: [{ country: { _eq: 'AT' } }, { source: { _eq: SOURCE } }, { type: { _eq: 'Gesamt' } }]
					},
					fields: ['year', 'value', 'region.id', 'region.name', 'category.label'],
					limit: -1
				})
			)) as {
				year: number;
				value: number | null;
				region: { id: string; name: string } | null;
				category: { label: string } | null;
			}[];

			// population per state and year (optional: per-capita view is hidden without it)
			const nameById = new Map(rows.filter((r) => r.region).map((r) => [r.region!.id, r.region!.name]));
			try {
				const pop = (await directus.request(
					readItems('population', {
						filter: { region: { _in: [...nameById.keys()] } },
						fields: ['region', 'period', 'value'],
						limit: -1
					})
				)) as { region: string; period: string; value: number | null }[];
				const nextPop: typeof population = {};
				for (const p of pop) {
					const name = nameById.get(p.region);
					const year = Number(String(p.period).slice(0, 4));
					if (!name || !p.value || !Number.isFinite(year)) continue;
					(nextPop[name] ??= {})[year] = p.value;
				}
				population = nextPop;
			} catch {
				population = {};
			}

			// only the seven sectors; the data also holds a "KSG" sum row that must not be added again
			const sectorLabels = new Set(SECTORS.filter((s) => s.key).map((s) => s.value));
			const next: typeof data = { Gesamt: {} };
			for (const r of rows) {
				const state = r.region?.name;
				const cat = r.category?.label;
				if (!state || !cat || !sectorLabels.has(cat) || r.value == null) continue;
				((next[cat] ??= {})[state] ??= {})[r.year] = r.value;
				const total = ((next.Gesamt[state] ??= {}));
				total[r.year] = (total[r.year] ?? 0) + r.value;
			}
			data = next;
			years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
		} catch (e) {
			error = (e as Error).message;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	});

	$: series = Object.entries(data[sector] ?? {}).map(([name, values]) => ({ name, values }));
	$: sectorOptions = SECTORS.filter((s) => data[s.value]).map((s) => ({ value: s.value, label: s.label }));

	// table for the card: one row per year, one column per state (t CO2eq)
	$: if (series.length && onChartData) {
		const names = series.map((s) => s.name).sort((a, b) => a.localeCompare(b, 'de'));
		const fmt = (v: any) => (typeof v === 'number' ? Math.round(v).toLocaleString('de-AT') : '–');
		const tableRows = years.map((year) => {
			const row: Record<string, any> = { year };
			for (const s of series) row[s.name] = s.values[year] ?? null;
			return row;
		});
		const sectorLabel = SECTORS.find((s) => s.value === sector)?.label ?? sector;
		onChartData({
			raw: tableRows,
			table: {
				columns: [
					{ key: 'year', label: 'Jahr', align: 'left' },
					...names.map((n) => ({ key: n, label: `${n} (t)`, align: 'right' as const, format: fmt }))
				],
				rows: tableRows,
				filename: `emissionen_bundeslaender_${sector.toLowerCase().replace(/[^a-z]+/g, '_')}`
			},
			placeholders: { sector: sectorLabel, firstYear: String(years[0]), lastYear: String(years.at(-1)) },
			meta: { source: `Umweltbundesamt, Bundesländer Luftschadstoff-Inventur (BLI 2025), ${years[0]}–${years.at(-1)}` }
		});
	}
</script>

{#if loading}
	<div class="h-[440px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[440px] flex items-center justify-center text-red-500">{error}</div>
{:else if !series.length}
	<div class="h-[440px] flex items-center justify-center text-gray-500 dark:text-gray-400">Keine Daten verfügbar</div>
{:else}
	<div class="flex flex-col gap-3">
		<div class="w-56">
			<Select label="Sektor" hideLabel bind:value={sector} options={sectorOptions} small />
		</div>
		<Explorer {series} {years} {population} />
	</div>
{/if}
