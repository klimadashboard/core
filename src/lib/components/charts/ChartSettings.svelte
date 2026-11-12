<!--
	Wrap a chart's own controls in <ChartSettings> to show them in the Card's settings area,
	together with the view switch and the download options:

		<ChartSettings>
			<RadioGroup label="Kennzahl" bind:value={metric} options={...} />
		</ChartSettings>

	Less important controls go into <ChartSettings secondary>: the Card keeps them behind a
	"Mehr Einstellungen" toggle so busy charts stay compact.

	Outside a Card (region overview tiles, Wrapper, small charts) the controls render in place.
	Card itself renders the collected controls with <ChartSettings outlet />.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui';
	import { getChartSettings, type ChartSetting } from './context/chartSettings';

	let {
		children,
		secondary = false,
		outlet = false
	}: { children?: Snippet; secondary?: boolean; outlet?: boolean } = $props();

	const target = getChartSettings();

	$effect(() => {
		if (outlet || !target || !children) return;
		const entry: ChartSetting = { snippet: children, secondary };
		target.update((list) => [...list, entry]);
		return () => target.update((list) => list.filter((s) => s !== entry));
	});

	// Outlet only
	let expanded = $state(false);
	const id = `settings-more-${Math.random().toString(36).slice(2, 8)}`;
	const primary = $derived(($target ?? []).filter((s) => !s.secondary));
	const more = $derived(($target ?? []).filter((s) => s.secondary));
	const tr = (key: string, fallback: string) => page.data.translations?.[key] ?? fallback;
</script>

{#if outlet && target}
	{#each primary as s}
		{@render s.snippet()}
	{/each}
	{#if more.length}
		<Button
			variant="ghost"
			size="sm"
			aria-expanded={expanded}
			aria-controls={id}
			on:click={() => (expanded = !expanded)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
				class="transition-transform {expanded ? 'rotate-180' : ''}"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
			{expanded
				? tr('ui.card.lessSettings', 'Weniger Einstellungen')
				: tr('ui.card.moreSettings', 'Mehr Einstellungen')}
		</Button>
		<div {id} hidden={!expanded} class="basis-full">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
				{#each more as s}
					{@render s.snippet()}
				{/each}
			</div>
		</div>
	{/if}
{:else if !outlet && !target}
	<div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
		{@render children?.()}
	</div>
{/if}
