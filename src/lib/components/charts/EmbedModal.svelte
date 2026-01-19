<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		generateEmbedCode,
		generateScriptEmbedCode,
		copyToClipboard,
		type EmbedOptions
	} from '$lib/components/charts/utils/export';
	import type { EmbedOption } from '$lib/components/charts/types';

	export let chartId: string;
	export let currentRegionId: string | null = null;
	export let availableOptions: {
		view?: boolean;
		region?: boolean;
	} = {};
	/** Custom embed options from chart's chartData.embedOptions */
	export let customEmbedOptions: EmbedOption[] = [];
	export let onClose: () => void;

	// Embed type
	let embedType: 'iframe' | 'script' = 'script';

	// Built-in options
	let includeRegion = !!currentRegionId;
	let viewMode: 'full' | 'simple' = 'full';

	// Custom options state - track which are enabled and their selected values
	let customOptionsState: Record<string, { enabled: boolean; value: string }> = {};

	// Initialize custom options state from props
	$: {
		for (const opt of customEmbedOptions) {
			if (!(opt.key in customOptionsState)) {
				customOptionsState[opt.key] = {
					enabled: true, // Default to enabled
					value: opt.currentValue
				};
			}
		}
	}

	// Build custom params object from enabled custom options
	$: customParams = (() => {
		const params: Record<string, string> = {};
		for (const opt of customEmbedOptions) {
			const state = customOptionsState[opt.key];
			if (state?.enabled) {
				params[opt.key] = state.value;
			}
		}
		return Object.keys(params).length > 0 ? params : undefined;
	})();

	// Computed embed code
	$: embedOptions = {
		region: includeRegion && currentRegionId ? currentRegionId : undefined,
		view: availableOptions.view && viewMode !== 'full' ? viewMode : undefined,
		customParams
	} satisfies EmbedOptions;

	$: embedCode =
		embedType === 'iframe'
			? generateEmbedCode(chartId, embedOptions)
			: generateScriptEmbedCode(chartId, embedOptions);

	// Check if we have any options to show
	$: hasOptions = currentRegionId || availableOptions.view || customEmbedOptions.length > 0;

	let copied = false;
	async function handleCopy() {
		await copyToClipboard(embedCode);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function toggleCustomOption(key: string) {
		customOptionsState[key] = {
			...customOptionsState[key],
			enabled: !customOptionsState[key].enabled
		};
	}

	function setCustomOptionValue(key: string, value: string) {
		customOptionsState[key] = {
			...customOptionsState[key],
			value
		};
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
	transition:fade={{ duration: 150 }}
	on:click={handleBackdropClick}
>
	<div
		class="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
		role="dialog"
		aria-modal="true"
		aria-labelledby="embed-modal-title"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
			<h2 id="embed-modal-title" class="text-lg font-bold text-gray-900 dark:text-white">
				Grafik einbetten
			</h2>
			<button
				on:click={onClose}
				class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
				aria-label="Schließen"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="p-4 space-y-4">
			<!-- Embed type selection -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Einbettungsart
				</label>
				<div class="flex gap-2">
					<button
						on:click={() => (embedType = 'script')}
						class="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition
							{embedType === 'script'
							? 'border-[#28A889] bg-[#28A889]/10 text-[#28A889]'
							: 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}"
					>
						<span class="block font-mono text-xs mb-0.5">script</span>
						<span class="block text-xs opacity-70">Auto-Höhe</span>
					</button>
					<button
						on:click={() => (embedType = 'iframe')}
						class="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition
							{embedType === 'iframe'
							? 'border-[#28A889] bg-[#28A889]/10 text-[#28A889]'
							: 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}"
					>
						<span class="block font-mono text-xs mb-0.5">iframe</span>
						<span class="block text-xs opacity-70">Feste Höhe (450px)</span>
					</button>
				</div>
			</div>

			<!-- Options -->
			{#if hasOptions}
				<div class="space-y-3">
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Optionen
					</label>

					{#if currentRegionId}
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={includeRegion}
								class="w-4 h-4 rounded border-gray-300 text-[#28A889] focus:ring-[#28A889]"
							/>
							<span class="text-sm text-gray-700 dark:text-gray-300">
								Region vorauswählen
							</span>
						</label>
					{/if}

					{#if availableOptions.view}
						<div>
							<label class="flex items-center gap-3 cursor-pointer mb-2">
								<input
									type="checkbox"
									checked={viewMode === 'simple'}
									on:change={(e) => (viewMode = e.currentTarget.checked ? 'simple' : 'full')}
									class="w-4 h-4 rounded border-gray-300 text-[#28A889] focus:ring-[#28A889]"
								/>
								<span class="text-sm text-gray-700 dark:text-gray-300">
									Vereinfachte Ansicht (nur Grafik)
								</span>
							</label>
						</div>
					{/if}

					<!-- Custom embed options from chart -->
					{#each customEmbedOptions as option (option.key)}
						{@const state = customOptionsState[option.key]}
						<div>
							<label class="flex items-center gap-3 cursor-pointer mb-2">
								<input
									type="checkbox"
									checked={state?.enabled ?? true}
									on:change={() => toggleCustomOption(option.key)}
									class="w-4 h-4 rounded border-gray-300 text-[#28A889] focus:ring-[#28A889]"
								/>
								<span class="text-sm text-gray-700 dark:text-gray-300">
									{option.label}
								</span>
							</label>
							{#if state?.enabled}
								<div class="ml-7 flex flex-wrap gap-2">
									{#each option.choices as choice}
										<button
											on:click={() => setCustomOptionValue(option.key, choice.value)}
											class="px-3 py-1.5 rounded text-sm font-medium transition
												{state?.value === choice.value
												? 'bg-[#28A889]/10 text-[#28A889] border border-[#28A889]'
												: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}"
										>
											{choice.label}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Code preview -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Einbettungscode
				</label>
				<div class="relative">
					<pre
						class="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
				</div>
			</div>

			<!-- Copy button -->
			<button
				on:click={handleCopy}
				class="w-full px-4 py-2.5 bg-[#28A889] hover:bg-[#1f8a6f] text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
			>
				{#if copied}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
					Kopiert!
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path
							d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
						/>
					</svg>
					Code kopieren
				{/if}
			</button>
		</div>
	</div>
</div>
