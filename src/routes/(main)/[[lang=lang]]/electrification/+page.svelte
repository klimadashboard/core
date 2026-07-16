<script lang="ts">
	import Chart from '$lib/components/charts/index.svelte';
	import {
		fetchElectrificationDataset,
		EU_REGION_CODE,
		TARGETS,
		DISPLAY_START,
		SOURCE,
		SMALL_COUNTRY_NOTE,
		fmtPct
	} from '$lib/utils/electrification';

	let euNow: number | null = null;
	let latestYear: number | null = null;

	async function loadLede() {
		try {
			const dataset = await fetchElectrificationDataset(fetch);
			const eu = dataset.regions.find((r) => r.code === EU_REGION_CODE);
			const point = eu
				? dataset.points.find(
						(p) =>
							p.regionId === eu.id && p.category === 'total_economy' && p.year === dataset.latestYear
					)
				: undefined;
			euNow = point?.value ?? null;
			latestYear = dataset.latestYear;
		} catch (e) {
			console.error('[electrification landing] lede load failed', e);
		}
	}
	loadLede();

	const t2030 = TARGETS[0];
	const t2040 = TARGETS[TARGETS.length - 1];

	// charts collection ids (custom_sveltestring matches the folder under charts/custom/)
	const COUNTRY_PATHS_CHART_ID = 'e75c3605-79c0-4332-90e3-ca1481455b68';
	const DISTANCE_TO_TARGET_CHART_ID = '00296ce1-a2bb-4521-9044-6834d73b57c4';
	const BY_SECTOR_CHART_ID = 'ca7a9f2f-5d0f-49fe-afab-8b8924d580cf';

	const METHOD_SECTORS = [
		{ label: 'Total final consumption', color: '#64AE9C', nrgBal: 'FC_E' },
		{ label: 'Industry', color: '#373949', nrgBal: 'FC_IND_E' },
		{ label: 'Residential buildings', color: '#4880A8', nrgBal: 'FC_OTH_HH_E' },
		{ label: 'Commercial & services', color: '#2171B5', nrgBal: 'FC_OTH_CP_E' },
		{ label: 'Transport', color: '#F5AF4A', nrgBal: 'FC_TRA_E' }
	];
</script>

<svelte:head>
	<title>EU Electrification Tracker | Klimadashboard</title>
	<meta
		name="description"
		content="Track how the EU and its member states are progressing toward the proposed 32% (2030) and 50% (2040) electrification targets, by country and by sector."
	/>
</svelte:head>

<div class="container max-w-6xl mx-auto px-4 py-8 md:py-12">
	<header class="mb-8 max-w-3xl">
		<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
			How fast is the EU electrifying?
		</h1>
		<p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
			{#if euNow != null && latestYear != null}
				Electricity now covers
				<b class="text-gray-900 dark:text-white">{fmtPct(euNow, 1)}</b>
				of the EU-27's total final energy consumption ({latestYear}).
			{:else}
				Electricity covers a growing share of the EU-27's total final energy consumption.
			{/if}
			Tracking how each sector and country is progressing toward the proposed
			<b class="text-gray-900 dark:text-white">{fmtPct(t2030.value)} by {t2030.year}</b>
			and
			<b class="text-gray-900 dark:text-white">{fmtPct(t2040.value)} by {t2040.year}</b>
			electrification targets.
		</p>
	</header>

	<div class="grid grid-cols-1 gap-6">
		<Chart id={COUNTRY_PATHS_CHART_ID} type="card" span={12} />
		<Chart id={DISTANCE_TO_TARGET_CHART_ID} type="card" span={12} />
		<Chart id={BY_SECTOR_CHART_ID} type="card" span={12} />
	</div>

	<section class="mt-10">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data &amp; methodology</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">Data source</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					Eurostat, Complete energy balances (<code>nrg_bal_c</code>), annual. Charts show {DISPLAY_START}–{latestYear ??
						'2024'}; the series reaches back to 1990 but early-1990s data is unreliable for several
					states. For each sector, the electrification rate = final electricity consumption (product
					<code>E7000</code>) ÷ that sector's total final energy consumption (product
					<code>TOTAL</code>). The EU-27 aggregate is Σ member-state electricity ÷ Σ member-state
					total.
				</p>
			</div>

			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">Sectors</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
							<th class="pb-1 font-semibold">Sector</th>
							<th class="pb-1 font-semibold">Eurostat code</th>
						</tr>
					</thead>
					<tbody>
						{#each METHOD_SECTORS as s (s.nrgBal)}
							<tr class="border-t border-gray-100 dark:border-gray-800">
								<td class="py-1.5 text-gray-900 dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{s.color}"
										></span>
										{s.label}
									</span>
								</td>
								<td class="py-1.5 text-gray-600 dark:text-gray-300"
									><code>{s.nrgBal}</code></td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">Targets</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					<b class="text-gray-900 dark:text-white">32% by 2030</b> — the electrification key performance
					indicator of the EU Clean Industrial Deal and Affordable Energy Action Plan (2025), against
					a 2024 baseline of 23.4%.
					<b class="text-gray-900 dark:text-white">50% by 2040</b> — the ambition expected from the
					forthcoming Electrification Action Plan; the same ~50% level appears in the European
					Commission's 2040 climate-target impact assessment (rising above 60% by 2050). The 2040
					figure is provisional and will be updated once the Action Plan is published.
				</p>
			</div>

			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">Notes &amp; caveats</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					Transport is shown as the raw electricity/TFC ratio (~2%) and excludes the Renewable Energy
					Directive multipliers that raise the Commission's headline figure. Pre-2004 EU-27 is a
					counterfactual sum of today's 27 members. {SMALL_COUNTRY_NOTE} All figures are illustrative,
					not forecasts.
				</p>
			</div>
		</div>
	</section>

	<footer class="mt-8 text-xs text-gray-500 dark:text-gray-400 max-w-[90ch] leading-relaxed">
		<p>Data: {SOURCE}.</p>
		<p class="mt-1">
			Inspired by Jan Rosenow —
			<a
				class="text-economy font-semibold underline underline-offset-2"
				href="https://janrosenow.substack.com/p/is-electrification-happening-fast"
				target="_blank"
				rel="noopener"
			>
				Is electrification happening fast enough?
			</a>
		</p>
	</footer>
</div>
