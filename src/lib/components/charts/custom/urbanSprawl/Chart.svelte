<script>
	import { Chart, AxisX, AxisY, BarStack, Tooltip, Legend } from '$lib/components/charts/primitives';

	export let data;

	const CATEGORIES = [
		{ key: 'pop1', label: 'Geringe Zersiedelung', color: '#7fcdbb' },
		{ key: 'pop2', label: 'Mittlere Zersiedelung', color: '#1d91c0' },
		{ key: 'pop3', label: 'Starke Zersiedelung', color: '#253494' }
	];

	$: stackedData = (() => {
		if (!data?.length) return [];
		const years = Array.from(new Set(data.map((d) => d.period))).sort();
		return years.map((year) => {
			const yearData = data.filter((d) => d.period === year);
			const getValue = (cat) => parseFloat(yearData.find((d) => d.category === cat)?.value ?? 0);

			let y0 = 0;
			const segments = CATEGORIES.map((c) => {
				const value = getValue(c.key);
				const seg = { key: c.key, value, y0, y1: y0 + value, color: c.color, label: c.label };
				y0 += value;
				return seg;
			});
			return { x: String(year), segments, total: y0 };
		});
	})();

	$: yMax = stackedData.length > 0 ? Math.max(...stackedData.map((d) => d.total)) * 1.15 : 100;
</script>

<div class="mt-4 flex flex-col gap-4">
	<Legend items={CATEGORIES} />

	{#if stackedData.length > 0}
		<Chart
			data={stackedData}
			x="x"
			y="total"
			xType="band"
			height={320}
			yMin={0}
			{yMax}
			margin={{ top: 10, right: 20, bottom: 35, left: 55 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={(v) => String(v)} />
				<BarStack data={stackedData} x="x" {xScale} {yScale} {hover} />
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = stackedData.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={String(hover.x)}
							items={pt.segments.map((s) => ({
								label: s.label,
								value: s.value.toLocaleString('de-DE', { maximumFractionDigits: 0 }),
								color: s.color
							}))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>
	{/if}
</div>
