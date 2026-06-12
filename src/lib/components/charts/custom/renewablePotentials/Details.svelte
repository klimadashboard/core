<script>
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import formatNumber from '$lib/stores/formatNumber';

	export const bundesland = undefined;
	export let type;
	export let dataset;
	export let potential_2030;
	export let potential_techn;
	export let goals;
	export let selectedStartYear;
	export let showTechn;
	export let predefinedMaxValue = undefined;

	const unit = 'TWh';
	const goalLabelXOffset = 10;
	const labelOverlapThreshold = 25;
	const leftGoalLabelYear = 2030;

	/** @typedef {{ id: string; baseY: number }} LabelEntry */
	/** @param {LabelEntry[]} labels */
	const calculateLabelOffsets = (labels) => {
		const offsets = Object.fromEntries(labels.map((l) => [l.id, 0]));
		const sorted = [...labels].sort((a, b) => a.baseY - b.baseY);
		for (let i = 0; i < sorted.length; i++) {
			for (let j = i + 1; j < sorted.length; j++) {
				const distance = sorted[j].baseY + offsets[sorted[j].id] - (sorted[i].baseY + offsets[sorted[i].id]);
				if (distance >= labelOverlapThreshold) break;
				const adj = Math.ceil((labelOverlapThreshold - distance) / 2);
				offsets[sorted[i].id] -= adj;
				offsets[sorted[j].id] += adj;
			}
		}
		return offsets;
	};

	/** Compute label offsets given the live yScale from the Chart slot. */
	function computeOffsets(yScale) {
		if (!yScale) return {};
		const entries = [];
		for (const goal of normalizedGoals) {
			entries.push({ id: goal.labelId, baseY: yScale(goal.goalAmount) });
		}
		if (potential_2030 != null && potential_2030 > 0 && type.dataKey !== 'windkraft') {
			entries.push({ id: 'potential-2030', baseY: yScale(potential_2030) });
		}
		const lastVal = filteredDataset.at(-1)?.value;
		if (lastVal != null && !isNaN(+lastVal)) {
			entries.push({ id: 'production', baseY: yScale(+lastVal) + 5 });
		}
		return calculateLabelOffsets(entries);
	}

	$: normalizedGoals = [];
	$: {
		const next = [];
		for (const [i, goal] of (goals ?? []).entries()) {
			const g = {
				...goal,
				goalAmount: +goal.goal_amount,
				goalYear: +goal.goal_year,
				sourceYear: +goal.source_year,
				goalCategory: goal.source_category ? `${goal.source_category}-Ziel` : 'Weiteres Ziel',
				labelId: `goal-${goal.source_category ?? 'Weiteres'}-${goal.goal_year}-${goal.goal_amount}-${i}`
			};
			if (!isNaN(g.goalAmount) && !isNaN(g.goalYear)) next.push(g);
		}
		next.sort((a, b) =>
			a.goalCategory !== b.goalCategory
				? a.goalCategory.localeCompare(b.goalCategory)
				: a.goalYear !== b.goalYear
				? a.goalYear - b.goalYear
				: a.goalAmount - b.goalAmount
		);
		normalizedGoals = next;
	}

	$: goalsByCategory = normalizedGoals.reduce((acc, g) => {
		(acc[g.goalCategory] ??= []).push(g);
		return acc;
	}, {});

	$: has_goals = normalizedGoals.length > 0;
	$: minYear = Math.max(dataset[0]?.year ?? 2009, selectedStartYear);
	$: filteredDataset = dataset.filter((d) => d.year >= minYear);
	$: chartMaxYear = Math.max(2040, ...normalizedGoals.map((g) => g.goalYear));

	// Extend x-domain past the goal years without polluting tooltip hover data.
	$: chartData = [...filteredDataset, { year: chartMaxYear + 2, value: null }];

	$: yMax =
		predefinedMaxValue ??
		(showTechn && potential_techn
			? potential_techn
			: Math.max(
					0,
					...normalizedGoals.map((g) => g.goalAmount),
					potential_2030 || 0,
					...filteredDataset.map((d) => +d.value)
			  )) *
			1.1;
</script>

