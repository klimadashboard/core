<script>
	import { createEventDispatcher } from 'svelte';
	import Switch from '$lib/components/Switch.svelte';

	export let incidents = [];
	export let hotspots = [];
	export let selectedDistrict = null;
	export let selectedIncident = null;
	export let selectedHotspot = null;
	export let districts = null;
	export let startDate = '';
	export let endDate = '';
	export let showBim = true;
	export let showBus = true;
	export let showNachtbus = true;

	const dispatch = createEventDispatcher();

	// Table view: 'hotspots', 'districts', or 'lines'
	let tableView = 'hotspots';
	const tableViews = [
		{ key: 'hotspots', label: 'Problemzonen' },
		{ key: 'districts', label: 'Bezirke' },
		{ key: 'lines', label: 'Linien' }
	];

	// Sorting state
	let hotspotSort = { key: 'count', dir: 'desc' };
	let districtSort = { key: 'count', dir: 'desc' };
	let lineSort = { key: 'count', dir: 'desc' };

	// Stats
	$: totalCount = incidents.length;
	$: geocodedCount = incidents.filter((i) => i.lat != null).length;

	/** Get valid durations in minutes (only when start < end) */
	function getValidDurations(incs) {
		return incs
			.filter((i) => i.date_start && i.date_end)
			.map((i) => {
				const start = new Date(i.date_start).getTime();
				const end = new Date(i.date_end).getTime();
				return (end - start) / 60000;
			})
			.filter((d) => d > 0 && d < 1440);
	}

	function median(arr) {
		if (arr.length === 0) return 0;
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
	}

	$: medianDuration = (() => {
		const durations = getValidDurations(incidents);
		return Math.round(median(durations));
	})();

	$: totalDisruptionMinutes = (() => {
		const durations = getValidDurations(incidents);
		return Math.round(durations.reduce((s, d) => s + d, 0));
	})();

	$: districtName = (() => {
		if (!selectedDistrict || !districts) return null;
		const feat = districts.features.find((f) => f.properties.number === selectedDistrict);
		return feat?.properties.label || `${selectedDistrict}. Bezirk`;
	})();

	$: yearLabel = startDate.slice(0, 4) === endDate.slice(0, 4)
		? `im Jahr ${startDate.slice(0, 4)}`
		: `von ${startDate.slice(0, 4)} bis ${endDate.slice(0, 4)}`;

	// Dynamic label based on active transport modes
	$: modeLabel = (() => {
		const modes = [];
		if (showBim) modes.push('Bim');
		if (showBus) modes.push('Bus');
		if (showNachtbus) modes.push('Nachtbus');
		if (modes.length === 0 || modes.length === 3) return 'Öffi-Betrieb';
		if (modes.length === 1) {
			if (modes[0] === 'Bim') return 'Straßenbahnbetrieb';
			if (modes[0] === 'Bus') return 'Busbetrieb';
			return 'Nachtbusbetrieb';
		}
		return `${modes[0]}- und ${modes[1]}betrieb`;
	})();

	// District stats for district summary table
	$: districtStats = (() => {
		if (!districts) return [];
		const stats = new Map();
		for (const feat of districts.features) {
			const num = feat.properties.number;
			stats.set(num, { number: num, label: feat.properties.label, count: 0, totalMinutes: 0 });
		}
		for (const inc of incidents) {
			if (!inc.district) continue;
			const s = stats.get(inc.district);
			if (!s) continue;
			s.count++;
			if (inc.date_start && inc.date_end) {
				const mins = (new Date(inc.date_end).getTime() - new Date(inc.date_start).getTime()) / 60000;
				if (mins > 0 && mins < 1440) s.totalMinutes += mins;
			}
		}
		return [...stats.values()].filter((s) => s.count > 0);
	})();

	// Line stats for lines table
	$: lineStats = (() => {
		const stats = new Map();
		for (const inc of incidents) {
			if (!inc.lines) continue;
			for (const line of inc.lines.split(',')) {
				const l = line.trim();
				if (!l) continue;
				if (!stats.has(l)) stats.set(l, { line: l, count: 0, totalMinutes: 0 });
				const s = stats.get(l);
				s.count++;
				if (inc.date_start && inc.date_end) {
					const mins = (new Date(inc.date_end).getTime() - new Date(inc.date_start).getTime()) / 60000;
					if (mins > 0 && mins < 1440) s.totalMinutes += mins;
				}
			}
		}
		return [...stats.values()];
	})();

	// Compute totalMinutes for each hotspot
	$: hotspotWithDuration = hotspots.map((hs) => {
		const durations = getValidDurations(hs.incidents);
		return { ...hs, totalMinutes: Math.round(durations.reduce((s, d) => s + d, 0)) };
	});

	// Sorted district stats
	$: sortedDistrictStats = (() => {
		const arr = [...districtStats];
		arr.sort((a, b) => {
			const aVal = a[districtSort.key];
			const bVal = b[districtSort.key];
			if (typeof aVal === 'string') return districtSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			return districtSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
		});
		return arr;
	})();

	// Sorted hotspots
	$: sortedHotspots = (() => {
		const arr = [...hotspotWithDuration];
		arr.sort((a, b) => {
			const aVal = a[hotspotSort.key] ?? '';
			const bVal = b[hotspotSort.key] ?? '';
			if (typeof aVal === 'string') return hotspotSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			return hotspotSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
		});
		return arr;
	})();

	// Sorted line stats
	$: sortedLineStats = (() => {
		const arr = [...lineStats];
		arr.sort((a, b) => {
			const aVal = a[lineSort.key] ?? '';
			const bVal = b[lineSort.key] ?? '';
			if (typeof aVal === 'string') return lineSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			return lineSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
		});
		return arr;
	})();

	// Max values for bar charts
	$: maxHotspotCount = Math.max(...hotspotWithDuration.map((h) => h.count), 1);
	$: maxHotspotMinutes = Math.max(...hotspotWithDuration.map((h) => h.totalMinutes), 1);
	$: maxDistrictCount = Math.max(...districtStats.map((d) => d.count), 1);
	$: maxDistrictMinutes = Math.max(...districtStats.map((d) => d.totalMinutes), 1);
	$: maxLineCount = Math.max(...lineStats.map((l) => l.count), 1);
	$: maxLineMinutes = Math.max(...lineStats.map((l) => l.totalMinutes), 1);

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
		if (ms <= 0) return '–';
		const mins = Math.round(ms / 60000);
		if (mins < 60) return `${mins} Min.`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return `${h} Std. ${m} Min.`;
	}

	/** Smart duration for title: rounds to days, hours, or minutes */
	function formatMinutesSmart(mins) {
		if (!mins || mins <= 0) return '–';
		mins = Math.round(mins);
		if (mins < 60) return `${mins} Minuten`;
		if (mins < 1440) {
			const h = Math.floor(mins / 60);
			const m = mins % 60;
			if (m === 0) return `${h} Stunden`;
			return `${h} Std. ${m} Min.`;
		}
		const days = mins / 1440;
		if (days >= 10) return `${Math.round(days)} Tagen`;
		return `${days.toFixed(1)} Tagen`;
	}

	/** Compact duration for table cells: rounded hour or minutes */
	function formatMinutesCompact(mins) {
		if (!mins || mins <= 0) return '–';
		mins = Math.round(mins);
		if (mins < 60) return `${mins}m`;
		return `${Math.round(mins / 60)}h`;
	}

	function googleMapsUrl(lat, lon) {
		return `https://www.google.com/maps?q=${lat},${lon}`;
	}

	function googleMapsSearchUrl(address) {
		return `https://www.google.com/maps/search/${encodeURIComponent(address + ', Wien')}`;
	}

	function appleMapsUrl(lat, lon) {
		return `https://maps.apple.com/?q=${lat},${lon}`;
	}

	function appleMapsSearchUrl(address) {
		return `https://maps.apple.com/?q=${encodeURIComponent(address + ', Wien')}`;
	}

	function osmUrl(lat, lon) {
		return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
	}

	function osmSearchUrl(address) {
		return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address + ', Wien')}`;
	}

	function toggleHotspotSort(key) {
		if (hotspotSort.key === key) {
			hotspotSort = { key, dir: hotspotSort.dir === 'asc' ? 'desc' : 'asc' };
		} else {
			hotspotSort = { key, dir: 'desc' };
		}
	}

	function toggleDistrictSort(key) {
		if (districtSort.key === key) {
			districtSort = { key, dir: districtSort.dir === 'asc' ? 'desc' : 'asc' };
		} else {
			districtSort = { key, dir: 'desc' };
		}
	}

	function toggleLineSort(key) {
		if (lineSort.key === key) {
			lineSort = { key, dir: lineSort.dir === 'asc' ? 'desc' : 'asc' };
		} else {
			lineSort = { key, dir: 'desc' };
		}
	}

	function sortIcon(sortState, key) {
		if (sortState.key !== key) return '↕';
		return sortState.dir === 'asc' ? '↑' : '↓';
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
			<h3 class="text-xl font-bold mb-1">{selectedIncident.address || 'Unbekannte Adresse'}</h3>
			<div class="flex gap-1.5 text-xs mb-3 items-center">
				<span class="opacity-60">Ort in Maps öffnen:</span>
				{#if selectedIncident.lat && selectedIncident.lon}
					<a href={googleMapsUrl(selectedIncident.lat, selectedIncident.lon)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">Google Maps</a>
					<span class="opacity-40">|</span>
					<a href={appleMapsUrl(selectedIncident.lat, selectedIncident.lon)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">Apple Maps</a>
					<span class="opacity-40">|</span>
					<a href={osmUrl(selectedIncident.lat, selectedIncident.lon)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">OSM</a>
				{:else if selectedIncident.address}
					<a href={googleMapsSearchUrl(selectedIncident.address)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">Google Maps</a>
					<span class="opacity-40">|</span>
					<a href={appleMapsSearchUrl(selectedIncident.address)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">Apple Maps</a>
					<span class="opacity-40">|</span>
					<a href={osmSearchUrl(selectedIncident.address)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">OSM</a>
				{/if}
			</div>
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
					<span class="opacity-60">Verkehrsunterbrechung</span>
					<p class="font-semibold">
						{formatDuration(selectedIncident.date_start, selectedIncident.date_end)}
					</p>
				</div>
				<div>
					<span class="opacity-60">Verkehrsaufnahme</span>
					<p class="font-semibold">
						{#if selectedIncident.date_end}
							{formatTime(selectedIncident.date_end)}
						{:else}
							–
						{/if}
					</p>
				</div>
			</div>
			<div class="text-sm mb-3">
				<span class="opacity-60">Bezirk:</span>
				<span class="font-semibold">{selectedIncident.district || '–'}.</span>
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
			<div class="flex items-center gap-2 mb-1 flex-wrap">
				<h3 class="text-xl font-bold">{selectedHotspot.label}</h3>
				<span
					class="text-xs px-2 py-0.5 rounded-full {selectedHotspot.type === 'street'
						? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
						: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}"
				>
					{selectedHotspot.type === 'street' ? 'Straße' : 'Ort'}
				</span>
			</div>
			<div class="flex gap-1.5 text-xs mb-4 items-center">
				<span class="opacity-60">Ort in Maps öffnen:</span>
				<a href={googleMapsSearchUrl(selectedHotspot.label)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">Google Maps</a>
				<span class="opacity-40">|</span>
				<a href={appleMapsSearchUrl(selectedHotspot.label)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">Apple Maps</a>
				<span class="opacity-40">|</span>
				<a href={osmSearchUrl(selectedHotspot.label)} target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline">OSM</a>
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
			<div class="max-h-60 overflow-y-auto overflow-x-auto">
				<table class="w-full text-sm min-w-[480px]">
					<thead>
						<tr class="text-left opacity-60">
							<th class="pb-1 pr-3">Datum</th>
							<th class="pb-1 pr-3">Adresse</th>
							<th class="pb-1 pr-3">Linien</th>
							<th class="pb-1">Verkehrsunterbrechung</th>
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
		<!-- Overview -->
		<div>
			<!-- Dynamic title -->
			<p class="text-2xl leading-snug mb-4 text-balance">
				{#if districtName}
					In {districtName}
				{:else}
					In Wien
				{/if}
				haben {yearLabel}
				<span class="text-red-600 dark:text-red-400">{totalCount.toLocaleString('de-AT')}</span>
				Falschparker den {modeLabel} gestört, mit einer Gesamtunterbrechung von
				<span class="text-red-600 dark:text-red-400">{formatMinutesSmart(totalDisruptionMinutes)}</span>.
				{#if selectedDistrict}
					<button
						class="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer align-baseline"
						on:click={() => dispatch('selectDistrict', null)}
					>
						Alle Bezirke zeigen
					</button>
				{/if}
			</p>

			<!-- Explainer text -->
			<p class="text-sm opacity-70 mb-3">
				Von {totalCount.toLocaleString('de-AT')} Vorfällen konnten
				{geocodedCount.toLocaleString('de-AT')} geografisch verortet werden.
			</p>

			<!-- Table view switch -->
			<div class="mb-3">
				<Switch views={tableViews} bind:activeView={tableView} on:itemClick={(e) => (tableView = e.detail)} />
			</div>

			{#if tableView === 'hotspots'}
				{#if hotspots.length > 0}
					<div class="max-h-80 overflow-y-auto overflow-x-auto">
						<table class="w-full text-sm table-fixed min-w-[540px]">
							<colgroup>
								<col class="w-8" />
								<col />
								<col class="w-10" />
								<col class="w-32" />
								<col class="w-28" />
								<col class="w-20" />
							</colgroup>
							<thead>
								<tr class="text-left opacity-60">
									<th class="pb-1 pr-1">#</th>
									<th class="pb-1 pr-2 cursor-pointer select-none" on:click={() => toggleHotspotSort('label')}>
										Ort {sortIcon(hotspotSort, 'label')}
									</th>
									<th class="pb-1 pr-1 cursor-pointer select-none" on:click={() => toggleHotspotSort('district')}>
										Bez. {sortIcon(hotspotSort, 'district')}
									</th>
									<th class="pb-1 pr-1 cursor-pointer select-none" on:click={() => toggleHotspotSort('count')}>
										Vorfälle {sortIcon(hotspotSort, 'count')}
									</th>
									<th class="pb-1 pr-1 cursor-pointer select-none" on:click={() => toggleHotspotSort('totalMinutes')}>
										Unterbr. {sortIcon(hotspotSort, 'totalMinutes')}
									</th>
									<th class="pb-1">Linien</th>
								</tr>
							</thead>
							<tbody>
								{#each sortedHotspots as hs, idx}
									<tr
										class="border-t border-current/10 hover:bg-current/5 cursor-pointer transition-colors
											{selectedHotspot?.id === hs.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}"
										on:click={() => dispatch('selectHotspot', hs)}
									>
										<td class="py-1.5 pr-1 opacity-50">{idx + 1}</td>
										<td class="py-1.5 pr-2 font-medium truncate">{hs.label}</td>
										<td class="py-1.5 pr-1 text-center opacity-70">{hs.district || '–'}.</td>
										<td class="py-1.5 pr-1 overflow-hidden">
											<div class="flex items-center gap-1">
												<span class="font-bold w-8 text-right text-xs shrink-0">{hs.count}</span>
												<span class="text-[10px] w-6 text-right opacity-50 shrink-0">{geocodedCount > 0 ? Math.round((hs.count / geocodedCount) * 100) : 0}%</span>
												<div class="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
													<div
														class="h-full bg-red-500 dark:bg-red-400 rounded-full"
														style="width: {(hs.count / maxHotspotCount) * 100}%"
													/>
												</div>
											</div>
										</td>
										<td class="py-1.5 pr-1 overflow-hidden">
											<div class="flex items-center gap-1">
												<span class="font-bold w-8 text-right text-xs shrink-0">{formatMinutesCompact(hs.totalMinutes)}</span>
												<div class="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
													<div
														class="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
														style="width: {(hs.totalMinutes / maxHotspotMinutes) * 100}%"
													/>
												</div>
											</div>
										</td>
										<td class="py-1.5">
											<div class="flex flex-wrap gap-0.5">
												{#each hs.topLines as line}
													<span class="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded font-bold">{line}</span>
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
			{:else if tableView === 'districts'}
				<!-- District summary table -->
				{#if districtStats.length > 0}
					<div class="max-h-80 overflow-y-auto">
						<table class="w-full text-sm table-fixed">
							<colgroup>
								<col />
								<col class="w-36" />
								<col class="w-36" />
							</colgroup>
							<thead>
								<tr class="text-left opacity-60">
									<th class="pb-1 pr-3 cursor-pointer select-none" on:click={() => toggleDistrictSort('label')}>
										Bezirk {sortIcon(districtSort, 'label')}
									</th>
									<th class="pb-1 pr-2 cursor-pointer select-none" on:click={() => toggleDistrictSort('count')}>
										Vorfälle {sortIcon(districtSort, 'count')}
									</th>
									<th class="pb-1 cursor-pointer select-none" on:click={() => toggleDistrictSort('totalMinutes')}>
										Unterbrechung {sortIcon(districtSort, 'totalMinutes')}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each sortedDistrictStats as ds}
									<tr
										class="border-t border-current/10 hover:bg-current/5 cursor-pointer transition-colors
											{selectedDistrict === ds.number ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
										on:click={() => dispatch('selectDistrict', ds.number === selectedDistrict ? null : ds.number)}
									>
										<td class="py-1.5 pr-3 font-medium">{ds.label}</td>
										<td class="py-1.5 pr-2 overflow-hidden">
											<div class="flex items-center gap-1">
												<span class="font-bold w-8 text-right text-xs shrink-0">{ds.count}</span>
												<div class="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
													<div
														class="h-full bg-red-500 dark:bg-red-400 rounded-full"
														style="width: {(ds.count / maxDistrictCount) * 100}%"
													/>
												</div>
											</div>
										</td>
										<td class="py-1.5 overflow-hidden">
											<div class="flex items-center gap-1">
												<span class="font-bold w-8 text-right text-xs shrink-0">{formatMinutesCompact(ds.totalMinutes)}</span>
												<div class="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
													<div
														class="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
														style="width: {(ds.totalMinutes / maxDistrictMinutes) * 100}%"
													/>
												</div>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm opacity-60 mt-4">
						Keine Bezirksdaten verfügbar.
					</p>
				{/if}
			{:else}
				<!-- Lines table -->
				{#if lineStats.length > 0}
					<div class="max-h-80 overflow-y-auto">
						<table class="w-full text-sm table-fixed">
							<colgroup>
								<col class="w-16" />
								<col />
								<col />
							</colgroup>
							<thead>
								<tr class="text-left opacity-60">
									<th class="pb-1 pr-3 cursor-pointer select-none" on:click={() => toggleLineSort('line')}>
										Linie {sortIcon(lineSort, 'line')}
									</th>
									<th class="pb-1 pr-2 cursor-pointer select-none" on:click={() => toggleLineSort('count')}>
										Vorfälle {sortIcon(lineSort, 'count')}
									</th>
									<th class="pb-1 cursor-pointer select-none" on:click={() => toggleLineSort('totalMinutes')}>
										Unterbrechung {sortIcon(lineSort, 'totalMinutes')}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each sortedLineStats as ls}
									<tr class="border-t border-current/10 hover:bg-current/5 transition-colors">
										<td class="py-1.5 pr-3">
											<span class="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-1.5 py-0.5 rounded">
												{ls.line}
											</span>
										</td>
										<td class="py-1.5 pr-2 overflow-hidden">
											<div class="flex items-center gap-1">
												<span class="font-bold w-8 text-right text-xs shrink-0">{ls.count}</span>
												<div class="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
													<div
														class="h-full bg-red-500 dark:bg-red-400 rounded-full"
														style="width: {(ls.count / maxLineCount) * 100}%"
													/>
												</div>
											</div>
										</td>
										<td class="py-1.5 overflow-hidden">
											<div class="flex items-center gap-1">
												<span class="font-bold w-8 text-right text-xs shrink-0">{formatMinutesCompact(ls.totalMinutes)}</span>
												<div class="flex-1 min-w-0 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
													<div
														class="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
														style="width: {(ls.totalMinutes / maxLineMinutes) * 100}%"
													/>
												</div>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm opacity-60 mt-4">
						Keine Liniendaten verfügbar.
					</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>
