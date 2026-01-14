<script lang="ts">
	import { onMount } from 'svelte';
	import { AsyncGetSolarPotentialDe } from './__generated__/getData.generated';
	import type { Solar_Potential_De } from '../../../../../types';
	import { formatLabel } from '$lib/utils/format';

	let municipalities: Solar_Potential_De[] = [];
	let filteredMunicipalities: Solar_Potential_De[] = [];
	let globallySortedMunicipalities: Solar_Potential_De[] = [];
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let selectedRegion = 'Gemeinden';
	let currentPage = 1;
	const itemsPerPage = 10;
	let sortColumn: keyof Solar_Potential_De | null = 'netPotentialShare';
	let sortDirection: 'asc' | 'desc' = 'desc';

	onMount(async () => {
		try {
			const {
				data,
				loading: initialLoading,
				error: queryError
			} = await AsyncGetSolarPotentialDe({
				variables: {
					limit: -1,
					offset: 0
				}
			});

			if (queryError) {
				error = 'Fehler beim Laden der Daten';
				console.error('GraphQL Error:', queryError);
			} else if (data?.solar_potential_de) {
				municipalities = data.solar_potential_de.filter((m) => m !== null) as Solar_Potential_De[];
				applyFiltersAndSort();
			}
		} catch (err) {
			error = 'Fehler beim Laden der Daten';
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	});

	function applyFiltersAndSort() {
		// First, create the globally sorted list by netPotentialShare descending
		let globalSorted = [...municipalities];
		globalSorted.sort((a, b) => {
			const valueA = a.netPotentialShare;
			const valueB = b.netPotentialShare;

			if (valueA == null && valueB == null) return 0;
			if (valueA == null) return 1;
			if (valueB == null) return -1;

			return valueB - valueA;
		});
		globallySortedMunicipalities = globalSorted;

		// Then apply filters and user-selected sorting for display
		let filtered = [...municipalities];

		// Filter by search term
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter((m) => {
				const name = m.GEN?.toLowerCase() || '';
				const bez = m.BEZ?.toLowerCase() || '';
				return name.includes(term) || bez.includes(term);
			});
		}

		// Filter by municipality type
		if (selectedRegion !== 'Gemeinden') {
			filtered = filtered.filter((m) => m.BEZ === selectedRegion);
		}

		// Sort by user-selected column
		if (sortColumn) {
			filtered.sort((a, b) => {
				const valueA = a[sortColumn as keyof Solar_Potential_De];
				const valueB = b[sortColumn as keyof Solar_Potential_De];

				if (valueA == null && valueB == null) return 0;
				if (valueA == null) return 1;
				if (valueB == null) return -1;

				if (typeof valueA === 'number' && typeof valueB === 'number') {
					return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
				}

				if (typeof valueA === 'string' && typeof valueB === 'string') {
					return sortDirection === 'desc'
						? valueB.localeCompare(valueA)
						: valueA.localeCompare(valueB);
				}

				return 0;
			});
		}

		filteredMunicipalities = filtered;
		currentPage = 1;
	}

	function handleSort(column: keyof Solar_Potential_De) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
		} else {
			sortColumn = column;
			sortDirection = 'desc';
		}
		applyFiltersAndSort();
	}

	function handleSearchChange(e: Event) {
		searchTerm = (e.target as HTMLInputElement).value;
		applyFiltersAndSort();
	}

	function handleRegionChange(e: Event) {
		selectedRegion = (e.target as HTMLSelectElement).value;
		applyFiltersAndSort();
	}

	$: paginatedMunicipalities = filteredMunicipalities.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	$: totalPages = Math.ceil(filteredMunicipalities.length / itemsPerPage);

	$: displayText = `Gemeinde ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
		currentPage * itemsPerPage,
		filteredMunicipalities.length
	)} von ${filteredMunicipalities.length}`;

	function formatPercentage(value: number | null | undefined): string {
		if (value == null) return '-';
		return `${formatLabel(value, 1)}%`;
	}

	function formatPower(value: number | null | undefined): string {
		if (value == null) return '-';
		return `${formatLabel(value, 1)} MWp`;
	}
</script>

