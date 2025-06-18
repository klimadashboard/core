<script lang="ts">
	import Switch from '$lib/components/Switch.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { scaleLinear } from 'd3-scale';

	export let data: any[];
	export let region: any;
	export let showPerCapita = false;
	export let populationByYear: { [year: number]: number } = {};

	let chartWidth: number;
	let chartHeight: number;
	let activeCategory = 'all';
	let hoveredYear: { year: number; sectors: any[]; x: number; y: number } | null = null;

	$: margin = { top: 20, right: 20, bottom: 20, left: 90 };
	$: chartWidth = chartWidth || 800;
	$: chartHeight = chartHeight || 320;
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: years = [...new Set(data.map((d: any) => d.year))].sort();
	$: historicYears = [
		...new Set(data.filter((d: any) => d.source !== 'climate-target').map((d: any) => d.year))
	].sort();

	// Use the same custom order for both display and stacking
	$: customSectorOrder = [
		'Energie',
		'Industrie',
		'Gebäude',
		'Mobilität',
		'Landwirtschaft',
		'Abfallwirtschaft und Sonstiges'
	];

	// Create categoryOrder based on actual data categories, ordered by custom sequence
	$: categoryOrder = (() => {
		// Get all unique categories from data
		const dataCategories = [...new Set(data.map((d: any) => d.category))];

		// Create mapping from labels to codes for ordering
		const categoryMap = new Map();
		data.forEach((d: any) => {
			if (d.category_label) {
				categoryMap.set(d.category_label.toLowerCase(), d.category);

				// Handle special mappings for common variations
				if (d.category_label.toLowerCase().includes('abfall')) {
					categoryMap.set('abfallwirtschaft und sonstiges', d.category);
				}
				if (
					d.category_label.toLowerCase().includes('landnutzung') ||
					d.category_label.toLowerCase().includes('agriculture')
				) {
					categoryMap.set('landwirtschaft', d.category);
				}
				if (
					d.category_label.toLowerCase().includes('transport') ||
					d.category_label.toLowerCase().includes('mobility') ||
					d.category_label.toLowerCase().includes('verkehr')
				) {
					categoryMap.set('mobilität', d.category);
				}
				if (
					d.category_label.toLowerCase().includes('building') ||
					d.category_label.toLowerCase().includes('gebäude')
				) {
					categoryMap.set('gebäude', d.category);
				}
				if (
					d.category_label.toLowerCase().includes('industrial') ||
					d.category_label.toLowerCase().includes('industrie')
				) {
					categoryMap.set('industrie', d.category);
				}
				if (
					d.category_label.toLowerCase().includes('energy') ||
					d.category_label.toLowerCase().includes('energie')
				) {
					categoryMap.set('energie', d.category);
				}
			}
		});

		// Order categories based on custom sequence
		const orderedCategories = customSectorOrder
			.map((label) => categoryMap.get(label.toLowerCase()))
			.filter((code) => code && dataCategories.includes(code));

		// Add any remaining categories not in custom order
		const remainingCategories = dataCategories.filter((code) => !orderedCategories.includes(code));

		const finalOrder = [...orderedCategories, ...remainingCategories];

		return finalOrder;
	})();

	// Only show categories that are present in data
	$: displayedCategories = categoryOrder
		.map((cat: any) => {
			const d = data.find((d: any) => d.category === cat);
			return d ? { key: cat, label: d.category_label } : null;
		})
		.filter(Boolean)
		.filter((cat: any) => !cat.label.toLowerCase().includes('kyoto'));

	// Create custom display order for Switch component buttons (left to right)
	$: displayOrderForSwitch = (() => {
		// Use the same order as categoryOrder for consistency
		const sortedCategories = displayedCategories
			.slice() // Create a copy to avoid mutating the original
			.sort((a: any, b: any) => {
				const aIndex = categoryOrder.indexOf(a.key);
				const bIndex = categoryOrder.indexOf(b.key);
				return aIndex - bIndex;
			});

		// Return with "Sektoren" at the beginning
		return [{ key: 'all', label: 'Sektoren' }, ...sortedCategories];
	})();

	// Transform data based on showPerCapita flag and year-specific population
	$: transformedData =
		showPerCapita && Object.keys(populationByYear).length > 0
			? data.map((d: any) => {
					const yearPopulation = populationByYear[d.year];
					if (yearPopulation) {
						return {
							...d,
							value: (d.value * 1_000_000) / yearPopulation
						};
					} else {
						return region.population
							? {
									...d,
									value: (d.value * 1_000_000) / region.population
								}
							: d;
					}
				})
			: data;

	// Group and stack using transformed data
	$: grouped = historicYears.map((year: any) => {
		const values = categoryOrder.map((cat: any) => {
			const match = transformedData.find((d: any) => d.year === year && d.category === cat);
			return {
				sector: cat,
				label: match?.category_label ?? cat,
				color: match?.category_color ?? '#ccc',
				value: match?.value ?? 0,
				source: match?.source ?? 'unknown'
			};
		});
		return {
			year,
			sectors: values,
			total: values.reduce((sum: number, d: any) => sum + d.value, 0)
		};
	});

	$: stacked = grouped.map((yearData: any) => {
		let yOffset = 0;
		const stackedSectors = yearData.sectors.map((s: any) => {
			const start = yOffset;
			yOffset += s.value;
			return { ...s, start, end: yOffset };
		});
		return { ...yearData, stackedSectors };
	});

	$: unit = showPerCapita ? 't CO2eq pro Kopf' : 'Mt CO2eq';

	$: visibleMax =
		activeCategory === 'all'
			? Math.max(...grouped.map((g: any) => g.total)) * 1.1
			: Math.max(
					...grouped.map(
						(g: any) => g.sectors.find((s: any) => s.sector === activeCategory)?.value ?? 0
					)
				) * 1.1;

	$: minYear = years[0];
	$: maxYear = years[years.length - 1];
	$: barWidth = Math.round(chartWidth / (maxYear - minYear) - 4);

	$: xScale = scaleLinear().domain([minYear, maxYear]).range([0, innerChartWidth]);
	$: yScale = scaleLinear().domain([0, visibleMax]).range([innerChartHeight, 0]);

	// Transform climate targets if per capita is enabled
	// Transform climate targets if per capita is enabled
	$: climateTargets = data
		.filter((d: any) => d.source === 'climate-target')
		.map((d: any) => {
			if (showPerCapita && Object.keys(populationByYear).length > 0) {
				const yearPopulation = populationByYear[d.year];
				if (yearPopulation) {
					return { ...d, value: (d.value * 1_000_000) / yearPopulation };
				} else if (region.population) {
					return { ...d, value: (d.value * 1_000_000) / region.population };
				}
			}
			return d;
		})
		.sort((a: any, b: any) => a.year - b.year);
	$: latestYear = Math.max(...historicYears);
	$: latestTotal = grouped.find((g: any) => g.year === latestYear)?.total ?? 0;
	$: lastTarget = climateTargets[climateTargets.length - 1];
