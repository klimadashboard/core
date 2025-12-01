<script>
	import { Plot, BarY, RuleY, Text, stackY } from 'svelteplot';

	export let data = [];

	// Which categories are renewable vs not
	const renewableCategories = ['on_foot', 'bicycle', 'e_bike', 'public_transport'];
	const nonRenewableCategories = ['motorbike', 'car_driver', 'car_passenger'];

	const categoryMeta = {
		on_foot: { label: 'On foot', icon: '🚶‍♀️', renewable: true },
		bicycle: { label: 'Bicycle', icon: '🚲', renewable: true },
		e_bike: { label: 'E-bike', icon: '🚴‍♂️', renewable: true },
		public_transport: { label: 'Public transport', icon: '🚌', renewable: true },
		motorbike: { label: 'Motorbike', icon: '🏍️', renewable: false },
		car_driver: { label: 'Car driver', icon: '🚗', renewable: false },
		car_passenger: { label: 'Car passenger', icon: '🚙', renewable: false }
	};

	// Colors: green/blue for renewable, orange/red for fossil
	const categoryColor = {
		on_foot: '#15803d', // dark green
		bicycle: '#22c55e', // medium green
		e_bike: '#4ade80', // light green
		public_transport: '#0ea5e9', // blue-green
		motorbike: '#f97316', // orange
		car_driver: '#ef4444', // red
		car_passenger: '#b91c1c' // dark red
	};

	const ghostColors = {
		renewable: '#4ade80', // pale green
		nonRenewable: '#ef4444' // pale red
	};

	// -----------------------------------------------------------
	// Clean data
	// -----------------------------------------------------------
	$: cleanData = (data || [])
		.map((r) => ({
			...r,
			year: typeof r.year === 'string' ? Number(r.year) : r.year,
			value: typeof r.value === 'string' ? Number(r.value) : r.value
		}))
		.filter((r) => !isNaN(r.year) && !isNaN(r.value));

	$: years = Array.from(new Set(cleanData.map((d) => d.year))).sort((a, b) => a - b);

	// -----------------------------------------------------------
	// Historic rows for BarY (let BarY do the stacking)
	// Renewables first => stacked at the bottom, then non-renewables.
	// -----------------------------------------------------------
	$: historicRows = (() => {
		const result = [];

		for (const year of years) {
			const yearRows = cleanData.filter((d) => d.year === year);

			const add = (cats) => {
				for (const cat of cats) {
					const entry = yearRows.find((d) => d.category === cat);
					if (!entry) continue;
					result.push({
						year,
						category: cat,
						value: entry.value
					});
				}
			};

			add(renewableCategories); // bottom of stack
			add(nonRenewableCategories); // top of stack
		}

		return result;
	})();

	// -----------------------------------------------------------
	// Ghost goal bars (2025–2030) towards 50% renewable
	// -----------------------------------------------------------
	const goalStartYear = 2024;
	const goalEndYear = 2030;
	const goalTargetRenewable = 50; // percent of trips
	const futureYears = [2025, 2026, 2027, 2028, 2029, 2030];

	// latest year with data <= goalStartYear
	$: baselineYear = (() => {
		if (!years.length) return null;
		const candidates = years.filter((y) => y <= goalStartYear).sort((a, b) => b - a);
		return candidates[0] || years[years.length - 1];
	})();

	$: baselineRenewableShare = (() => {
		if (!baselineYear) return 0;
		const baseRows = cleanData.filter((d) => d.year === baselineYear);
		const total = baseRows.reduce((sum, d) => sum + d.value, 0);
		const renewable = baseRows
			.filter((d) => renewableCategories.includes(d.category))
			.reduce((sum, d) => sum + d.value, 0);

		if (!total) return 0;
		return (renewable / total) * 100;
	})();

	// Two ghost categories: renewable_target (bottom) + non_renewable_target (top)
	$: ghostRows = (() => {
		const result = [];

		for (const y of futureYears) {
			const t = (y - goalStartYear) / (goalEndYear - goalStartYear); // 0..1
			const renewableShare =
				baselineRenewableShare + t * (goalTargetRenewable - baselineRenewableShare);
			const nonRenewableShare = 100 - renewableShare;

			// push renewable first so it's bottom of the stack
			result.push({
				year: y,
				category: 'renewable_target',
				value: renewableShare
			});
			result.push({
				year: y,
				category: 'non_renewable_target',
				value: nonRenewableShare
			});
		}

		return result;
	})();

	// x-axis domain: all years that should appear, left -> right
	$: allYears = Array.from(new Set([...years, ...futureYears])).sort((a, b) => a - b);

	// -----------------------------------------------------------
	// Label rows: compute vertical midpoints inside each stacked segment
	// -----------------------------------------------------------
	$: labelRows = (() => {
		if (!historicRows.length) return [];

		const rows = [];
		let currentYear = null;
		let acc = 0; // running total per year (0..100)

		for (const row of historicRows) {
			// Reset accumulator when year changes
			if (row.year !== currentYear) {
				currentYear = row.year;
				acc = 0;
			}

			const start = acc;
			const end = acc + row.value;
			const mid = (start + end) / 2;

			// Optionally: skip very tiny slices so labels don't overlap
			// if (row.value < 3) { acc = end; continue; }

			rows.push({
				...row,
				yMid: mid
			});

			acc = end;
		}

		return rows;
	})();
