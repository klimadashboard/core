<script>
	import Switch from '$lib/components/Switch.svelte';
	import { Chart, AxisX, AxisY, Tooltip, RuleY } from '$lib/components/charts/primitives';

	export let region = null;
	export let onChartData = undefined;

	const DATA_URL =
		'https://base.klimadashboard.org/assets/f5e3ead2-c97f-4981-a442-aa0445d119a9';

	const POSITIVE_COLOR = '#991B1B'; // dunkelrot
	const NEGATIVE_COLOR = '#166534'; // dunkelgrün

	const LULUCF_SECTORS = [
		{
			key: '4A',
			label: 'Wälder',
			icon: "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M16 5l3 3l-2 1l4 4l-3 1l4 4h-9' /><path d='M15 21l0 -3' /><path d='M8 13l-2 -2' /><path d='M8 12l2 -2' /><path d='M8 21v-13' /><path d='M5.824 16a3 3 0 0 1 -2.743 -3.69a3 3 0 0 1 .304 -4.833a3 3 0 0 1 4.615 -3.707a3 3 0 0 1 4.614 3.707a3 3 0 0 1 .305 4.833a3 3 0 0 1 -2.919 3.695h-4z' /></svg>"
		},
		{
			key: '4B',
			label: 'Ackerland',
			icon: "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M7 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' /><path d='M7 15l0 .01' /><path d='M19 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' /><path d='M10.5 17l6.5 0' /><path d='M20 15.2v-4.2a1 1 0 0 0 -1 -1h-6l-2 -5h-6v6.5' /><path d='M18 5h-1a1 1 0 0 0 -1 1v4' /></svg>"
		},
		{
			key: '4C',
			label: 'Grünland',
			icon: "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 10a6 6 0 0 0 -6 -6h-3v2a6 6 0 0 0 6 6h3' /><path d='M12 14a6 6 0 0 1 6 -6h3v1a6 6 0 0 1 -6 6h-3' /><path d='M12 20l0 -10' /></svg>"
		},
		{
			key: '4D',
			label: 'Feuchtgebiete',
			icon: "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4.072 20.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798z' /><path d='M16.072 20.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798z' /><path d='M10.072 10.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798z' /></svg>"
		},
		{
			key: '4E',
			label: 'Siedlungen',
			icon: "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 21h18' /><path d='M19 21v-4' /><path d='M19 17a2 2 0 0 0 2 -2v-2a2 2 0 1 0 -4 0v2a2 2 0 0 0 2 2z' /><path d='M14 21v-14a3 3 0 0 0 -3 -3h-4a3 3 0 0 0 -3 3v14' /><path d='M9 17v4' /><path d='M8 13h2' /><path d='M8 9h2' /></svg>"
		},
		{
			key: '4G',
			label: 'Holzprodukte',
			icon: "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 5.5m-6 0a6 2.5 0 1 0 12 0a6 2.5 0 1 0 -12 0' /><path d='M18 5.5v4.626a1.415 1.415 0 0 1 1.683 2.18l-.097 .108l-1.586 1.586v4c0 1.61 -2.54 2.925 -5.725 3l-.275 0c-3.314 0 -6 -1.343 -6 -3v-2l-1.586 -1.586a1.414 1.414 0 0 1 1.586 -2.287v-6.627' /><path d='M10 12.5v1.5' /><path d='M14 16v1' /></svg>"
		}
	];

	const views = [{ key: 'LULUCF', label: 'Gesamt' }, ...LULUCF_SECTORS];

	/** @type {Array<{sector:string,sector_name:string,year:number,value:number}>} */
	let records = [];
	let loading = true;
	let error = null;
	let activeView = 'LULUCF';

	$: chartData = [
		...records
			.filter((r) => r.sector === activeView && r.year <= 2025)
			.sort((a, b) => a.year - b.year)
			.map((r) => ({ label: r.year, value: r.value })),
		...(activeView === 'LULUCF'
			? [
					{ label: 2026, value: 0, isGap: true },
					{ label: 2027, value: 0, isGap: true },
					{ label: 2028, value: 0, isGap: true },
					{ label: 2029, value: 0, isGap: true },
					{ label: 2030, value: -25_000_000, isTarget: true }
				]
			: [])
	];

	$: value2019 = records.find((r) => r.sector === 'LULUCF' && r.year === 2019)?.value ?? null;

	$: allValues = chartData.map((d) => d.value);
	$: maxAbsValue = allValues.length ? Math.max(...allValues.map(Math.abs)) : 1_000_000;
	$: yDivisor = maxAbsValue >= 1_000_000 ? 1_000_000 : maxAbsValue >= 1_000 ? 1_000 : 1;
	$: yUnit = maxAbsValue >= 1_000_000 ? 'Mio. t' : maxAbsValue >= 1_000 ? 'Tsd. t' : 't';
	$: formatY = (v) =>
		(v / yDivisor).toLocaleString('de-DE', { maximumFractionDigits: 1 });

	$: yMax = allValues.length ? Math.max(0, ...allValues) : 1_000_000;
	$: yMin = allValues.length ? Math.min(0, ...allValues) : -1_000_000;
	$: yRange = yMax - yMin || 1;

	const SECTOR_AXIS_CONFIG = /** @type {Record<string,{fixedMin?:number,fixedMax?:number,tickValues?:number[],tickCount?:number}>} */ ({
		LULUCF: {
			fixedMin: -30_000_000,
			fixedMax: 75_000_000,
			tickValues: [-30, -15, 0, 15, 30, 45, 60, 75].map((v) => v * 1_000_000)
		},
		'4A': { fixedMin: -100_000_000, fixedMax: 20_000_000 },
		'4B': { fixedMax: 40_000_000 },
		'4C': { fixedMax: 30_000_000, tickCount: 7 },
		'4D': { fixedMax: 12_000_000 },
		'4E': { fixedMax: 6_000_000 },
		'4G': {
			fixedMin: -17_500_000,
			fixedMax: 2_500_000,
			tickValues: [-17.5, -15, -12.5, -10, -7.5, -5, -2.5, 0, 2.5].map((v) => v * 1_000_000)
		}
	});

	$: sectorAxis = SECTOR_AXIS_CONFIG[activeView] ?? {};
	$: chartYMax = sectorAxis.fixedMax !== undefined ? sectorAxis.fixedMax : yMax + yRange * 0.1;
	$: chartYMin =
		sectorAxis.fixedMin !== undefined ? sectorAxis.fixedMin : yMin < 0 ? yMin - yRange * 0.1 : 0;
	$: axisTickValues = sectorAxis.tickValues ?? null;
	$: axisTickCount = sectorAxis.tickCount ?? 5;

	$: activeLabel = views.find((v) => v.key === activeView)?.label ?? activeView;

	const ALL_SECTORS = [
		{ key: 'LULUCF', label: 'Gesamt (LULUCF)' },
		...LULUCF_SECTORS.map((s) => ({ key: s.key, label: s.label }))
	];

	$: if (chartData.length) {
		const fmt = (v) => (typeof v === 'number' ? String(Math.round(v)) : '–');
		const years = [...new Set(records.map((r) => r.year))].sort((a, b) => a - b);
		const byYearSector = new Map(records.map((r) => [`${r.year}-${r.sector}`, r.value]));

		onChartData?.({
			raw: records,
			table: {
				columns: [
					{ key: 'year', label: 'Jahr', align: 'left' },
					...ALL_SECTORS.map((s) => ({
						key: s.key,
						label: `${s.label} (Tonnen CO₂-Äquivalente)`,
						align: 'right',
						format: fmt
					}))
				],
				rows: years.map((y) =>
					Object.fromEntries([
						['year', y],
						...ALL_SECTORS.map((s) => [s.key, byYearSector.get(`${y}-${s.key}`) ?? null])
					])
				),
				filename: 'lulucf_emissionen_deutschland_1990_2025'
			},
			placeholders: { dataYear: String(chartData.at(-1)?.label ?? '') },
			meta: { source: 'Umweltbundesamt, Bundes-Klimaschutzgesetz', updateDate: '2026-03-14' },
			text: `<p><strong>Info-Text</strong></p><p>Die Grafik zeigt die jährlichen Netto-Treibhausgasemissionen des LULUCF-Sektors (Landnutzung, Landnutzungsänderung und Forstwirtschaft) in Deutschland seit 1990. Der Sektor bilanziert, wie viel Kohlenstoff Wälder, Böden und ihre Vegetation aus der Atmosphäre binden – und wie viel durch intensive Nutzung wieder freigesetzt wird. Wälder nehmen durch Photosynthese CO₂ auf und speichern es in Biomasse und Holzprodukten; bei Schäden, Rodung oder geringerem Zuwachs kehrt sich dieser Effekt um. Auf Ackerland werden durch Bodenbearbeitung und den Abbau organischer Substanz Treibhausgase freigesetzt – die Höhe der Emissionen schwankt je nach Witterung und Erntejahr stark. Grünland und Feuchtgebiete emittieren vor allem dann, wenn organische Böden durch Entwässerung belüftet werden, was in Moorgebieten besonders ins Gewicht fällt. Siedlungsflächen tragen durch Flächenversiegelung und die Umwandlung von Grünflächen zu Bauland bei.</p><p>Nach vorläufigen Zahlen lagen die Netto-Emissionen 2025 bei rund 27 Millionen Tonnen CO₂-Äquivalenten – ein Rückgang um 54 Prozent gegenüber dem Vorjahr (58 Mio. t) und deutlich unter dem Höchstwert von 73 Mio. t im Jahr 2023. Der starke Rückgang ist vor allem darauf zurückzuführen, dass Wälder 2025 wieder als Netto-Senke wirkten (−19 Mio. t), nachdem sie seit 2018 infolge von Dürre, Stürmen und Borkenkäferbefall weitgehend als Emissionsquelle bilanziert wurden. Auch Ackerland verzeichnete einen deutlichen Rückgang der Emissionen um 61 Prozent auf 7 Mio. t. Grünland (+10 Prozent auf 27 Mio. t) und Feuchtgebiete (+11 Prozent auf 10 Mio. t) emittierten dagegen nahezu unverändert – ein Zeichen dafür, dass die Wiedervernässung von Moorböden bisher kaum Wirkung zeigt.</p><p><strong>Feature</strong></p><p>Über die Auswahlleiste lassen sich die Emissionen der einzelnen Subsektoren anzeigen: Wälder, Ackerland, Grünland, Feuchtgebiete, Siedlungen und Holzprodukte.</p>`,
			methods: `<p><strong>Methodik</strong></p><p>Die Daten stammen vom Umweltbundesamt und werden jährlich aktualisiert (Datenstand: 14.03.2026). Dargestellt sind die Netto-Emissionen des LULUCF-Sektors in Millionen Tonnen CO₂-Äquivalenten – negative Werte bedeuten eine Netto-Aufnahme von Treibhausgasen (Senke), positive Werte eine Netto-Freisetzung (Quelle). Die Bilanzierung folgt den internationalen Berichterstattungsregeln unter der Klimarahmenkonvention der Vereinten Nationen (UNFCCC) und den Richtlinien des IPCC.</p>`
		});
	}

	async function fetchData() {
		try {
			const res = await fetch(DATA_URL);
			if (!res.ok) throw new Error('Fehler beim Laden der Daten');
			const text = await res.text();
			const lines = text.trim().split('\n').slice(1); // skip header row
			records = lines
				.map((line) => {
					const cols = line.split(';');
					return {
						sector: cols[8]?.trim() ?? '',
						sector_name: cols[9]?.trim() ?? '',
						year: parseInt(cols[14] ?? ''),
						value: parseFloat(cols[16] ?? '')
					};
				})
				.filter((r) => r.sector && !isNaN(r.year) && !isNaN(r.value));
			if (!records.length) throw new Error('Keine Daten verfügbar');

			} catch (err) {
			error = err.message;
			if (onChartData) onChartData(null);
		} finally {
			loading = false;
		}
	}

	fetchData();
