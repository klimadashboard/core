<script>
	import { Plot, AreaY, Line, Text, Dot, stackY } from 'svelteplot';

	let data = [
		{ year: 2020, pv: 20, wind: 20, total: 40 },
		{ year: 2021, pv: 30, wind: 30, total: 60 },
		{ year: 2022, pv: 30, wind: 35, total: 65 },
		{ year: 2023, pv: 32, wind: 37, total: 69 }, // fixed to pv+wind for consistency
		{ year: 2024, pv: 40, wind: 50, total: 90 },
		{ year: 2035, goal: 200 }
	];

	// Actual years with data (no goal row)
	const actualData = data.filter((d) => d.total != null);

	// Goal row
	const goalRow = data.find((d) => d.goal != null);

	const lastActual = actualData[actualData.length - 1];
	const lastYear = lastActual.year;
	const lastTotal = lastActual.total;
	const goalYear = goalRow.year;
	const goalValue = goalRow.goal;

	// Long-form for stacked area
	const stackedData = actualData.flatMap((d) => [
		{ year: d.year, source: 'pv', value: d.pv },
		{ year: d.year, source: 'wind', value: d.wind }
	]);

	// Data for the solid total line (actuals only)
	const totalLineData = actualData.map((d) => ({
		year: d.year,
		value: d.total
	}));

	// Data for the projected segment from last actual to goal
	const projectedSegment = [
		{ year: lastYear, value: lastTotal },
		{ year: goalYear, value: goalValue }
	];

	// Same points, but as an area (gray fill under the projected line)
	const projectedArea = [
		{ year: lastYear, total: lastTotal },
		{ year: goalYear, total: goalValue }
	];

	const goalPoint = { year: goalYear, value: goalValue, label: `Goal ${goalYear}: ${goalValue}` };
</script>

<Plot
	height={400}
	margin={{ top: 30, right: 60, bottom: 40, left: 60 }}
	x={{ label: 'Year' }}
	y={{ label: 'Capacity (GW)', domain: [0, 220] }}
>
	<!-- Stacked area for PV + Wind -->
	<AreaY
		{...stackY({
			data: stackedData,
			x: 'year',
			y: 'value',
			z: 'source'
		})}
		fill={(d) => (d.source === 'pv' ? '#EAB308' : '#38BDF8')}
		fillOpacity={0.85}
	/>

	<!-- Solid total line (actuals) -->
	<Line data={totalLineData} x="year" y="value" stroke="#111827" strokeWidth={2.5} />

	<!-- Gray area under projected total from last actual to goal -->
	<AreaY data={projectedArea} x="year" y="total" fill="#D1D5DB" fillOpacity={0.6} />

	<!-- Dotted projected total line from last actual to goal -->
	<Line
		data={projectedSegment}
		x="year"
		y="value"
		stroke="#111827"
		strokeWidth={2}
		strokeDasharray="4 4"
	/>

	<!-- Goal point (circle) -->
	<Dot
		data={[goalPoint]}
		x="year"
		y="value"
		r={5}
		fill="#111827"
		stroke="#FFFFFF"
		strokeWidth={1.5}
	/>

	<!-- Goal annotation text -->
	<Text
		data={[goalPoint]}
		x="year"
		y="value"
		text="label"
		dx={8}
		dy={-6}
		textAnchor="start"
		fontSize={11}
		fill="#111827"
	/>
</Plot>
