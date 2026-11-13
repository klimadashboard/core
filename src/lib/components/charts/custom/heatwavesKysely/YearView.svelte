<!-- $lib/components/charts/custom/heatwavesKysely/YearView.svelte -->
<!-- One year in detail: daily Tmax, 1991–2020 mean, 30/25 °C lines, heatwaves filled red -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { formatDate, formatNumber } from '$lib/utils/formatters';
	import type { HeatwaveYear } from './kysely';

	export let years: HeatwaveYear[] = [];
	export let year: number;
	/** Last date with data, to mark a running year */
	export let lastDate: string | null = null;
	/** Colors for the heat gradient, light (30 °C) → dark (45 °C) */
	export let stops: string[] = [];

	const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	const CLIM_FROM = 1991;
	const CLIM_TO = 2020;
	const CLIM_COLOR = '#378ADD';
	const HOT_NO_WAVE = '#B4B2A9';
	const gradientId = `kysely-heat-${Math.random().toString(36).slice(2, 8)}`;

	// ---------- climatology (mean Tmax 1991–2020 per calendar day) ----------
	// index on a 366-day calendar so 29 February does not shift the rest of the year
	const toCal = (doy: number, n: number) => (n === 365 && doy >= 59 ? doy + 1 : doy);

	$: climatology = (() => {
		const ref = years.filter((y) => y.year >= CLIM_FROM && y.year <= CLIM_TO && y.daysWithData > 300);
		if (ref.length < 20) return null;
		const sum = new Array(366).fill(0);
		const cnt = new Array(366).fill(0);
		for (const y of ref) {
			y.tmax.forEach((t, d) => {
				if (t === null) return;
				const c = toCal(d, y.daysInYear);
				sum[c] += t;
				cnt[c]++;
			});
		}
		const raw = sum.map((s, i) => (cnt[i] ? s / cnt[i] : null));
		// circular moving average over ±15 days
		return raw.map((_, i) => {
			let s = 0;
			let n = 0;
			for (let k = -15; k <= 15; k++) {
				const v = raw[(i + k + 366) % 366];
				if (v !== null) {
					s += v;
					n++;
				}
			}
			return n ? s / n : null;
		});
	})();

	// ---------- selected year ----------
	$: y = years.find((d) => d.year === year) ?? null;
	$: n = y?.daysInYear ?? 365;
	$: clim = y && climatology ? Array.from({ length: n }, (_, d) => climatology[toCal(d, n)]) : null;
	$: running = !!(y && lastDate && lastDate < `${y.year}-12-31`);
	$: longest = y?.waves.length ? Math.max(...y.waves.map((w) => w.length)) : 0;
	$: headline = !y
		? ''
		: y.waves.length
			? `${y.year}${running ? ' (bisher)' : ''}: ${y.waves.length} ${y.waves.length === 1 ? 'Hitzewelle' : 'Hitzewellen'} mit ${y.kyselyDays} Kysely-Tagen, die längste dauerte ${longest} Tage`
			: `${y.year}${running ? ' (bisher)' : ''}: keine Hitzewelle`;

	// ---------- layout ----------
	let containerEl: HTMLElement;
	let width = 0;
	onMount(() => {
		const ro = new ResizeObserver((entries) => {
			for (const e of entries) if (e.contentRect.width > 0) width = e.contentRect.width;
		});
		ro.observe(containerEl);
		width = containerEl.clientWidth;
		return () => ro.disconnect();
	});

	const height = 320;
	$: margin = { top: 12, right: width < 500 ? 34 : 44, bottom: 24, left: width < 500 ? 30 : 36 };
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = height - margin.top - margin.bottom;

	$: values = y ? (y.tmax.filter((t) => t !== null) as number[]) : [];
	$: yLo = Math.min(0, Math.floor((Math.min(...values, 0) - 2) / 10) * 10);
	$: yHi = Math.max(40, Math.ceil((Math.max(...values, 30) + 2) / 5) * 5);
	$: yTicks = Array.from({ length: Math.floor((yHi - yLo) / 10) + 1 }, (_, i) => yLo + i * 10);

	$: dayW = innerWidth / n;
	$: x = (d: number) => margin.left + (d + 0.5) * dayW;
	$: sy = (v: number) => margin.top + innerHeight - ((v - yLo) / (yHi - yLo)) * innerHeight;

	// line path that breaks at missing values
	function linePath(arr: (number | null)[], xf: (d: number) => number, yf: (v: number) => number) {
		let d = '';
		let pen = false;
		arr.forEach((v, i) => {
			if (v === null || v === undefined) {
				pen = false;
				return;
			}
			d += `${pen ? 'L' : 'M'}${xf(i).toFixed(1)},${yf(v).toFixed(1)}`;
			pen = true;
		});
		return d;
	}

	// index ranges of the waves within this year
	$: waveRanges = (() => {
		if (!y) return [] as Array<[number, number]>;
		const out: Array<[number, number]> = [];
		let start = -1;
		y.waveIndex.forEach((wi, d) => {
			const prev = d > 0 ? y.waveIndex[d - 1] : -1;
			if (wi >= 0 && wi !== prev) start = d;
			const next = d < n - 1 ? y.waveIndex[d + 1] : -1;
			if (wi >= 0 && wi !== next) out.push([start, d]);
		});
		return out;
	})();

	function wavePath([a, b]: [number, number]) {
		if (!y) return '';
		let d = `M${(x(a) - dayW / 2).toFixed(1)},${sy(30).toFixed(1)}`;
		for (let i = a; i <= b; i++) d += `L${x(i).toFixed(1)},${sy(Math.max(30, y.tmax[i] ?? 30)).toFixed(1)}`;
		d += `L${(x(b) + dayW / 2).toFixed(1)},${sy(30).toFixed(1)}Z`;
		return d;
	}

	// ---------- hover ----------
	let hoverDay: number | null = null;
	let clientX = 0;
	let clientY = 0;
	function onMove(e: MouseEvent) {
		const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const d = Math.floor((e.clientX - rect.left - margin.left) / dayW);
		hoverDay = d >= 0 && d < n ? d : null;
		clientX = e.clientX;
		clientY = e.clientY;
	}
	const dateOf = (yr: number, doy: number) =>
		new Date(Date.UTC(yr, 0, 1 + doy)).toISOString().slice(0, 10);

	$: tooltip = (() => {
		if (hoverDay === null || !y) return null;
		const t = y.tmax[hoverDay];
		const wi = y.waveIndex[hoverDay];
		const w = wi >= 0 ? y.waves[wi] : null;
		const items: { label: string; value: string; color?: string }[] = [
			{ label: 'Tmax', value: t === null ? 'keine Daten' : `${formatNumber(t, 1)} °C` }
		];
		if (clim?.[hoverDay] != null)
			items.push({
				label: `Mittel ${CLIM_FROM}–${CLIM_TO}`,
				value: `${formatNumber(clim[hoverDay] as number, 1)} °C`,
				color: CLIM_COLOR
			});
		if (w) {
			items.push({
				label: 'Hitzewelle',
				value: `${formatDate(w.start)} – ${formatDate(w.end)} (${w.length} Tage)`,
				color: stops[2]
			});
		} else if (t !== null && t >= 30) {
			items.push({ label: 'Hitzetag', value: 'ohne Hitzewelle', color: HOT_NO_WAVE });
		}
		return { title: formatDate(dateOf(y.year, hoverDay), 'long'), items };
	})();
