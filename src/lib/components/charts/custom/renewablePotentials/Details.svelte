<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import * as d3 from 'd3';
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';
	import Papa from 'papaparse';

	export let bundesland;
	export let type;
	export let dataset;
	export let potential_2030;
	export let potential_techn;
	export let goals;
	export let selectedStartYear;
	export let showTechn;
	export let predefinedMaxValue = undefined;

	const margin = { top: 15, right: 15, left: 15, bottom: 25 };
	let chartWidth = 0;
	let chartHeight = 0;
	let unit = 'TWh';
	const grey = '#A3A3A3';
	const green = '#4FB365';
	const goalLabelXOffset = 10;
	const labelOverlapThreshold = 25;
	const leftGoalLabelYear = 2030;

	/** @typedef {{ id: string; baseY: number }} LabelEntry */

	/** @param {LabelEntry[]} labels */
	const calculateLabelOffsets = (labels) => {
		const offsets = Object.fromEntries(labels.map((label) => [label.id, 0]));
		const sortedLabels = [...labels].sort((left, right) => left.baseY - right.baseY);

		for (let index = 0; index < sortedLabels.length; index += 1) {
			for (let compareIndex = index + 1; compareIndex < sortedLabels.length; compareIndex += 1) {
				const currentLabel = sortedLabels[index];
				const compareLabel = sortedLabels[compareIndex];
				const distance =
					compareLabel.baseY + offsets[compareLabel.id] - (currentLabel.baseY + offsets[currentLabel.id]);

				if (distance >= labelOverlapThreshold) {
					break;
				}

				const adjustment = Math.ceil((labelOverlapThreshold - distance) / 2);
				offsets[currentLabel.id] -= adjustment;
				offsets[compareLabel.id] += adjustment;
			}
		}

		return offsets;
	};

	$: normalizedGoals = [];
	$: {
		const nextGoals = [];

		for (const [goalIndex, goal] of (goals ?? []).entries()) {
			const normalizedGoal = {
				...goal,
				goalAmount: +goal.goal_amount,
				goalYear: +goal.goal_year,
				sourceYear: +goal.source_year,
				goalCategory: goal.source_category ?? 'Weiteres Ziel',
				labelId: `goal-${goal.source_category ?? 'Weiteres Ziel'}-${goal.goal_year}-${goal.goal_amount}-${goalIndex}`
			};

			if (!isNaN(normalizedGoal.goalAmount) && !isNaN(normalizedGoal.goalYear)) {
				nextGoals.push(normalizedGoal);
			}
		}

		nextGoals.sort((left, right) => {
			if (left.goalCategory !== right.goalCategory) {
				return left.goalCategory.localeCompare(right.goalCategory);
			}

			if (left.goalYear !== right.goalYear) {
				return left.goalYear - right.goalYear;
			}

			return left.goalAmount - right.goalAmount;
		});

		normalizedGoals = nextGoals;
	}

	$: goalsByCategory = {};
	$: {
		const nextGroups = {};

		for (const goal of normalizedGoals) {
			if (!nextGroups[goal.goalCategory]) {
				nextGroups[goal.goalCategory] = [];
			}

			nextGroups[goal.goalCategory].push(goal);
		}

		goalsByCategory = nextGroups;
	}

	$: has_goals = normalizedGoals.length > 0;
	$: productionValue = dataset?.length ? +dataset[dataset.length - 1].value : null;

	$: maxYear = Math.max(2040, ...normalizedGoals.map((goal) => goal.goalYear), 0);
	$: minYear = Math.max(dataset[0].year, selectedStartYear);
	$: maxValue = predefinedMaxValue
		? predefinedMaxValue
		: (showTechn
				? potential_techn
				: Math.max(
						Math.max(...normalizedGoals.map((goal) => goal.goalAmount), 0),
						potential_2030,
						Math.max(...dataset.map((g) => +g.value))
				  )) * 1.1;
	$: minValue = 0;

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: xScale = dataset
		? d3
				.scaleTime()
				.range([0, innerChartWidth])
				.domain([new Date(minYear, 1, 1), new Date(maxYear, 12, 31)])
		: null;
	$: yScale = dataset
		? d3.scaleLinear().range([innerChartHeight, 0]).domain([minValue, maxValue])
		: null;
	$: line = d3
		.line()
		.x((d) => xScale(new Date(d.year, 1, 1)))
		.y((d) => yScale(d.value));
	/** @type {Record<string, number>} */
	let labelOffsets = {};
	$: {
		/** @type {LabelEntry[]} */
		const nextLabelOffsets = [];

		if (yScale) {
			for (const goal of normalizedGoals) {
				nextLabelOffsets.push({
					id: goal.labelId,
					baseY: yScale(goal.goalAmount)
				});
			}

			if (potential_2030 != null && potential_2030 > 0) {
				nextLabelOffsets.push({
					id: 'potential-2030',
					baseY: yScale(potential_2030)
				});
			}

			if (productionValue != null && !isNaN(productionValue)) {
				nextLabelOffsets.push({
					id: 'production',
					baseY: yScale(productionValue) + 5
				});
			}
		}

		labelOffsets = calculateLabelOffsets(nextLabelOffsets);
	}

