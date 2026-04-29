<script lang="ts">
	import { Chart, AxisX, AxisY, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import { transformDataSingleCompany, transformDataMultipleCompanies } from './transformData';
	import type { CompanyEmissionArray, CompanyMetaData } from './types';

	export let emissions: CompanyEmissionArray;
	export let selectedCompanies: CompanyMetaData[];
	export let selectedScopes: number[];
	export let selectedScope2Category: string = 'location_based';

	const RAW_COLORS = ['#7CBAB3', '#575C75', '#71665B', '#B28834', '#8CAED9', '#E0A906', '#CF6317'];
	const SCOPE_COLORS: Record<number, string> = { 1: '#4e79a7', 2: '#f28e2c', 3: '#e15759' };
	const SCOPE_LABELS: Record<number, string> = {
		1: 'Scope 1',
		2: 'Scope 2',
		3: 'Scope 3'
	};
	const MAX_COMPANIES = 7;

	let dataset: Array<Record<string, any>> = [];
	let keys: string[] = [];
	let labels: string[];
	let colors: string[];

	$: isSingleCompany = selectedCompanies.length === 1;
	$: isScopeThreeSelected = selectedScopes.includes(3);
	$: companyNames = selectedCompanies.map((c) => c.name);

	$: {
		if (emissions && selectedCompanies?.length && selectedScopes?.length) {
			if (isSingleCompany) {
				dataset = transformDataSingleCompany(
					emissions,
					selectedCompanies[0].name,
					selectedScopes,
					selectedScope2Category
				);
				keys = selectedScopes.map(String);
				labels = selectedScopes.map((s) => SCOPE_LABELS[s]);
				colors = selectedScopes.map((s) => SCOPE_COLORS[s]);
			} else {
				dataset = transformDataMultipleCompanies(
					emissions,
					companyNames,
					selectedScopes,
					selectedScope2Category
				);
				keys = companyNames;
				labels = companyNames;
				colors = RAW_COLORS.slice(0, companyNames.length);
			}
		}
	}

	$: legendItems = keys.map((k, i) => ({ key: k, label: labels[i], color: colors[i] }));
	$: invalidXValue = isScopeThreeSelected ? 6 : 0;
	$: invalidXPixelRatio = invalidXValue && dataset.length ? invalidXValue / dataset.length : 0;
</script>

{#if selectedCompanies.length === 0}
	<div class="h-20"></div>
	<p class="text-center">Keine Unternehmen ausgewählt.</p>
	<p class="text-center">⬆ Wähle oben bis zu sieben Unternehmen aus! ⬆</p>
	<div class="h-20"></div>
{:else if selectedCompanies.length > MAX_COMPANIES}
	<div class="h-20"></div>
	<p class="text-center">Zu viele Unternehmen ausgewählt. Wähle maximal 7 Unternehmen.</p>
	<div class="h-20"></div>
{:else if dataset.length > 0}
	<div class="flex flex-col gap-2">
		<Legend items={legendItems} />
		<Chart
			data={dataset}
			x="x"
			y={keys}
			height={288}
			yMin={0}
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
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={(v) => dataset[Math.round(v)]?.label ?? ''}
					tickCount={dataset.length}
				/>

				{#each keys as key, i}
					<Line
						data={dataset}
						x="x"
						y={key}
						{xScale}
						{yScale}
						stroke={colors[i]}
						strokeWidth={2}
						dots={true}
						dotRadius={3}
						{hover}
					/>
				{/each}

				{#if invalidXValue && xScale}
					{@const cutX = xScale(invalidXValue)}
					<defs>
						<linearGradient id="invalidFade" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stop-color="rgb(229,231,235)" stop-opacity="0" />
							<stop offset="100%" stop-color="rgb(229,231,235)" stop-opacity="0.6" />
						</linearGradient>
					</defs>
					<rect y={-5} width={cutX} height={innerHeight + 5} fill="url(#invalidFade)" />
					<line
						x1={cutX}
						x2={cutX}
						y1={0}
						y2={innerHeight}
						stroke="#000"
						stroke-dasharray="2 8"
					/>
					<text
						class="text-sm fill-gray-600"
						text-anchor="end"
						x={cutX - 10}
						y={innerHeight - 10}
					>
						Daten weniger genau*
					</text>
				{/if}

				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit="t" />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = dataset.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={pt.label}
							items={keys
								.filter((k) => typeof pt[k] === 'number')
								.map((k, i) => ({
									label: labels[i],
									value: formatNumber(pt[k], 0) + ' t',
									color: colors[i]
								}))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>

		{#if isScopeThreeSelected}
			<p class="text-sm opacity-80">
				* Vor 2022 führt die Datenungenauigkeit aufgrund unterschiedlicher erfasster Dimensionen der
				Scope 3 Emissionen zu fehlender Vergleichbarkeit.
			</p>
		{/if}
	</div>
{:else}
	<div class="h-20"></div>
	<p class="text-center">Laden...</p>
	<div class="h-20"></div>
{/if}
