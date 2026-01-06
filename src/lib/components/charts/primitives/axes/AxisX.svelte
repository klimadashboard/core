<!-- $lib/components/charts/primitives/axes/AxisX.svelte -->
<script lang="ts">
	export let xScale: any;
	export let xDomain: any[] = [];
	export let innerWidth: number;
	export let innerHeight: number;
	export let format: (v: any) => string = String;
	export let tickCount: number = 5;
	export let label: string = '';
	export let forceTicks: number[] = []; // Ticks that must be shown

	$: isBandScale = xScale && 'bandwidth' in xScale;

	$: ticks = (() => {
		if (!xScale) return [];

		if (isBandScale) {
			if (xDomain.length > tickCount * 2) {
				const step = Math.ceil(xDomain.length / tickCount);
				return xDomain.filter((_: any, i: number) => i % step === 0);
			}
			return xDomain;
		}

		// For linear scales
		let baseTicks = xScale.ticks?.(tickCount) ?? [];

		// Add forced ticks
		if (forceTicks.length > 0) {
			const tickSet = new Set(baseTicks);
			for (const forcedTick of forceTicks) {
				tickSet.add(forcedTick);
			}
			baseTicks = Array.from(tickSet).sort((a, b) => a - b);
		}

		// Remove ticks that are too close together to prevent overlap
		// Assume each tick label needs about 40px width
		const minPixelDistance = 40;
		const filteredTicks: number[] = [];

		for (let i = 0; i < baseTicks.length; i++) {
			const tick = baseTicks[i];
			const tickX = xScale(tick);

			// Always include forced ticks
			const isForced = forceTicks.includes(tick);

			// Check if this tick would overlap with the last added tick
			let shouldInclude = isForced;
			if (!shouldInclude && filteredTicks.length === 0) {
				shouldInclude = true; // Always include first tick
			} else if (!shouldInclude) {
				const lastTick = filteredTicks[filteredTicks.length - 1];
				const lastTickX = xScale(lastTick);
				const distance = Math.abs(tickX - lastTickX);
				shouldInclude = distance >= minPixelDistance;
			}

			if (shouldInclude) {
				filteredTicks.push(tick);
			}
		}

		return filteredTicks;
	})();

	function getX(tick: any): number {
		if (!xScale) return 0;
		if (isBandScale) {
			return (xScale(tick) ?? 0) + xScale.bandwidth() / 2;
		}
		return xScale(tick) ?? 0;
	}
</script>

{#if xScale}
	<g class="axis-x" transform="translate(0,{innerHeight})">
		<line x1="0" x2={innerWidth} y1="0" y2="0" stroke="currentColor" class="text-gray-300" />

		{#each ticks as tick}
			<g transform="translate({getX(tick)},0)">
				<line y1="0" y2="5" stroke="currentColor" class="text-gray-300" />
				<text y="18" text-anchor="middle" class="text-xs fill-gray-500 dark:fill-gray-400">
					{format(tick)}
				</text>
			</g>
		{/each}

		{#if label}
			<text
				x={innerWidth / 2}
				y="32"
				text-anchor="middle"
				class="text-xs fill-gray-600 font-medium"
			>
				{label}
			</text>
		{/if}
	</g>
{/if}
