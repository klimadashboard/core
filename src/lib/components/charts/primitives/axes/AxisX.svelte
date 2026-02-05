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

	// Calculate responsive tick count based on available width
	$: minTickSpacing = 50; // Minimum pixels between ticks
	$: maxTicksForWidth = Math.max(2, Math.floor(innerWidth / minTickSpacing));
	$: effectiveTickCount = Math.min(tickCount, maxTicksForWidth);

	$: ticks = (() => {
		if (!xScale) return [];

		if (isBandScale) {
			let baseTicks: any[];
			// Use effectiveTickCount to ensure ticks fit the available width
			if (xDomain.length > effectiveTickCount * 2) {
				const step = Math.ceil(xDomain.length / effectiveTickCount);
				baseTicks = xDomain.filter((_: any, i: number) => i % step === 0);
			} else if (xDomain.length > effectiveTickCount) {
				// When we have more items than can fit, sample evenly
				const step = Math.ceil(xDomain.length / effectiveTickCount);
				baseTicks = xDomain.filter((_: any, i: number) => i % step === 0);
			} else {
				baseTicks = [...xDomain];
			}

			// Add forced ticks for band scales too
			if (forceTicks.length > 0) {
				const tickSet = new Set(baseTicks);
				for (const forcedTick of forceTicks) {
					if (xDomain.includes(forcedTick)) {
						tickSet.add(forcedTick);
					}
				}
				baseTicks = Array.from(tickSet).sort((a, b) => Number(a) - Number(b));
			}

			// Filter out non-forced ticks that are too close to forced ticks or each other
			const minDist = 40;
			const bandwidth = xScale.bandwidth?.() ?? 0;
			const getX = (t: any) => (xScale(t) ?? 0) + bandwidth / 2;

			const filteredTicks: any[] = [];
			for (const t of baseTicks) {
				const isForced = forceTicks.includes(t);
				const tickX = getX(t);

				// Check distance to all forced ticks
				const tooCloseToForced = !isForced && forceTicks.some((f) => Math.abs(getX(f) - tickX) < minDist);
				if (tooCloseToForced) continue;

				// Check distance to already added ticks
				const tooCloseToExisting = filteredTicks.some((existing) => Math.abs(getX(existing) - tickX) < minDist);
				if (tooCloseToExisting && !isForced) continue;

				filteredTicks.push(t);
			}

			return filteredTicks;
		}

		// For linear scales - use effectiveTickCount for responsive sizing
		let baseTicks = xScale.ticks?.(effectiveTickCount) ?? [];

		// Add forced ticks
		if (forceTicks.length > 0) {
			const tickSet = new Set(baseTicks);
			for (const forcedTick of forceTicks) {
				tickSet.add(forcedTick);
			}
			baseTicks = Array.from(tickSet).sort((a, b) => a - b);
		}

		// Remove ticks that are too close together to prevent overlap
		const minPixelDistance = 40;
		const filteredTicks: number[] = [];

		for (let i = 0; i < baseTicks.length; i++) {
			const tick = baseTicks[i];
			const tickX = xScale(tick);

			// Always include forced ticks
			const isForced = forceTicks.includes(tick);

			// Check distance to all forced ticks first
			const tooCloseToForced = !isForced && forceTicks.some((f) => Math.abs(xScale(f) - tickX) < minPixelDistance);
			if (tooCloseToForced) continue;

			// Check if this tick would overlap with any already added tick
			const tooCloseToExisting = filteredTicks.some((existing) => Math.abs(xScale(existing) - tickX) < minPixelDistance);
			if (tooCloseToExisting && !isForced) continue;

			filteredTicks.push(tick);
		}

		return filteredTicks;
	})();

	// Pre-compute tick positions reactively so they update when xScale changes
	$: tickData = ticks.map((tick) => {
		let x = 0;
		if (xScale) {
			if (isBandScale) {
				x = (xScale(tick) ?? 0) + (xScale.bandwidth?.() ?? 0) / 2;
			} else {
				x = xScale(tick) ?? 0;
			}
		}
		return { tick, x };
	});
</script>

{#if xScale}
	<g class="axis-x" transform="translate(0,{innerHeight})">
		<line x1="0" x2={innerWidth} y1="0" y2="0" stroke="currentColor" class="text-gray-300" />

		{#each tickData as { tick, x }}
			<g transform="translate({x},0)">
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