</script>

<div>
	<p class="text-lg font-semibold mb-1 text-balance">{headline}</p>
	<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Tageshöchsttemperatur in °C</p>

	<div bind:this={containerEl} class="relative w-full select-none">
		{#if y && width > 0}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<svg
				{width}
				{height}
				role="img"
				aria-label={headline}
				class="block bg-white dark:bg-gray-900"
				on:mousemove={onMove}
				on:mouseleave={() => (hoverDay = null)}
			>
				<defs>
					<linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={sy(30)} y2={sy(45)}>
						{#each stops as c, i}
							<stop offset="{(i / (stops.length - 1)) * 100}%" stop-color={c} />
						{/each}
					</linearGradient>
				</defs>

				<!-- heatwave duration bands -->
				{#each waveRanges as [a, b]}
					<rect
						x={x(a) - dayW / 2}
						y={margin.top}
						width={(b - a + 1) * dayW}
						height={innerHeight}
						class="fill-red-500/10 dark:fill-red-500/20"
					/>
				{/each}

				<!-- grid -->
				{#each yTicks as v}
					<line
						x1={margin.left}
						x2={width - margin.right}
						y1={sy(v)}
						y2={sy(v)}
						class={v === 0 ? 'stroke-gray-300 dark:stroke-gray-600' : 'stroke-gray-100 dark:stroke-gray-800'}
					/>
					<text
						x={margin.left - 6}
						y={sy(v) + 4}
						text-anchor="end"
						class="fill-gray-500 dark:fill-gray-400 text-[11px]">{v}°</text
					>
				{/each}
				{#each MONTH_START as m, i}
					<text
						x={margin.left + ((m + 15) / 365) * innerWidth}
						y={height - 6}
						text-anchor="middle"
						class="fill-gray-500 dark:fill-gray-400 text-[11px]"
						>{width < 500 && i % 2 ? '' : MONTHS[i]}</text
					>
				{/each}

				<!-- hot days outside heatwaves -->
				{#each y.tmax as t, d}
					{#if t !== null && t >= 30 && y.waveIndex[d] < 0}
						<rect x={x(d) - dayW / 2} y={sy(t)} width={dayW + 0.3} height={sy(30) - sy(t)} fill={HOT_NO_WAVE} />
					{/if}
				{/each}

				<!-- heatwave area above 30 °C -->
				{#each waveRanges as range}
					<path d={wavePath(range)} fill="url(#{gradientId})" />
				{/each}

				<!-- 30 / 25 °C -->
				<line x1={margin.left} x2={width - margin.right} y1={sy(30)} y2={sy(30)} stroke="#E24B4A" stroke-width="1.2" />
				<text x={width - margin.right + 4} y={sy(30) + 4} class="text-[11px]" fill="#E24B4A">30 °C</text>
				<line
					x1={margin.left}
					x2={width - margin.right}
					y1={sy(25)}
					y2={sy(25)}
					stroke-dasharray="2 3"
					class="stroke-gray-400 dark:stroke-gray-500"
				/>
				<text x={width - margin.right + 4} y={sy(25) + 4} class="fill-gray-500 dark:fill-gray-400 text-[11px]"
					>25 °C</text
				>

				<!-- climatology + Tmax -->
				{#if clim}
					<path d={linePath(clim, x, sy)} fill="none" stroke={CLIM_COLOR} stroke-width="1.8" stroke-dasharray="5 3" />
				{/if}
				<path
					d={linePath(y.tmax, x, sy)}
					fill="none"
					stroke-width="1.2"
					stroke-linejoin="round"
					class="stroke-gray-900 dark:stroke-gray-100"
				/>

				<!-- labels for longer heatwaves -->
				{#each waveRanges as [a, b]}
					{#if b - a + 1 >= 7}
						{@const seg = y.tmax.slice(a, b + 1).map((v) => v ?? -Infinity)}
						{@const peak = a + seg.indexOf(Math.max(...seg))}
						<text
							x={x(peak)}
							y={sy(y.tmax[peak] ?? 30) - 6}
							text-anchor="middle"
							class="fill-gray-900 dark:fill-gray-100 text-[11px] font-semibold">{b - a + 1} Tage</text
						>
					{/if}
				{/each}

				<!-- hover -->
				{#if hoverDay !== null}
					<line
						x1={x(hoverDay)}
						x2={x(hoverDay)}
						y1={margin.top}
						y2={margin.top + innerHeight}
						class="stroke-gray-400 dark:stroke-gray-500"
						stroke-width="0.8"
					/>
					{#if y.tmax[hoverDay] !== null}
						<circle
							cx={x(hoverDay)}
							cy={sy(y.tmax[hoverDay] ?? 0)}
							r="4"
							stroke-width="2"
							class="fill-gray-900 dark:fill-gray-100 stroke-white dark:stroke-gray-900"
						/>
					{/if}
				{/if}
			</svg>

			{#if tooltip}
				<Tooltip visible={true} x={clientX} y={clientY} title={tooltip.title} items={tooltip.items} />
			{/if}
		{:else}
			<div class="h-[320px]"></div>
		{/if}
	</div>

	<!-- legend -->
	<div class="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-gray-700 dark:text-gray-300">
		<span class="flex items-center gap-1.5"
			><span class="w-4 border-t-2 border-gray-900 dark:border-gray-100"></span>Tmax</span
		>
		{#if clim}
			<span class="flex items-center gap-1.5"
				><span class="w-4 border-t-2 border-dashed" style="border-color: {CLIM_COLOR}"></span>Mittel {CLIM_FROM}–{CLIM_TO}</span
			>
		{/if}
		<span class="flex items-center gap-1.5"
			><span class="w-3.5 h-2.5" style="background: linear-gradient(to top, {stops.join(', ')})"></span>Hitzewelle
			(Fläche über 30 °C)</span
		>
		<span class="flex items-center gap-1.5"
			><span class="w-3.5 h-2.5 bg-red-500/10 dark:bg-red-500/20"></span>Dauer der Hitzewelle</span
		>
		<span class="flex items-center gap-1.5"
			><span class="w-3.5 h-2.5" style="background: {HOT_NO_WAVE}"></span>Hitzetag ohne Hitzewelle</span
		>
	</div>
</div>
