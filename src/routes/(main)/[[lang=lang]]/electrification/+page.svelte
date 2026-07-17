<script lang="ts">
	import { page } from '$app/stores';
	import Chart from '$lib/components/charts/index.svelte';
	import {
		fetchElectrificationDataset,
		EU_REGION_CODE,
		TARGETS,
		SOURCES,
		DISPLAY_START
	} from '$lib/utils/electrification';
	import { strings, formatters, sectorLabel, toLang } from '$lib/utils/electrification.i18n';

	$: lang = toLang($page.data.language?.code);
	$: t = strings(lang);
	$: f = formatters(lang);

	let euNow: number | null = null;
	let latestYear: number | null = null;

	// Region names aren't used in the lede, but fetching with the active locale keeps this
	// request on the same cache key as the charts'.
	async function loadLede(l: string) {
		try {
			const dataset = await fetchElectrificationDataset(fetch, l);
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
	$: loadLede(lang);

	const t2030 = TARGETS[0];
	const t2040 = TARGETS[TARGETS.length - 1];
	$: t30Label = t.byYear(f.pct(t2030.value), t2030.year);
	$: t40Label = t.byYear(f.pct(t2040.value), t2040.year);

	// charts collection ids (custom_sveltestring matches the folder under charts/custom/)
	const COUNTRY_PATHS_CHART_ID = 'e75c3605-79c0-4332-90e3-ca1481455b68';
	const DISTANCE_TO_TARGET_CHART_ID = '00296ce1-a2bb-4521-9044-6834d73b57c4';
	const BY_SECTOR_CHART_ID = 'ca7a9f2f-5d0f-49fe-afab-8b8924d580cf';

	// Eurostat nrg_bal codes behind each sector shown in the methodology table.
	const METHOD_SECTORS = [
		{ key: 'total_economy', color: '#64AE9C', nrgBal: 'FC_E' },
		{ key: 'industry', color: '#373949', nrgBal: 'FC_IND_E' },
		{ key: 'residential', color: '#4880A8', nrgBal: 'FC_OTH_HH_E' },
		{ key: 'services', color: '#2171B5', nrgBal: 'FC_OTH_CP_E' },
		{ key: 'transport', color: '#F5AF4A', nrgBal: 'FC_TRA_E' }
	];
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDescription} />
</svelte:head>

<div class="container max-w-6xl mx-auto px-4 py-8 md:py-12">
	<header class="mb-8 max-w-3xl">
		<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
			{t.headline}
		</h1>
		<p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
			{#if euNow != null && latestYear != null}
				{t.ledeCovers(f.pct(euNow, 1), latestYear)}
			{:else}
				{t.ledeCoversFallback}
			{/if}
			{t.ledeBody(t30Label, t40Label)}
		</p>
	</header>

	<div class="grid grid-cols-1 gap-6">
		<Chart id={COUNTRY_PATHS_CHART_ID} type="card" span={12} />
		<Chart id={DISTANCE_TO_TARGET_CHART_ID} type="card" span={12} />
		<Chart id={BY_SECTOR_CHART_ID} type="card" span={12} />
	</div>

	<section class="mt-10">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.methHeading}</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">{t.dataH}</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					{@html t.dataB(DISPLAY_START, latestYear ?? 2024)}
				</p>
			</div>

			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">{t.sectorsH}</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
							<th class="pb-1 font-semibold">{t.colSector}</th>
							<th class="pb-1 font-semibold">{t.colCode}</th>
						</tr>
					</thead>
					<tbody>
						{#each METHOD_SECTORS as s (s.nrgBal)}
							<tr class="border-t border-gray-100 dark:border-gray-800">
								<td class="py-1.5 text-gray-900 dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{s.color}"
										></span>
										{sectorLabel(s.key, lang)}
									</span>
								</td>
								<td class="py-1.5 text-gray-600 dark:text-gray-300"><code>{s.nrgBal}</code></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div id="targets" class="scroll-mt-24">
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">{t.targetsH}</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					{@html t.targetsB(t30Label, t40Label, SOURCES.ec.url, SOURCES.eap.url)}
				</p>
			</div>

			<div id="benchmarks" class="scroll-mt-24">
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">{t.benchmarksH}</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					{@html t.benchmarksB(SOURCES.cop31.url, SOURCES.esabcc.url)}
				</p>
			</div>

			<div>
				<h3 class="font-bold text-gray-900 dark:text-white mb-1">{t.caveatsH}</h3>
				<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
					{t.caveatsB(t.smallNote)}
				</p>
			</div>
		</div>
	</section>

	<footer class="mt-8 text-xs text-gray-500 dark:text-gray-400 max-w-[90ch] leading-relaxed">
		<p>{t.footerData(t.sourceName)}</p>
		<p class="mt-1">
			{t.footerInspired}
			<a
				class="text-economy font-semibold underline underline-offset-2"
				href="https://janrosenow.substack.com/p/is-electrification-happening-fast"
				target="_blank"
				rel="noopener"
			>
				{t.footerLink}
			</a>
		</p>
	</footer>
</div>
