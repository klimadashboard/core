<script lang="ts">
	import Search from '$lib/components/Search.svelte';
	import ComingSoon from './ComingSoon.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import RegionsMap from './RegionsMap.svelte';

	export let data;

	const regionsCount = data.regions.length;

	let layerFilter = 'all';

	$: filteredRegions = [...data.regions]
		.filter((r) => r.name && (!r.layer || layerFilter === 'all' || r.layer === layerFilter))
		.sort((a, b) => a.name.localeCompare(b.name));

	$: groupedRegions = filteredRegions.reduce((acc, r) => {
		const letter = r.name[0].toUpperCase();
		acc[letter] = acc[letter] || [];
		acc[letter].push(r);
		return acc;
	}, {});

	const withPopulation = data.regions.filter(
		(r) => typeof r.population === 'number' && r.layer == 'municipality'
	);
	const withArea = data.regions.filter(
		(r) => typeof r.area === 'number' && r.layer == 'municipality'
	);

	const top5 = [...withPopulation].sort((a, b) => b.population - a.population).slice(0, 5);
	const lowestPop = [...withPopulation].sort((a, b) => a.population - b.population)[0];
	const smallestArea = [...withArea].sort((a, b) => a.area - b.area)[0];
	const popClosestCurrentYear = [...withPopulation].sort(
		(a, b) =>
			Math.abs(a.population - new Date().getFullYear()) -
			Math.abs(b.population - new Date().getFullYear())
	)[0];
	const lastAlpha = [...data.regions].sort((a, b) => b.name.localeCompare(a.name))[0];

	let suggestions = [...top5, lowestPop, smallestArea, popClosestCurrentYear, lastAlpha].filter(
		(r, i, self) => self.findIndex((s) => s.id === r.id) === i
	);

	const regionIndex = new Map(data.regions.map((r) => [r.id, r]));
	const parentCache = new Map();

	function getRegionParent(region) {
		if (!region?.parents || !Array.isArray(region.parents)) return false;

		if (parentCache.has(region.id)) return parentCache.get(region.id);

		for (const parent of region.parents) {
			const match = regionIndex.get(parent.id);
			if (match?.layer === 'state') {
				parentCache.set(region.id, match.name);
				return match.name;
			}
		}

		parentCache.set(region.id, false);
		return false;
	}
</script>

<div class="-mt-1">
	<div class="relative">
		<div class="absolute z-20 inset-0 pointer-events-none">
			<div class="container py-4">
				<div
					class="max-w-xl pointer-events-auto bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm rounded-2xl p-4 shadow-md"
				>
					<h1 class="text-2xl font-bold max-w-md mb-3 leading-tight">
						Klima, Energie und Mobilität bei dir vor Ort
					</h1>
					<Search />
				</div>
			</div>
		</div>

		<RegionsMap />
	</div>

	<div class="container pb-20">
		<div class="mt-8 text-lg text">
			<p class="">
				<strong
					>{formatNumber(regionsCount)} Klimadashboards zeigen, wo die Regionen in der Klimawende stehen.</strong
				>
				Du kannst dir einfach eine Region auf der Karte oder der Liste unten aussuchen oder dich orten
				lassen und wir wählen deine Region ganz automatisch aus!
			</p>
			<p>
				Du weißt nicht, wohin du reisen magst? Wie wär’s mit den größten Regionen
				{#each top5 as region}
					<a class="hover:underline" href={`/regions/${region.id}`}>{region.name}</a>,
				{/each} oder der Region mit den wenigsten Einwohnern
				<a class="hover:underline" href={`/regions/${lowestPop.id}`}>{lowestPop.name}</a>? Die
				flächenmäßig kleinste Region in unserer Datenbank ist
				<a class="hover:underline" href={`/regions/${smallestArea.id}`}>{smallestArea.name}</a>. Mit
				exakt
				{popClosestCurrentYear.population} Einwohnern ist
				<a class="hover:underline" href={`/regions/${popClosestCurrentYear.id}`}
					>{popClosestCurrentYear.name}</a
				>
				die Region mit der Einwohneranzahl, die am nähesten zum aktuellen Jahr ist. Und die Region am
				Ende des Alphabets
				<a class="hover:underline" href={`/regions/${lastAlpha.id}`}>{lastAlpha.name}</a> freut sich
				auch auf deinen Besuch.
			</p>
		</div>

		<div class="mt-8 flex gap-1 items-center">
			<select
				id="layerFilter"
				bind:value={layerFilter}
				aria-label="Filter"
				class="border rounded p-1 input"
			>
				<option value="all">Alle Ebenen anzeigen</option>
				<option value="state">Bundesland</option>
				<option value="district">Landkreis</option>
				<option value="municipality">Gemeinde</option>
			</select>
		</div>

		<div class="mt-6">
			<h2 class="text-xl font-semibold mb-2">Regionen (alphabetisch)</h2>
			{#each Object.keys(groupedRegions).sort() as letter}
				<div class="mb-8">
					<h3 class="text-5xl font-light">{letter}</h3>
					<ul class="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
						{#each groupedRegions[letter] as region}
							<li>
								<a
									class="hover:underline underline-offset-2 leading-[0.1em]!"
									href={`/regions/${region.id}`}
									>{region.name} ({region.layer_label})<br />
									{#if getRegionParent(region)}
										<span class="opacity-70">{getRegionParent(region)}</span>{/if}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	#map {
		width: 100%;
		height: 70vh;
		max-height: 400px;
		margin-bottom: 2rem;
	}

	.text a {
		@apply opacity-80 hover:opacity-100 underline transition-all duration-200;
	}
</style>
