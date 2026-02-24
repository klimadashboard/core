<script>
	import { createEventDispatcher } from 'svelte';

	export let incidents = [];
	export let hotspots = [];
	export let selectedDistrict = null;
	export let selectedIncident = null;
	export let selectedHotspot = null;
	export let districts = null;

	const dispatch = createEventDispatcher();

	// Stats
	$: totalCount = incidents.length;
	$: geocodedCount = incidents.filter((i) => i.lat != null).length;

	$: avgDuration = (() => {
		const durations = incidents
			.filter((i) => i.date_start && i.date_end)
			.map((i) => {
				const start = new Date(i.date_start).getTime();
				const end = new Date(i.date_end).getTime();
				return (end - start) / 60000; // minutes
			})
			.filter((d) => d > 0 && d < 1440); // < 24h
		if (durations.length === 0) return 0;
		return Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
	})();

	$: topLines = (() => {
		const counts = new Map();
		for (const inc of incidents) {
			if (!inc.lines) continue;
			for (const line of inc.lines.split(',')) {
				const l = line.trim();
				if (l) counts.set(l, (counts.get(l) || 0) + 1);
			}
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	})();

	$: districtName = (() => {
		if (!selectedDistrict || !districts) return null;
		const feat = districts.features.find((f) => f.properties.number === selectedDistrict);
		return feat?.properties.label || `${selectedDistrict}. Bezirk`;
	})();

	function formatDate(dateStr) {
		if (!dateStr) return '–';
		const d = new Date(dateStr);
		return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	function formatTime(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDuration(start, end) {
		if (!start || !end) return '–';
		const ms = new Date(end).getTime() - new Date(start).getTime();
		const mins = Math.round(ms / 60000);
		if (mins < 60) return `${mins} Min.`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return `${h} Std. ${m} Min.`;
	}

	function back() {
		dispatch('clearSelection');
	}
</script>

<div
	class="bg-white dark:bg-gray-900 border border-current/10 shadow-lg rounded-2xl p-5 -mt-8 z-30 relative max-w-4xl mx-auto"
>
	{#if selectedIncident}
		<!-- Individual incident view -->
		<div>
			<button
				class="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 cursor-pointer"
				on:click={back}
			>
				&larr; Zurück zur Übersicht
			</button>
			<h3 class="text-xl font-bold mb-2">{selectedIncident.address || 'Unbekannte Adresse'}</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
				<div>
					<span class="opacity-60">Datum</span>
					<p class="font-semibold">{formatDate(selectedIncident.date_start)}</p>
				</div>
				<div>
					<span class="opacity-60">Uhrzeit</span>
					<p class="font-semibold">{formatTime(selectedIncident.date_start)}</p>
				</div>
				<div>
					<span class="opacity-60">Dauer</span>
					<p class="font-semibold">
						{formatDuration(selectedIncident.date_start, selectedIncident.date_end)}
					</p>
				</div>
				<div>
					<span class="opacity-60">Bezirk</span>
					<p class="font-semibold">{selectedIncident.district || '–'}.</p>
				</div>
			</div>
			{#if selectedIncident.lines}
				<div class="mb-3">
					<span class="text-sm opacity-60">Betroffene Linien</span>
					<div class="flex flex-wrap gap-1 mt-1">
						{#each selectedIncident.lines.split(',') as line}
							<span
								class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-0.5 rounded"
							>
								{line.trim()}
							</span>
						{/each}
					</div>
				</div>
			{/if}
			{#if selectedIncident.description}
				<div class="text-sm opacity-80 mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
					{selectedIncident.description}
				</div>
			{/if}
		</div>
	{:else if selectedHotspot}
		<!-- Hotspot detail view -->
		<div>
			<button
				class="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 cursor-pointer"
				on:click={back}
			>
				&larr; Zurück zur Übersicht
			</button>
			<div class="flex items-start gap-3 mb-4">
				<h3 class="text-xl font-bold">{selectedHotspot.label}</h3>
				<span
					class="text-xs px-2 py-0.5 rounded-full {selectedHotspot.type === 'street'
						? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
						: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}"
				>
					{selectedHotspot.type === 'street' ? 'Straße' : 'Ort'}
				</span>
			</div>
			<div class="grid grid-cols-3 gap-3 text-sm mb-4">
				<div>
					<span class="opacity-60">Vorfälle</span>
					<p class="text-2xl font-bold">{selectedHotspot.count}</p>
				</div>
				<div>
					<span class="opacity-60">Top-Linien</span>
					<div class="flex flex-wrap gap-1 mt-1">
						{#each selectedHotspot.topLines as line}
							<span
								class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-1.5 py-0.5 rounded"
							>
								{line}
							</span>
						{/each}
					</div>
				</div>
				<div>
					<span class="opacity-60">Typ</span>
					<p class="font-semibold">
						{selectedHotspot.type === 'street' ? 'Straßenabschnitt' : 'Kreuzung/Haltestelle'}
					</p>
				</div>
			</div>
			<h4 class="font-semibold text-sm mb-2">
				Letzte Vorfälle an diesem Hotspot
			</h4>
			<div class="max-h-60 overflow-y-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left opacity-60">
							<th class="pb-1 pr-3">Datum</th>
							<th class="pb-1 pr-3">Adresse</th>
							<th class="pb-1 pr-3">Linien</th>
							<th class="pb-1">Dauer</th>
						</tr>
					</thead>
					<tbody>
						{#each selectedHotspot.incidents.sort((a, b) => (b.date_start || '').localeCompare(a.date_start || '')).slice(0, 20) as inc}
							<tr
								class="border-t border-current/10 hover:bg-current/5 cursor-pointer"
								on:click={() => dispatch('selectIncident', inc)}
							>
								<td class="py-1 pr-3">{formatDate(inc.date_start)}</td>
								<td class="py-1 pr-3">{inc.address || '–'}</td>
								<td class="py-1 pr-3">{inc.lines || '–'}</td>
								<td class="py-1">{formatDuration(inc.date_start, inc.date_end)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<!-- Overview / hotspot table -->
		<div>
			<div class="flex flex-wrap items-baseline gap-2 mb-4">
				<h3 class="text-xl font-bold">
					{#if districtName}
						{districtName}
					{:else}
						Wien gesamt
					{/if}
				</h3>
				{#if selectedDistrict}
					<button
						class="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
						on:click={() => dispatch('selectDistrict', null)}
					>
						Alle Bezirke zeigen
					</button>
				{/if}
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-5">
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<span class="opacity-60">Vorfälle</span>
					<p class="text-2xl font-bold">{totalCount.toLocaleString('de-AT')}</p>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<span class="opacity-60">Davon verortet</span>
					<p class="text-2xl font-bold">{geocodedCount.toLocaleString('de-AT')}</p>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<span class="opacity-60">&empty; Dauer</span>
					<p class="text-2xl font-bold">{avgDuration} Min.</p>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<span class="opacity-60">Hotspots</span>
					<p class="text-2xl font-bold">{hotspots.length}</p>
				</div>
			</div>

			{#if topLines.length > 0}
				<div class="mb-5">
					<h4 class="font-semibold text-sm mb-2">Meistbetroffene Linien</h4>
					<div class="flex flex-wrap gap-2">
						{#each topLines as [line, count]}
							<span
								class="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded"
							>
								{line}
								<span class="font-normal opacity-70">({count})</span>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if hotspots.length > 0}
				<h4 class="font-semibold text-sm mb-2">Hotspots</h4>
				<div class="max-h-80 overflow-y-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left opacity-60">
								<th class="pb-1 pr-2 w-8">#</th>
								<th class="pb-1 pr-3">Ort</th>
								<th class="pb-1 pr-3">Typ</th>
								<th class="pb-1 pr-3 text-right">Vorfälle</th>
								<th class="pb-1">Top-Linien</th>
							</tr>
						</thead>
						<tbody>
							{#each hotspots as hs, idx}
								<tr
									class="border-t border-current/10 hover:bg-current/5 cursor-pointer transition-colors
										{selectedHotspot?.id === hs.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}"
									on:click={() => dispatch('selectHotspot', hs)}
								>
									<td class="py-1.5 pr-2 opacity-50">{idx + 1}</td>
									<td class="py-1.5 pr-3 font-medium">{hs.label}</td>
									<td class="py-1.5 pr-3">
										<span
											class="text-xs px-1.5 py-0.5 rounded-full {hs.type === 'street'
												? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
												: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'}"
										>
											{hs.type === 'street' ? 'Straße' : 'Ort'}
										</span>
									</td>
									<td class="py-1.5 pr-3 text-right font-bold">{hs.count}</td>
									<td class="py-1.5">
										<div class="flex flex-wrap gap-0.5">
											{#each hs.topLines as line}
												<span
													class="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded font-bold"
												>
													{line}
												</span>
											{/each}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="text-sm opacity-60 mt-4">
					Keine Hotspots im gewählten Zeitraum gefunden. Versuche einen größeren Zeitraum.
				</p>
			{/if}
		</div>
	{/if}

	<p class="text-xs opacity-50 mt-4">
		Datenquelle: Wiener Linien Störungsmeldungen / Florian Stancke |
		{totalCount.toLocaleString('de-AT')} Vorfälle von Falschparkern, die den Straßenbahnbetrieb behinderten
	</p>
</div>
