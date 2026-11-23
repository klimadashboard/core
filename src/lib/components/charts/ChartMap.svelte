<!--
	Wrap a chart's own map in <ChartMap> to show it in the Card's "Karte" tab:

		<ChartMap default>
			<MyMap {rows} bind:selected />
		</ChartMap>

	`default` opens the map tab first. Outside a Card (region overview tiles, Wrapper) the map
	renders in place. Card itself provides the context (provideChartMap) and renders the
	registered map with <ChartMap outlet />.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getChartMap, type ChartMapEntry } from './context/chartMap';

	let {
		children,
		default: isDefault = false,
		outlet = false
	}: { children?: Snippet; default?: boolean; outlet?: boolean } = $props();

	const target = getChartMap();

	$effect(() => {
		if (outlet || !target || !children) return;
		const entry: ChartMapEntry = { snippet: children, isDefault };
		target.set(entry);
		return () => target.update((current) => (current === entry ? null : current));
	});
</script>

{#if outlet}
	{#if $target}{@render $target.snippet()}{/if}
{:else if !target && children}
	{@render children()}
{/if}
