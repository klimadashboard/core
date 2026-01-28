<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { min, max } from 'd3-array';
	import formatNumber from '$lib/stores/formatNumber';
	import Papa from 'papaparse';
	import dayjs from 'dayjs';

	export let type;
	export let dataset;
	export let dataGoal;
	export let goalScenario;

	let unit = 'TWh';
	$: nationalGoal = dataGoal.value;

	$: colorScale = scaleLinear()
		.range(type.colorScale)
		.domain([max(federalStates, (d) => d.goal), min(federalStates, (d) => d.goal)]);

	$: federalStates = [...new Set(dataset?.map((d) => d.state_name))]
		.map((state) => {
			const goal = dataset.find(
				(d) => d.state_name == state && d.energy_data_key == type.dataKey && d.goal_year > dayjs().year()
			)
				? dataset.find(
						(d) =>
							d.state_name == state && d.energy_data_key == type.dataKey && d.goal_year > dayjs().year()
					).goal_amount
				: 0;
			const goalYear = dataset.find(
				(d) => d.state_name == state && d.energy_data_key == type.dataKey && d.goal_year > dayjs().year()
			)
				? dataset.find(
						(d) =>
							d.state_name == state && d.energy_data_key == type.dataKey && d.goal_year > dayjs().year()
					).goal_year
				: 2030;
			const currentProduction =
				dataset.find((d) => d.state_name == state && d.energy_data_key == type.dataKey).current_production >
				0
					? dataset.find((d) => d.state_name == state && d.energy_data_key == type.dataKey)
							.current_production
					: 0;

			return {
				state: state,
				goal: +goal,
				goalYear: +goalYear,
				currentProduction: +currentProduction,
				goalAndProduction: +goal + currentProduction,
				abbreviation: dataset?.find((d) => d.state_name == state).state_short
			};
		})
		.sort((a, b) => b.goal - a.goal);

	let chartWidth;
	let chartHeight;

	$: xScale = scaleLinear().range([0, chartWidth]).domain([0, nationalGoal]);

	$: getOffset = function (element, elements) {
		var total = 0;
		var index = elements.indexOf(element);

		for (var i = 0; i < index; i++) {
			total = total + elements[i].goalAndProduction;
		}

		return xScale(total);
	};

	$: totalGoals = federalStates.reduce((a, b) => a + b.goal, 0);
	$: totalProduction = federalStates.reduce((a, b) => a + b.currentProduction, 0);
	$: totalGoalsAndProduction = totalGoals + totalProduction;
	$: percentage = (totalGoalsAndProduction / nationalGoal) * 100;
	$: selectedState = null;
	$: statesNoGoals = federalStates.filter((d) => d.goal > 0 == false);
	$: gap = nationalGoal - totalGoalsAndProduction;
</script>

<div class="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
	<div class="text-white p-4 flex justify-between items-center" style="background: {type.color}">
		<h3 class="text-xl">
			<b>{type.label}</b> Nationales {goalScenario}-Ausbauziel zu {Math.round(percentage)}%
			abgedeckt
		</h3>
		{@html type.icon}
	</div>

	<div class="p-4">
		<div
			class="w-full h-24 border-2 border-gray-300 bg-white dark:bg-gray-900"
			bind:clientHeight={chartHeight}
			bind:clientWidth={chartWidth}
		>
			<svg width={'100%'} height={'100%'}>
				<g>
					{#each federalStates as state}
						<g
							transform="translate({getOffset(state, federalStates)},0)"
							on:mouseover={() => (selectedState = state)}
							on:mouseout={() => (selectedState = null)}
						>
							<rect
								width={xScale(state.goal > 0 ? state.goal : state.currentProduction)}
								height={chartHeight}
								fill={type.color}
								class="stroke-white {state.goal > 0 ? '' : 'opacity-50'}"
							/>
							{#if xScale(state.goalAndProduction) > 16}
								<text
									x={-6}
									y={6}
									dominant-baseline="hanging"
									class="font-bold text-xs fill-white"
									text-anchor="end"
									transform="rotate(270)">{state.abbreviation}</text
								>
							{/if}
						</g>
					{/each}
				</g>
				{#if gap > nationalGoal * 0.275 && xScale(gap) > 50}
					<g
						transform="translate({xScale(
							federalStates.reduce((a, b) => a + b.goalAndProduction, 0)
						)},{chartHeight / 2})"
						class="text-gray-400"
					>
						<line x1={5} x2={xScale(gap) - 8} y1={0} y2={0} class="stroke-current opacity-50" />
						<g transform="translate({xScale(gap) / 2},0)">
							<rect
								class="fill-white"
								height={10}
								width={xScale(gap) > 120 ? 120 : 70}
								x={xScale(gap) > 120 ? -60 : -35}
								y={-5}
							/>
							<text
								class="text-sm uppercase tracking-wide font-semibold fill-current"
								text-anchor="middle"
								dominant-baseline="middle"
							>
								{#if xScale(gap) > 120}
									Ambitionslücke
								{:else}
									<tspan x="0" y="-2">Ambitions</tspan>
									<tspan x="0" y="14">lücke</tspan>
								{/if}
							</text>
						</g>
					</g>
				{/if}
			</svg>
		</div>
		<div
			class="flex justify-between pt-2 border-r-2 border-gray-300 text-gray-700 text-sm md:text-base"
		>
			{#if selectedState}
				<p class="" style="color: {type.color}">
					{#if selectedState.goal > 0}
						Ziel von {selectedState.state}: <br />{formatNumber(selectedState.goal)}
						{unit} bis {selectedState.goalYear}
					{:else}
						{selectedState.state} hat kein definiertes Ziel bis {selectedState.goalYear}.
					{/if}
					{#if selectedState.currentProduction > 0}
						{#if type.dataKey == 'wasserkraft'}
							<br />Durchschnittsproduktion 2018-2020:
						{:else}
							<br />Aktuelle Produktion:
						{/if}
						<br />{formatNumber(selectedState.currentProduction)}
						{unit}
					{/if}
				</p>
			{:else}
				<p class="" style="color: {type.color}">
					Geplante Stromproduktion der Bundesländer: <br />{formatNumber(
						federalStates.reduce((a, b) => a + b.goalAndProduction, 0)
					)}
					{unit} im Jahr 2030
					<br />
					{#if statesNoGoals.length > 0}
						<span class="">
							Bundesländer ohne Ausbauziele bis 2030:<br />
							{#each statesNoGoals as state, index}
								{state.state}{index !== statesNoGoals.length - 1 ? ', ' : ''}
							{/each}
						</span>
					{/if}
				</p>
			{/if}
			<p class="text-right pr-2">
				Nationales {goalScenario}-Ziel: <br />{formatNumber(nationalGoal)}
				{unit} bis 2030
			</p>
		</div>
	</div>
</div>