<div class="space-y-6">
	<!-- Header Controls -->
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex flex-col gap-2 lg:flex-row lg:gap-3">
			<!-- Search Input -->
			<div class="relative flex-1 lg:w-80">
				<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
					<svg
						class="h-5 w-5 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<input
					type="text"
					placeholder="Suche eine Gemeinde..."
					value={searchTerm}
					on:change={handleSearchChange}
					class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
				/>
			</div>

			<!-- Region Selector -->
			<select
				value={selectedRegion}
				on:change={handleRegionChange}
				class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
			>
				<option value="Gemeinden">Gemeinden</option>
				<option value="Stadt">Stadt</option>
				<option value="Gemeinde">Gemeinde</option>
			</select>
		</div>

		<!-- Pagination Info -->
		<div class="flex items-center justify-between gap-4 lg:justify-end">
			<span class="text-sm font-medium text-gray-600">{displayText}</span>
			<div class="flex gap-2">
				<button
					on:click={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Previous page"
				>
					<svg
						class="h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
				<button
					on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Next page"
				>
					<svg
						class="h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
		{#if loading}
			<div class="flex items-center justify-center p-8">
				<div class="text-gray-500">Daten werden geladen...</div>
			</div>
		{:else if error}
			<div class="flex items-center justify-center p-8">
				<div class="text-red-500">{error}</div>
			</div>
		{:else if paginatedMunicipalities.length === 0}
			<div class="flex items-center justify-center p-8">
				<div class="text-gray-500">Keine Gemeinden gefunden</div>
			</div>
		{:else}
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Rang</th>
						<th
							on:click={() => handleSort('GEN')}
							class="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100"
						>
							<div class="flex items-center gap-1">
								Gemeinde
								{#if sortColumn === 'GEN'}
									{#if sortDirection === 'desc'}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
											/>
										</svg>
									{:else}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 17a1 1 0 000-2h11a1 1 0 100 2H3zM3 13a1 1 0 000 2h5a1 1 0 000-2H3zM3 9a1 1 0 100 2h4a1 1 0 100-2H3zM15 4a1 1 0 102 0v5.586l1.293-1.293a1 1 0 001.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L15 9.586V4z"
											/>
										</svg>
									{/if}
								{:else}
									<svg
										class="h-3 w-3 text-gray-400"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
										/>
									</svg>
								{/if}
							</div>
						</th>
						<th
							on:click={() => handleSort('netPotentialShare')}
							class="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100"
						>
							<div class="flex items-center gap-1">
								Genutztes Potential (%)
								{#if sortColumn === 'netPotentialShare'}
									{#if sortDirection === 'desc'}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
											/>
										</svg>
									{:else}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 17a1 1 0 000-2h11a1 1 0 100 2H3zM3 13a1 1 0 000 2h5a1 1 0 000-2H3zM3 9a1 1 0 100 2h4a1 1 0 100-2H3zM15 4a1 1 0 102 0v5.586l1.293-1.293a1 1 0 001.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L15 9.586V4z"
											/>
										</svg>
									{/if}
								{:else}
									<svg
										class="h-3 w-3 text-gray-400"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
										/>
									</svg>
								{/if}
							</div>
						</th>
						<th
							on:click={() => handleSort('buildingsWithPVShare')}
							class="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100"
						>
							<div class="flex items-center gap-1">
								Dächer mit Photovoltaik (%)
								{#if sortColumn === 'buildingsWithPVShare'}
									{#if sortDirection === 'desc'}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
											/>
										</svg>
									{:else}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 17a1 1 0 000-2h11a1 1 0 100 2H3zM3 13a1 1 0 000 2h5a1 1 0 000-2H3zM3 9a1 1 0 100 2h4a1 1 0 100-2H3zM15 4a1 1 0 102 0v5.586l1.293-1.293a1 1 0 001.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L15 9.586V4z"
											/>
										</svg>
									{/if}
								{:else}
									<svg
										class="h-3 w-3 text-gray-400"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
										/>
									</svg>
								{/if}
							</div>
						</th>
						<th
							on:click={() => handleSort('MStRInstalledNetPower')}
							class="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100"
						>
							<div class="flex items-center gap-1">
								Installierte Leistung (MWp)
								{#if sortColumn === 'MStRInstalledNetPower'}
									{#if sortDirection === 'desc'}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
											/>
										</svg>
									{:else}
										<svg
											class="h-3 w-3 text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M3 17a1 1 0 000-2h11a1 1 0 100 2H3zM3 13a1 1 0 000 2h5a1 1 0 000-2H3zM3 9a1 1 0 100 2h4a1 1 0 100-2H3zM15 4a1 1 0 102 0v5.586l1.293-1.293a1 1 0 001.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L15 9.586V4z"
											/>
										</svg>
									{/if}
								{:else}
									<svg
										class="h-3 w-3 text-gray-400"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z"
										/>
									</svg>
								{/if}
							</div>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-gray-700"
							>Veränderung letzte 12 Monate</th
						>
					</tr>
				</thead>
				<tbody>
					{#each paginatedMunicipalities as municipality, index (municipality.id)}
						<tr class="border-b border-gray-100 hover:bg-gray-50/50">
							<td class="px-6 py-4 text-sm font-bold text-gray-900">
								{globallySortedMunicipalities.indexOf(municipality) + 1}
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">{municipality.GEN}</span>
									{#if municipality.BEZ}
										<span
											class="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
										>
											{municipality.BEZ === 'Stadt' ? 'Stadt' : 'Gemeinde'}
										</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="space-y-1">
									<div class="text-sm font-bold text-gray-900">
										{formatPercentage(municipality.netPotentialShare)}
									</div>
									<div class="h-1 w-full bg-gray-100 rounded">
										<div
											class="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded"
											style="width: {municipality.netPotentialShare ?? 0}%"
										></div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="space-y-1">
									<div class="text-sm font-bold text-gray-900">
										{formatPercentage(municipality.buildingsWithPVShare)}
									</div>
									<div class="h-1 w-full bg-gray-100 rounded">
										<div
											class="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded"
											style="width: {municipality.buildingsWithPVShare ?? 0}%"
										></div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-gray-900">
								<div class="flex items-center gap-2">
									<span class="font-semibold"
										>{formatPower(municipality.MStRInstalledNetPower)}</span
									>
									<span class="text-xs text-gray-400">•</span>
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">-</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
</style>
