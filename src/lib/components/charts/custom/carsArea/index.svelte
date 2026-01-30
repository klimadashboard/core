<!-- $lib/components/charts/custom/carsArea/index.svelte -->
<script lang="ts">
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/state';
	import { t } from '$lib/utils/t';
	import {
		fetchData,
		buildChartData,
		getColor,
		PITCH_AREA_SQM,
		PITCH_W,
		PITCH_H,
		SQM_PER_CAR,
		type CarDensityData
	} from './config';
	import { getLatestData } from '$lib/components/charts/custom/carsDensity/config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let loading = true;
	let error: string | null = null;
	let data: CarDensityData | null = null;

	// Theme-aware colors
	$: isDark = $theme === 'dark';
	$: carsColor = getColor('cars', isDark);

	// Load data when region changes
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			data = await fetchData(fetch, region);

			if (onChartData && data) {
				const privacyNote = t(page.data.translations, 'ui.card.privacyNote');
				onChartData(buildChartData(data, region, privacyNote));
			}
		} catch (e) {
			console.error('[CarsArea] Error loading data:', e);
			error = e instanceof Error ? e.message : t(page.data.translations, 'status.error');
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Derived data
	$: latestData = data ? getLatestData(data.region, data.periods) : null;

	// Area calculations
	$: totalCars = latestData?.cars ?? 0;
	$: parkingAreaSqm = totalCars * SQM_PER_CAR;
	$: footballPitches = parkingAreaSqm / PITCH_AREA_SQM;

	// SVG dimensions: bind width from container, fixed 200px height
	const svgH = 200;
	const pad = 8;
	let containerWidth = 600;
</script>

{#if loading || regionLoading}
	<div class="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-48 flex items-center justify-center text-red-500">{error}</div>
{:else if !data || !latestData?.cars}
	<p class="text-lg leading-snug">
		{t(page.data.translations, 'domain.transport.selectRegionArea')}
	</p>
{:else}
	<div class="flex flex-col gap-2" bind:clientWidth={containerWidth}>
		{#if footballPitches >= 1}
			{@const svgW = containerWidth}
			{@const areaW = svgW - pad * 2}
			{@const areaH = svgH - pad * 2}
			{@const fieldScale = 1 / Math.sqrt(footballPitches)}
			{@const fieldW = Math.max(areaW * fieldScale, 3)}
			{@const fieldH = Math.max(fieldW * (PITCH_H / PITCH_W), 2)}
			{@const fieldX = pad + areaW - fieldW}
			{@const fieldY = pad + areaH - fieldH}
			{@const arrowTipX = fieldX - 2}
			{@const arrowTipY = fieldY + fieldH / 2}
			{@const arrowStartX = Math.min(arrowTipX - 40, svgW * 0.6)}
			{@const arrowStartY = Math.min(arrowTipY - 30, svgH * 0.3)}

			<svg
				viewBox="0 0 {svgW} {svgH}"
				width={svgW}
				height={svgH}
				class="w-full"
			>
				<!-- Total parking area -->
				<rect
					x={pad}
					y={pad}
					width={areaW}
					height={areaH}
					fill={carsColor}
					opacity="0.15"
					rx="3"
				/>
				<rect
					x={pad}
					y={pad}
					width={areaW}
					height={areaH}
					fill="none"
					stroke={carsColor}
					stroke-width="1.5"
					rx="3"
				/>

				<!-- Label top-left corner inside the area -->
				<text
					x={pad + 8}
					y={pad + 20}
					text-anchor="start"
					fill={carsColor}
					font-size="14"
					font-weight="600"
				>
					{formatNumber(totalCars)} {t(page.data.translations, 'domain.transport.cars')} = {formatNumber(parkingAreaSqm)} m²
				</text>
				<text
					x={pad + 8}
					y={pad + 36}
					text-anchor="start"
					fill={carsColor}
					font-size="12"
					opacity="0.7"
				>
					= {formatNumber(Math.round(footballPitches))} {t(page.data.translations, 'domain.transport.footballPitches')}
				</text>

				<!-- Single football pitch reference -->
				<g opacity="0.6">
					<!-- Pitch outline -->
					<rect
						x={fieldX}
						y={fieldY}
						width={fieldW}
						height={fieldH}
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
					<!-- Center line -->
					<line
						x1={fieldX + fieldW / 2}
						y1={fieldY}
						x2={fieldX + fieldW / 2}
						y2={fieldY + fieldH}
						stroke="currentColor"
						stroke-width="0.5"
					/>
					<!-- Center circle (r = 9.15m scaled to pitch) -->
					<circle
						cx={fieldX + fieldW / 2}
						cy={fieldY + fieldH / 2}
						r={fieldW * (9.15 / PITCH_W)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.5"
					/>
					<!-- Left penalty area (16.5m deep x 40.3m wide) -->
					<rect
						x={fieldX}
						y={fieldY + fieldH / 2 - fieldH * (40.3 / PITCH_H / 2)}
						width={fieldW * (16.5 / PITCH_W)}
						height={fieldH * (40.3 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.5"
					/>
					<!-- Right penalty area -->
					<rect
						x={fieldX + fieldW - fieldW * (16.5 / PITCH_W)}
						y={fieldY + fieldH / 2 - fieldH * (40.3 / PITCH_H / 2)}
						width={fieldW * (16.5 / PITCH_W)}
						height={fieldH * (40.3 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.5"
					/>
					<!-- Left goal area (5.5m deep x 18.32m wide) -->
					<rect
						x={fieldX}
						y={fieldY + fieldH / 2 - fieldH * (18.32 / PITCH_H / 2)}
						width={fieldW * (5.5 / PITCH_W)}
						height={fieldH * (18.32 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.5"
					/>
					<!-- Right goal area -->
					<rect
						x={fieldX + fieldW - fieldW * (5.5 / PITCH_W)}
						y={fieldY + fieldH / 2 - fieldH * (18.32 / PITCH_H / 2)}
						width={fieldW * (5.5 / PITCH_W)}
						height={fieldH * (18.32 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.5"
					/>
				</g>

				<!-- Arrow pointing to pitch -->
				<line
					x1={arrowStartX}
					y1={arrowStartY}
					x2={arrowTipX}
					y2={arrowTipY}
					stroke="currentColor"
					stroke-width="1"
					opacity="0.5"
				/>
				<polygon
					points="{arrowTipX},{arrowTipY} {arrowTipX - 5},{arrowTipY - 3} {arrowTipX - 5},{arrowTipY + 3}"
					fill="currentColor"
					opacity="0.5"
				/>
				<text
					x={arrowStartX - 4}
					y={arrowStartY - 5}
					text-anchor="end"
					fill="currentColor"
					font-size="13"
					opacity="0.6"
				>
					1 {t(page.data.translations, 'domain.transport.pitch')}
				</text>
			</svg>
		{:else}
			<!-- Less than 1 football pitch: show pitch outline with small colored area -->
			{@const svgW = containerWidth}
			{@const pitchRatio = PITCH_H / PITCH_W}
			{@const pitchW = svgW - pad * 2}
			{@const pitchH = Math.min(pitchW * pitchRatio, svgH - pad * 2)}
			{@const smallScale = Math.sqrt(Math.max(footballPitches, 0.01))}
			{@const smallW = Math.max(pitchW * smallScale, 4)}
			{@const smallH = Math.max(smallW * pitchRatio, 3)}

			<svg
				viewBox="0 0 {svgW} {svgH}"
				width={svgW}
				height={svgH}
				class="w-full"
			>
				<!-- Pitch with markings -->
				<g opacity="0.3">
					<!-- Pitch outline -->
					<rect
						x={pad}
						y={pad}
						width={pitchW}
						height={pitchH}
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-dasharray="6,4"
						rx="3"
					/>
					<!-- Center line -->
					<line
						x1={pad + pitchW / 2}
						y1={pad}
						x2={pad + pitchW / 2}
						y2={pad + pitchH}
						stroke="currentColor"
						stroke-width="0.75"
					/>
					<!-- Center circle -->
					<circle
						cx={pad + pitchW / 2}
						cy={pad + pitchH / 2}
						r={pitchW * (9.15 / PITCH_W)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.75"
					/>
					<!-- Left penalty area -->
					<rect
						x={pad}
						y={pad + pitchH / 2 - pitchH * (40.3 / PITCH_H / 2)}
						width={pitchW * (16.5 / PITCH_W)}
						height={pitchH * (40.3 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.75"
					/>
					<!-- Right penalty area -->
					<rect
						x={pad + pitchW - pitchW * (16.5 / PITCH_W)}
						y={pad + pitchH / 2 - pitchH * (40.3 / PITCH_H / 2)}
						width={pitchW * (16.5 / PITCH_W)}
						height={pitchH * (40.3 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.75"
					/>
					<!-- Left goal area -->
					<rect
						x={pad}
						y={pad + pitchH / 2 - pitchH * (18.32 / PITCH_H / 2)}
						width={pitchW * (5.5 / PITCH_W)}
						height={pitchH * (18.32 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.75"
					/>
					<!-- Right goal area -->
					<rect
						x={pad + pitchW - pitchW * (5.5 / PITCH_W)}
						y={pad + pitchH / 2 - pitchH * (18.32 / PITCH_H / 2)}
						width={pitchW * (5.5 / PITCH_W)}
						height={pitchH * (18.32 / PITCH_H)}
						fill="none"
						stroke="currentColor"
						stroke-width="0.75"
					/>
				</g>
				<text
					x={pad + pitchW / 2}
					y={pad + pitchH / 2 + 5}
					text-anchor="middle"
					fill="currentColor"
					font-size="14"
					opacity="0.4"
				>
					1 {t(page.data.translations, 'domain.transport.footballPitch')}
				</text>

				<!-- Small colored parking area -->
				<rect
					x={pad + pitchW - smallW}
					y={pad + pitchH - smallH}
					width={smallW}
					height={smallH}
					fill={carsColor}
					opacity="0.3"
					rx="1"
				/>
				<rect
					x={pad + pitchW - smallW}
					y={pad + pitchH - smallH}
					width={smallW}
					height={smallH}
					fill="none"
					stroke={carsColor}
					stroke-width="1.5"
					rx="1"
				/>
			</svg>
		{/if}

		<p class="text-xs opacity-60">
			{formatNumber(totalCars)} {t(page.data.translations, 'domain.transport.cars')} &times; {SQM_PER_CAR} m&sup2; = {formatNumber(parkingAreaSqm)} m&sup2;
		</p>
	</div>
{/if}