</script>

<div class="bg-gray-100 rounded-sm overflow-hidden">
	<div
		class="text-white p-1 flex justify-between items-center"
		style="background: {type.color}; padding-left: 1rem; padding-right: 1rem;"
	>
		<h3 class="text-xl">
			<b>{type.label}</b>
			<span class="text-sm">{has_goals ? '' : '(kein Ausbauziel definiert)'}</span>
		</h3>
		{@html type.icon}
	</div>
	<div class="h-auto">
		<div class="relative w-full h-56" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
			{#if chartWidth && chartHeight && dataset != null && type != null && potential_techn != null}
				{@const last_datapoint = dataset[dataset.length - 1]}

				<svg width={'100%'} height={'100%'}>
					<g transform="translate({margin.left},{margin.top})">
						<g>
							{#each xScale.ticks(6) as tick, index}
								<g transform={`translate(${xScale(tick)}, ${0})`} class="text-gray-200">
									<line
										x1={0}
										x2={0}
										y1={innerChartHeight - 5}
										y2={innerChartHeight}
										class="stroke-gray-400"
									/>
									<text
										class="text-sm text-gray-600 fill-current"
										text-anchor="middle"
										y={innerChartHeight + margin.bottom - 7}>{tick.getFullYear()}</text
									>
								</g>
							{/each}
									<g style="color: {type.color}">
						<g>
							{#each yScale.ticks(3) as tick, index}
								<g transform={`translate(${-margin.left}, ${yScale(tick)})`} class="text-gray-400">
									<line
										x1="0"
										x2={chartWidth}
										y1="0"
										y2="0"
										class={index == 0 ? 'stroke-gray-400' : 'stroke-gray-200'}
									/>
									<text class="text-sm text-gray-600 fill-current bg-white" x="10" y="-4"
										>{tick} {index == yScale.ticks(3).length - 1 ? ' ' + unit : ''}</text
									>
								</g>
							{/each}
							<!-- 0 Linie -->
							<g transform={`translate(0, ${yScale(0)})`} class="text-gray-400">
								<line
									x1="0"
									x2={chartWidth}
									y1="0"
									y2="0"
									stroke-width="2"
									class="stroke-gray-400 opacity-70"
								/>
							</g>
						</g>
						{#if has_goals}
							<g class="opacity-70">
								{#each Object.entries(goalsByCategory) as [goalCategory, categoryGoals], categoryIndex}
									{#each categoryGoals as goal, index}
										{@const shouldDrawLine = goalCategory === 'Bundesland'}
										{@const previousGoal = shouldDrawLine && index > 0 ? categoryGoals[index - 1] : null}
										{@const sourceYear = previousGoal ? previousGoal.goalYear : goal.sourceYear}
										{@const sourceAmount = previousGoal
											? previousGoal.goalAmount
											: +dataset.find((d) => +d.year === sourceYear)?.value}
										{#if shouldDrawLine}
											{#if !isNaN(sourceYear) && !isNaN(sourceAmount)}
												<line
													x1={xScale(new Date(sourceYear, 1, 1))}
													y1={yScale(sourceAmount)}
													x2={xScale(new Date(goal.goalYear, 1, 1))}
													y2={yScale(goal.goalAmount)}
													class="stroke-2 stroke-current opacity-50"
													stroke-dasharray="10 10"
												/>
											{:else}
												{@const closestDatapoint = dataset
													.map((d) => {
														return {
															distance: Math.abs(+d.year - sourceYear),
															value: d.value
														};
													})
													.sort((a, b) => a.distance - b.distance)[0]}
												{#if closestDatapoint}
													<line
														x1={xScale(new Date(sourceYear, 1, 1))}
														y1={yScale(closestDatapoint.value)}
														x2={xScale(new Date(goal.goalYear, 1, 1))}
														y2={yScale(goal.goalAmount)}
														class="stroke-2 stroke-current opacity-70"
														stroke-dasharray="10 10"
													/>
												{/if}
											{/if}
										{/if}
										<g transform="translate({xScale(new Date(goal.goalYear, 1, 1))},{yScale(goal.goalAmount)})">
											<circle r={4} class="fill-none stroke-current stroke-2" />
										</g>
										{@const goalLabelOnLeft = goal.goalYear > leftGoalLabelYear}
										<text
											text-anchor={goalLabelOnLeft ? 'end' : 'start'}
											dominant-baseline="middle"
											class="text-sm font-semibold fill-current bg-white chart-text"
											style="color: {type.color};"
											x={xScale(new Date(goal.goalYear, 1, 1)) + (goalLabelOnLeft ? -goalLabelXOffset : goalLabelXOffset)}
											y={yScale(goal.goalAmount)}
											dy={labelOffsets[goal.labelId] ?? 0}
										>
											{goalCategory}: {goal.goalAmount >= 0.01
												? formatNumber(goal.goalAmount, unit, 2)
												: goal.goalAmount + " " + unit}
										</text>
									{/each}
								{/each}
							</g>
							<!-- {:else}
							<g>
								<text
									text-anchor={'start'}
									class="text-sm font-semibold fill-current bg-white"
									style="fill: {grey};"
									x={xScale(new Date(maxYear, 1, 1))}
									y={yScale(maxValue) + 5}
								>
									{bundesland} hat kein Ausbauziel für {type.label}
								</text>
							</g> -->
						{/if}
						{#if potential_2030 != null && potential_2030 > 0}
							<g
								transform="translate({xScale(new Date(2030, 1, 1))},{yScale(potential_2030)})"
								class="text-green-600 opacity-70"
							>
								<text
									text-anchor="start"
									x={12}
									dominant-baseline="middle"
									dy={labelOffsets['potential-2030'] ?? 0}
									class="text-sm font-semibold fill-current bg-white chart-text"
									>{formatNumber(potential_2030, unit, 2)}
									Potential
								</text>
								<!--
							<text
								text-anchor="middle"
								class="text-xl font-semibold fill-current bg-white"
								style="fill: {grey}"
								x={xScale(new Date(2030, 1, 1))}
								y={yScale(potential_2030)}
								dy={4}
								dx={0}>★</text
							>
						-->
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									y={-12}
									x={-12}
									><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle
										cx="12"
										cy="12"
										r=".5"
										fill="currentColor"
									/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg
								>
							</g>
						{/if}
						{#if potential_techn != null && showTechn}
							<g class="opacity-70">
								<line
									x1={xScale(new Date(minYear, 1, 1))}
									y1={yScale(potential_techn)}
									x2={xScale(new Date(maxYear + 5, 1, 1))}
									y2={yScale(potential_techn)}
									stroke-dasharray="5,5"
									style="stroke:{grey}; stroke-width:1"
								/>
							<!-- <line x1={xScale(new Date(2030, 1, 1))} y1={yScale(minValue)} x2={xScale(new Date(2030, 1, 1))} y2={yScale(potential_techn*1.12)} stroke-dasharray="5,5" style="stroke:grey; stroke-width:1" /> -->

								<text
									text-anchor="start"
									style="fill:{grey};"
									class="text-sm bg-white font-semibold chart-text"
									x={xScale(new Date(maxYear - (maxYear - minYear) / 2, 1, 1))}
									y={yScale(potential_techn)}
									dx={12}
									dy={-3}
									>{formatNumber(potential_techn, unit, 2)}
									Technisch möglich
								</text>
							</g>
						{/if}

						<g class="opacity-100">
							<path
								d={line(dataset)}
								fill="none"
								stroke={type.color}
								stroke-width="3"
								stroke-linecap="round"
								class="chart-area"
							/>
						</g>
						<g
							transform="translate({xScale(
								new Date(dataset[dataset.length - 1].year, 1, 1)
							)},{yScale(dataset[dataset.length - 1].value)})"
							style="color: {type.color}"
							class="opacity-100"
						>
							<circle r="5" class="fill-current" />
							<circle r="5" class="fill-current">
								<animate
									attributeName="r"
									from="5"
									to="10"
									dur="1.5s"
									begin="0s"
									repeatCount="indefinite"
								/>
								<animate
									attributeName="opacity"
									from="1"
									to="0.5"
									dur="1.5s"
									begin="0s"
									repeatCount="indefinite"
								/>
							</circle>
							<text
								class="text-sm font-semibold fill-current chart-text"
								x={12}
								y={5}
								transition:fade
								dy={labelOffsets.production ?? 0}
								>{last_datapoint.value >= 0.01
									? formatNumber(last_datapoint.value, unit, 2)
									: "< 0.01" + " " + unit}
								Produktion
								<!-- im Zeitraum
                                <tspan x="16" y="16"
                                    >{dataset[0].year} - {dataset[dataset.length - 1].year}</tspan
                                > -->
							</text>
						</g>

						<!-- <g
							transform="translate({xScale(dataGoal[dataGoal.length - 1].x)},{yScale(
								dataGoal[dataGoal.length - 1].y
							)})"
						>
                            <text
                                style="color:grey"
                                class="text-sm font-semibold fill-current"
                                text-anchor="end"
                                x={-10}
                                y={-2}
                                >{goalYear}-Ziel: {formatNumber(dataGoal[dataGoal.length - 1].y)}
                                {unit} Strom aus {type.label}</text
                            >

							<circle r="5" fill={"grey"} />
						</g> -->
					</g>
				</svg>
			{/if}
		</div>
	</div>
</div>

<!-- <div>
    <div
        class="relative w-full h-32"
        bind:clientWidth={chartWidth}
        bind:clientHeight={chartHeight}
    >
        {#if chartWidth && chartHeight && dataset != null && energyType != null && potential_techn != null}
            <svg width={'100%'} height={'100%'}>
                <g transform="translate(0,{margin.top})">
                    <path
                        d={line(dataset)}
                        fill={"none"}
                        stroke={energyType.color}
                        stroke-width="3"
                        stroke-linecap="round"
                        class="chart-area"
                    />
                </g>
            </svg>
            
        {/if}
    </div>
</div> -->
