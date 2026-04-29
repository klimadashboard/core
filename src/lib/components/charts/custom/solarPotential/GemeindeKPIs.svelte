<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';
	import type { SolarStats, SolarAverages } from './config';

	export let stats: SolarStats;
	export let averages: SolarAverages | null = null;

	// Start at 0 so the count-up animation runs from zero on mount.
	let potentialVal = 0;
	let daecherVal = 0;
	let dachPVVal = 0;

	onMount(() => {
		animateTo(stats.potential, (v) => (potentialVal = v));
		animateTo(stats.daecher, (v) => (daecherVal = v));
		animateTo(stats.dachPV, (v) => (dachPVVal = v));
	});

	function animateTo(target: number, set: (v: number) => void) {
		const duration = 1400;
		const start = performance.now();
		function tick(now: number) {
			const p = Math.min((now - start) / duration, 1);
			set(cubicOut(p) * target);
			if (p < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	function formatUpdateDate(isoDate: string): string {
		const [y, m, d] = isoDate.split('-');
		return `${d}.${m}.${y}`;
	}
</script>

{#snippet kpiCard(
	opts: {
		bg: string;
		color: string;
		dimColor: string;
		title: string;
		icon: string;
		displayVal: number;
		unit: string;
		description: string;
		footer: string;
	},
	listContent: Snippet
)}
	<div class="rounded-2xl overflow-hidden">
		<div
			class="p-3 h-full leading-tight flex flex-col break-words hyphens-auto"
			style="background:{opts.bg}; color:{opts.color};"
		>
			<div class="flex justify-between font-bold border-b border-current pb-1">
				<h3>{opts.title}</h3>
				<span aria-hidden="true">{opts.icon}</span>
			</div>
			<div class="flex items-end gap-2 mt-1">
				<p class="text-5xl font-light font-condensed">
					{opts.displayVal.toFixed(1)}<span class="text-2xl font-normal"> {opts.unit}</span>
				</p>
			</div>
			<div class="text-balance" style="color:{opts.dimColor};">
				{opts.description}
			</div>
			<ul class="card-list">
				{@render listContent()}
			</ul>
			<div class="text-xs leading-none mt-auto pt-2 opacity-50" style="color:{opts.dimColor};">
				{opts.footer}
			</div>
		</div>
	</div>
{/snippet}

{#snippet potentialList()}
	<li>
		{stats.trend >= 0 ? '↑' : '↓'} Letzte 6 Monate: {stats.trend >= 0
			? '+'
			: ''}{stats.trend.toFixed(2)} %P
	</li>
	{#if averages}
		<li>Ø Deutschland: {averages.avgDE.toFixed(1).replace('.', ',')} %</li>
		{#if averages.avgState != null}
			<li>Ø {averages.stateName}: {averages.avgState.toFixed(1).replace('.', ',')} %</li>
		{/if}
	{/if}
{/snippet}

{#snippet daecherList()}
	<li>
		{stats.neuAnlagenMonat >= 0 ? '↑' : '↓'} Letzte 6 Monate: {stats.neuAnlagenMonat >= 0
			? '+'
			: ''}{stats.neuAnlagenMonat} Anlagen/Monat
	</li>
	{#if averages}
		<li>Ø Deutschland: {averages.avgDaecherDE.toFixed(1).replace('.', ',')} %</li>
		{#if averages.avgDaecherState != null}
			<li>Ø {averages.stateName}: {averages.avgDaecherState.toFixed(1).replace('.', ',')} %</li>
		{/if}
	{/if}
{/snippet}

{#snippet leistungList()}
	<li>
		{stats.neuLeistungMonat >= 0 ? '↑' : '↓'} Letzte 6 Monate: {stats.neuLeistungMonat >= 0
			? '+'
			: ''}{(stats.neuLeistungMonat / 1000).toFixed(1)} MWp/Monat
	</li>
{/snippet}

<div class="mb-3.5 grid grid-cols-1 gap-1 md:grid-cols-3">
	{@render kpiCard(
		{
			bg: '#0C2A1A',
			color: '#34D399',
			dimColor: '#6EE7B7',
			title: 'Genutztes Solarpotential',
			icon: '☀',
			displayVal: potentialVal,
			unit: '%',
			description: 'Anteil des genutzten Solardach-Potentials durch installierte PV-Anlagen',
			footer: `MaStR / DLR EO Solar · Datenstand: ${formatUpdateDate(stats.updateDate)}`
		},
		potentialList
	)}
	{@render kpiCard(
		{
			bg: '#0B1E2E',
			color: '#38BDF8',
			dimColor: '#7DD3FC',
			title: 'Dächer mit PV',
			icon: '🏠',
			displayVal: daecherVal,
			unit: '%',
			description: `${stats.unitCount.toLocaleString('de-DE')} registrierte PV-Anlagen auf Gebäuden`,
			footer: `MaStR / DLR EO Solar · Datenstand: ${formatUpdateDate(stats.updateDate)}`
		},
		daecherList
	)}
	{@render kpiCard(
		{
			bg: '#1A0F2E',
			color: '#C084FC',
			dimColor: '#D8B4FE',
			title: 'Installierte Dach-Leistung',
			icon: '⚡',
			displayVal: dachPVVal,
			unit: 'MWp',
			description: 'Nettonennleistung aller als Gebäudesolaranlage registrierten PV-Anlagen',
			footer: `Marktstammdatenregister · Datenstand: ${formatUpdateDate(stats.updateDate)}`
		},
		leistungList
	)}
</div>