</script>

{#if loading}
	<div class="h-[320px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[320px] flex items-center justify-center text-red-500">{error}</div>
{:else if !chartData.length}
	<div class="h-[320px] flex items-center justify-center text-gray-500">
		Keine Daten verfügbar
	</div>
{:else}
	<div class="flex flex-col gap-4">
		<Chart
			data={chartData}
			x="label"
			y="value"
			xType="band"
			height={320}
			margin={{ top: 10, right: 20, bottom: 40, left: 38 }}
			padding={0.15}
			yMin={chartYMin}
			yMax={chartYMax}
		>
			<svelte:fragment
				slot="default"
				let:data
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} tickValues={axisTickValues} tickCount={axisTickCount} />
				{@const tickYears = xDomain.filter((y) => y % 5 === 0)}
				<AxisX
					{xScale}
					xDomain={tickYears}
					{innerWidth}
					{innerHeight}
					format={String}
					forceTicks={tickYears}
				/>

				<!-- Zero line -->
				<RuleY y={0} {yScale} {innerWidth} strokeWidth={1.5} />

				<!-- Bars -->
				<g class="mark-bars">
					{#each data as d}
						{#if !d.isGap}
							{@const barX = xScale(d.label) ?? 0}
							{@const bw = xScale.bandwidth?.() ?? 20}
							{@const color = d.value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
							{@const barTop = Math.min(yScale(d.value), yScale(0))}
							{@const barH = Math.abs(yScale(0) - yScale(d.value))}
							{@const isHovered = hover.x === d.label}
							{@const dimmed = hover.x !== null && !isHovered}
							<rect
								x={barX}
								y={barTop}
								width={bw}
								height={Math.max(0, barH)}
								fill={d.isTarget ? NEGATIVE_COLOR : color}
fill-opacity={d.isTarget ? 0.3 : 1}
								stroke={d.isTarget ? NEGATIVE_COLOR : 'none'}
								stroke-width={d.isTarget ? 1.5 : 0}
								stroke-dasharray={d.isTarget ? '4,3' : undefined}
								opacity={dimmed ? 0.4 : 1}
								rx={2}
								ry={2}
								class="transition-opacity duration-100"
							>
								<title>{d.isTarget ? 'Ziel 2030' : d.label}: {formatY(d.value)} {yUnit}</title>
							</rect>
						{/if}
					{/each}
				</g>

				<!-- Dashed target line from 2019 value to 2030 target -->
				{#if activeView === 'LULUCF' && value2019 !== null}
					{@const bw = xScale.bandwidth?.() ?? 0}
					{@const x1 = (xScale(2019) ?? 0) + bw / 2}
					{@const y1 = yScale(value2019)}
					{@const x2 = (xScale(2030) ?? 0) + bw / 2}
					{@const y2 = yScale(-25_000_000)}
					<line
						{x1} {y1} {x2} {y2}
						stroke="#9CA3AF"
						stroke-width="1.5"
						stroke-dasharray="5,4"
					/>
				{/if}

				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={formatY} unit={yUnit} tickValues={axisTickValues} tickCount={axisTickCount} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover let:data>
				{@const bar = data.find((d) => d.label === hover.x)}
				<Tooltip
					visible={hover.x !== null && !bar?.isGap}
					x={hover.clientX}
					y={hover.clientY}
					title={bar?.isTarget ? 'Ziel 2030' : String(hover.x ?? '')}
					items={bar
						? [
								{
									label: bar.isTarget ? 'Bundes-Klimaschutzgesetz' : activeLabel,
									value: formatY(bar.value) + ' ' + yUnit,
									color: bar.isTarget ? '#D1D5DB' : bar.value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR
								}
							]
						: []}
				/>
			</svelte:fragment>
		</Chart>

		<Switch
			{views}
			{activeView}
			on:itemClick={(e) => {
				activeView = e.detail;
			}}
		/>
	</div>
{/if}