</script>

<Plot
	x={{ type: 'band', domain: allYears, label: '', axis: 'top' }}
	y={{ domain: [0, 100], label: 'Modal Split (%)' }}
	margin={{ top: 24, right: 10, bottom: 40, left: 80 }}
	grid
	height={400}
>
	<!-- Ghost goal bars (background), stacked by category -->
	<BarY
		data={ghostRows}
		x="year"
		y="value"
		fill={(d) =>
			d.category === 'renewable_target' ? ghostColors.renewable : ghostColors.nonRenewable}
		fillOpacity={0.3}
	/>

	<!-- Actual modal split, stacked with renewables at the bottom -->
	<BarY
		data={historicRows}
		x="year"
		y="value"
		fill={(d) => categoryColor[d.category] || '#6b7280'}
		stroke="#ffffff"
		strokeWidth={1}
	/>

	<!-- Icons inside bars -->
	<Text
		data={labelRows}
		x="year"
		y="yMid"
		text={(d) => categoryMeta[d.category]?.icon ?? ''}
		textAnchor="middle"
		dy={-4}
		fontSize={16}
	/>

	<!-- Labels inside bars -->
	<Text
		data={labelRows}
		x="year"
		y="yMid"
		text={(d) => categoryMeta[d.category]?.label ?? d.category}
		textAnchor="middle"
		dy={10}
		fill="white"
		fontSize={10}
	/>

	<!-- 50% reference line -->
	<RuleY data={[50]} stroke="currentColor" strokeDasharray="4 2" strokeWidth={1} />
</Plot>

<!--
<div class="flex items-center flex-wrap gap-5">
	{#each renewableCategories as cat}
		<div class="flex items-center gap-1">
			<span class="w-3 h-3 rounded-full" style={`background:${categoryColor[cat]};`} />
			<span class="icon">{categoryMeta[cat].icon}</span>
			<span class="label">{categoryMeta[cat].label}</span>
		</div>
	{/each}

	{#each nonRenewableCategories as cat}
		<div class="flex items-center gap-1">
			<span class="w-3 h-3 rounded-full" style={`background:${categoryColor[cat]};`} />
			<span class="icon">{categoryMeta[cat].icon}</span>
			<span class="label">{categoryMeta[cat].label}</span>
		</div>
	{/each}
</div>
-->

<style>
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-top: 0.75rem;
		font-size: 0.85rem;
	}

	.legend-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.legend-group h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.legend-group.ghost h3 {
		color: #9ca3af;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.swatch {
		width: 14px;
		height: 14px;
		border-radius: 999px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}

	.icon {
		width: 1.2rem;
		text-align: center;
	}

	.label {
		white-space: nowrap;
	}
</style>