<div class="rounded-xl overflow-hidden" style="box-shadow: 0 0 0 2px {type.color};">
	<div class="text-white px-4 py-3 flex items-center justify-between" style="background: {type.color}">
		<h4 class="font-bold text-lg">{type.label} in {bundesland}</h4>
		<span style="opacity: 0.8">{@html type.icon}</span>
	</div>

	<Chart
		data={chartData}
		x="year"
		y="value"
		height={288}
		yMin={0}
		yMax={yMax}
		margin={{ top: 15, right: 20, bottom: 35, left: 45 }}
	>
		<svelte:fragment slot="default" let:xScale let:yScale let:innerWidth let:innerHeight let:hover>
			{@const offsets = computeOffsets(yScale)}

			<!-- Grid lines (behind everything) -->
			<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} tickCount={4} />

			<!-- Technical potential horizontal line -->
			{#if showTechn && potential_techn}
				<line
					x1={0}
					x2={innerWidth}
					y1={yScale(potential_techn)}
					y2={yScale(potential_techn)}
					stroke="#A3A3A3"
					stroke-width="1"
					stroke-dasharray="5,5"
				/>
				<text
					text-anchor="start"
					class="text-sm"
					style="fill: #A3A3A3; stroke: white; stroke-width: 3px; paint-order: stroke fill;"
					x={10}
					y={yScale(potential_techn)}
					dy={-4}
				>{formatNumber(potential_techn, unit, 2)} Technisch möglich</text>
			{/if}

			<!-- Goal lines, dots, labels -->
			{#if has_goals}
				{#each Object.entries(goalsByCategory) as [goalCategory, categoryGoals]}
					{#each categoryGoals as goal, index}
						{@const shouldDrawLine = goalCategory === 'Bundesland-Ziel' || goalCategory === 'EABG-Ziel'}
						{@const previousGoal = shouldDrawLine && index > 0 ? categoryGoals[index - 1] : null}
						{@const sourceYear = previousGoal ? previousGoal.goalYear : goal.sourceYear}
						{@const sourceAmount = previousGoal
							? previousGoal.goalAmount
							: +dataset.find((d) => +d.year === sourceYear)?.value}
						{@const closestFallback = dataset
							.map((d) => ({ dist: Math.abs(+d.year - sourceYear), val: d.value }))
							.sort((a, b) => a.dist - b.dist)[0]}

						{#if shouldDrawLine}
							{#if !isNaN(sourceAmount)}
								<line
									x1={xScale(sourceYear)}
									y1={yScale(sourceAmount)}
									x2={xScale(goal.goalYear)}
									y2={yScale(goal.goalAmount)}
									stroke={type.color}
									stroke-width="2"
									stroke-dasharray="8,6"
									opacity="0.5"
								/>
							{:else if closestFallback}
								<line
									x1={xScale(sourceYear)}
									y1={yScale(closestFallback.val)}
									x2={xScale(goal.goalYear)}
									y2={yScale(goal.goalAmount)}
									stroke={type.color}
									stroke-width="2"
									stroke-dasharray="8,6"
									opacity="0.5"
								/>
							{/if}
						{/if}

						<circle
							cx={xScale(goal.goalYear)}
							cy={yScale(goal.goalAmount)}
							r={4}
							fill="none"
							stroke={type.color}
							stroke-width="2"
							opacity="0.7"
						/>
						{@const labelOnLeft = goal.goalYear > leftGoalLabelYear}
						<text
							text-anchor={labelOnLeft ? 'end' : 'start'}
							dominant-baseline="middle"
							class="text-sm font-semibold"
							style="fill: {type.color}; stroke: white; stroke-width: 3px; paint-order: stroke fill;"
							x={xScale(goal.goalYear) + (labelOnLeft ? -goalLabelXOffset : goalLabelXOffset)}
							y={yScale(goal.goalAmount)}
							dy={offsets[goal.labelId] ?? 0}
						>{goalCategory}: {goal.goalAmount >= 0.01
								? formatNumber(goal.goalAmount, unit, 2)
								: `< 0.01 ${unit}`}</text>
					{/each}
				{/each}
			{/if}

			<!-- 2030 potential marker (not for wind) -->
			{#if potential_2030 != null && potential_2030 > 0 && type.dataKey !== 'windkraft'}
				<circle
					cx={xScale(2030)}
					cy={yScale(potential_2030)}
					r={4}
					fill="none"
					stroke="#22c55e"
					stroke-width="2"
					opacity="0.7"
				/>
				<text
					text-anchor="start"
					dominant-baseline="middle"
					class="text-sm font-semibold"
					style="fill: #22c55e; stroke: white; stroke-width: 3px; paint-order: stroke fill;"
					x={xScale(2030) + goalLabelXOffset}
					y={yScale(potential_2030)}
					dy={offsets['potential-2030'] ?? 0}
				>{formatNumber(potential_2030, unit, 2)} Potential</text>
			{/if}

			<!-- Production line -->
			<Line
				data={filteredDataset}
				x="year"
				y="value"
				{xScale}
				{yScale}
				stroke={type.color}
				strokeWidth={3}
				curve="monotone"
				{hover}
			/>

			<!-- Animated pulse + current value label at latest data point -->
			{#if filteredDataset.length > 0}
				{@const last = filteredDataset.at(-1)}
				<g transform="translate({xScale(last.year)},{yScale(last.value)})" style="color: {type.color}">
					<circle r="5" class="fill-current" />
					<circle r="5" class="fill-current">
						<animate attributeName="r" from="5" to="10" dur="1.5s" begin="0s" repeatCount="indefinite" />
						<animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite" />
					</circle>
				</g>
				<text
					text-anchor="end"
					dominant-baseline="middle"
					class="text-sm font-semibold"
					style="fill: {type.color}; stroke: white; stroke-width: 3px; paint-order: stroke fill;"
					x={xScale(last.year) - 12}
					y={yScale(last.value) + 5}
					dy={offsets['production'] ?? 0}
				>{formatNumber(+last.value, unit, 2)}</text>
			{/if}

			<!-- Y-axis labels on top of all chart content -->
			<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit="TWh" tickCount={4} />
			<AxisX
				{xScale}
				xDomain={[minYear, chartMaxYear + 2]}
				{innerWidth}
				{innerHeight}
				format={(v) => String(Math.round(v))}
				tickCount={6}
			/>
		</svelte:fragment>

		<svelte:fragment slot="tooltip" let:hover>
			{#if hover.x !== null}
				{@const point = filteredDataset.find((d) => d.year === hover.x)}
				{#if point}
					<Tooltip
						visible={true}
						x={hover.clientX}
						y={hover.clientY}
						title={String(hover.x)}
						items={[{ label: 'Produktion', value: formatNumber(+point.value, unit, 2), color: type.color }]}
					/>
				{/if}
			{/if}
		</svelte:fragment>
	</Chart>
</div>