</script>

{#if grouped.length > 0}
	<div class="mb-4">
		<p class="text-xl max-w-xl mt-4">
			<strong>{region.name}</strong>: {grouped[grouped.length - 1].year} entfielen die meisten Emissionen
			{#if showPerCapita && Object.keys(populationByYear).length > 0}
				pro Kopf
			{:else if showPerCapita && region.population}
				pro Kopf
			{:else}{/if}
			auf die Sektoren
			{#each grouped[grouped.length - 1].sectors
				.slice()
				.sort((a: any, b: any) => b.value - a.value)
				.slice(0, 3) as s, i}
				<span
					class="inline-block px-1 py-0.5 rounded text-white"
					style="background-color: {s.color}"
				>
					{s.label}
				</span>{i < 2 ? ', ' : ''}
			{/each}

			{#if lastTarget && activeCategory === 'all'}
				Bis {lastTarget.year} möchte {region.name}
				{lastTarget.value == 0 ? 'Klimaneutralität' : formatNumber(lastTarget.value) + ' ' + unit} erreicht
				haben.
			{/if}
		</p>

		<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="h-80 mt-8 relative">
			{#if chartWidth && chartHeight}
				<svg width="100%" height="100%">
					<!-- x-axis -->
					<g transform={`translate(${margin.left},${margin.top + innerChartHeight})`}>
						{#each xScale.ticks(chartWidth > 600 ? 10 : 5) as tick}
							<g transform={`translate(${xScale(tick)}, 0)`} class="text-xs">
								<line x1={0} y1={0} x2={0} y2={5} class="stroke-current/10" />
								<text
									class="fill-current/70"
									dominant-baseline="hanging"
									y={7}
									text-anchor="middle"
								>
									{tick}
								</text>
							</g>
						{/each}
					</g>

					<!-- y-axis -->
					<g transform={`translate(0,${margin.top})`}>
						{#each yScale.ticks() as tick, i}
							<g transform={`translate(0, ${yScale(tick)})`} class="text-xs">
								<line x1={margin.left} y1={0} x2={chartWidth} y2={0} class="stroke-current/10" />
								<text class="fill-current/70" x={4} dominant-baseline="middle">
									{tick}
									{i === yScale.ticks().length - 1 ? unit : ''}
								</text>
							</g>
						{/each}
					</g>

					<!-- bars -->
					<g transform={`translate(${margin.left},${margin.top})`}>
						{#each stacked as yearData}
							<g transform={`translate(${xScale(yearData.year)}, 0)`}>
								{#if activeCategory === 'all'}
									{#each yearData.stackedSectors as s}
										<rect
											x={-barWidth / 2}
											y={yScale(s.end)}
											width={barWidth}
											height={yScale(s.start) - yScale(s.end)}
											fill={s.color}
											on:mouseenter={(e) => {
												const target = e.target as SVGRectElement;
												if (target) {
													hoveredYear = {
														year: yearData.year,
														sectors: yearData.sectors,
														x: xScale(yearData.year) + margin.left - 50,
														y: yScale(s.end) + margin.top - 10
													};
												}
											}}
											on:mouseleave={() => {
												hoveredYear = null;
											}}
										>
											<title>{s.label}: {formatNumber(s.value)} {unit}</title>
										</rect>
									{/each}
								{:else}
									{#each yearData.stackedSectors.filter((s: any) => s.sector === activeCategory) as s}
										<rect
											x={-barWidth / 2}
											y={yScale(s.value)}
											width={barWidth}
											height={innerChartHeight - yScale(s.value)}
											fill={s.color}
											on:mouseenter={(e) => {
												const target = e.target as SVGRectElement;
												if (target) {
													hoveredYear = {
														year: yearData.year,
														sectors: yearData.sectors,
														x: xScale(yearData.year) + margin.left - 50,
														y: yScale(s.value) + margin.top - 10
													};
												}
											}}
											on:mouseleave={() => {
												hoveredYear = null;
											}}
										>
											<title>{s.label}: {formatNumber(s.value)} {unit}</title>
										</rect>
									{/each}
								{/if}
							</g>
						{/each}
					</g>

					<!-- Climate targets -->
					{#if climateTargets.length > 0 && historicYears.length > 0 && activeCategory === 'all'}
						<g transform={`translate(${margin.left},${margin.top})`}>
							{#each climateTargets as target}
								<rect
									x={xScale(target.year) - barWidth / 2}
									y={yScale(target.value)}
									width={barWidth}
									height={innerChartHeight - yScale(target.value)}
									fill="#000"
									opacity={0.1}
								>
									<title>Ziel {target.year}: {formatNumber(target.value)} {unit}</title>
								</rect>
							{/each}
						</g>
						<g
							transform={`translate(${margin.left},${margin.top})`}
							fill="none"
							stroke="black"
							stroke-width="2"
						>
							<path
								d={[
									`M ${xScale(latestYear)},${yScale(latestTotal)}`,
									...climateTargets.map((d) => `L ${xScale(d.year)},${yScale(d.value)}`)
								].join(' ')}
								stroke-dasharray="4"
								opacity={0.5}
							/>
						</g>
						<g
							transform={`translate(${xScale(lastTarget.year) + margin.left + 5}, ${yScale(lastTarget.value) + margin.top - 5})`}
						>
							<text class="text-xs fill-current" x={-30} y={-10}>
								{formatNumber(lastTarget.value)}{unit} Ziel in {lastTarget.year}
							</text>
						</g>
					{/if}
				</svg>

				<!-- Hover tooltip directly over chart -->
				{#if hoveredYear}
					<div class="absolute z-50 pointer-events-none -top-6 left-0 text-sm">
						<div class="flex flex-wrap gap-1 p-2">
							{#if activeCategory === 'all'}
								{#each hoveredYear.sectors
									.filter((s: any) => s.value > 0)
									.sort((a: any, b: any) => {
										// Sort by the same order as categoryOrder (bottom to top in stack)
										const aIndex = categoryOrder.indexOf(a.sector);
										const bIndex = categoryOrder.indexOf(b.sector);
										return aIndex - bIndex;
									}) as s}
									<div
										class="inline-flex items-center px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-lg"
										style="background-color: {s.color}"
									>
										<span class="uppercase font-bold">{s.label}</span>
										<span class="ml-2"
											>{formatNumber(s.value)}
											{unit}</span
										>
									</div>
								{/each}
							{:else}
								{#each hoveredYear.sectors.filter((s: any) => s.sector === activeCategory) as s}
									{#if s.value > 0}
										<div
											class="inline-flex items-center px-3 py-1.5 rounded-full text-white text-sm font-medium shadow-lg"
											style="background-color: {s.color}"
										>
											<span class="uppercase font-bold">{s.label}</span>
											<span class="ml-2"
												>{formatNumber(s.value)}
												{unit}</span
											>
											<span class="ml-1 opacity-75">({hoveredYear.year})</span>
										</div>
									{/if}
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<Switch
	type="small"
	views={displayOrderForSwitch}
	bind:activeView={activeCategory}
	on:itemClick={(event) => {
		activeCategory = event.detail;
	}}
/>

<div class="max-w-2xl text-sm leading-tight mt-4 opacity-80">
	<p>Datenquelle: {data[0].source}</p>
	{#if showPerCapita && Object.keys(populationByYear).length > 0}
		<p>Pro-Kopf-Werte basieren auf jahresspezifischen Bevölkerungsdaten für {region.name}.</p>
	{:else if showPerCapita && region.population}
		<p>
			Pro-Kopf-Werte basieren auf einer Bevölkerung von {region.population.toLocaleString()} Einwohnern
			(einheitlich für alle Jahre).
		</p>
	{/if}
</div>
