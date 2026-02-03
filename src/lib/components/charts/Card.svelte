<!-- $lib/components/charts/Card.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import { snapdom, preCache } from '@zumer/snapdom';
	import { Table } from '$lib/components/charts/primitives';
	import { exportCSV, exportJSON } from '$lib/components/charts/utils/export';
	import RegionProvider from '$lib/components/charts/context/RegionProvider.svelte';
	import EmbedModal from '$lib/components/charts/EmbedModal.svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import { t } from '$lib/utils/t';

	export let chart: any;
	export let span = 12;
	export let mapLayerId: string | null = null;
	export let regionId: string | null = null;

	const dispatch = createEventDispatcher();

	let cardEl: HTMLElement;
	let contentEl: HTMLElement;
	let headerEl: HTMLElement;
	let isVisible = false;
	let isLoading = true;
	let activeTab: 'chart' | 'table' | 'text' = 'chart';
	let chartData: ChartData | null = null;
	let showDownloadMenu = false;
	let showEmbedModal = false;
	let textPanelMaxHeight = 280;

	// Calculate available height for text panel when switching to text tab
	$: if (activeTab === 'text' && contentEl && headerEl) {
		// Content area height minus header height minus padding (mb-3 = 12px)
		const contentHeight = contentEl.clientHeight;
		const headerHeight = headerEl.clientHeight;
		const padding = 12; // mb-3
		textPanelMaxHeight = Math.max(200, contentHeight - headerHeight - padding);
	}

	// Charts that support the 'view' option (simple view)
	const chartsWithViewOption = ['heatingRegions'];
	$: hasViewOption =
		chart.custom_sveltestring && chartsWithViewOption.includes(chart.custom_sveltestring);

	// Get current region ID for embed options
	$: currentRegionId = chartData?.meta?.region?.id || page.data.page?.id || null;

	// Check if we're on an embed route and have a region parameter
	$: isEmbedRoute = page.url.pathname.startsWith('/embed/');
	$: urlRegionId = page.url.searchParams.get('region');

	// Logo link: on embed route with region param, link to regional dashboard; otherwise main site
	$: logoHref =
		isEmbedRoute && urlRegionId
			? `https://klimadashboard.${PUBLIC_VERSION}/regions/${urlRegionId}`
			: `https://klimadashboard.${PUBLIC_VERSION}`;

	// Close menus when clicking outside
	function handleClickOutside(e: MouseEvent) {
		if (showDownloadMenu && !(e.target as HTMLElement).closest('.download-menu')) {
			showDownloadMenu = false;
		}
	}

	// Replace {{#if key}}, {{#if not key}}, and {{placeholder}} in text
	function resolveText(
		raw: string | undefined,
		placeholders: Record<string, any> | undefined
	): string {
		if (!raw || !placeholders) return raw || '';
		// Step 1: conditional blocks {{#if key}}...{{/if}} and {{#if not key}}...{{/if}}
		let result = raw.replace(
			/\{\{#if\s+(not\s+)?(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
			(_: string, negation: string | undefined, key: string, content: string) => {
				const value = placeholders[key];
				const show = negation ? !value : !!value;
				return show ? content : '';
			}
		);
		// Step 2: replace {{placeholder}} values
		result = result.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => {
			const v = placeholders[k];
			return v !== undefined ? String(v) : `{{${k}}}`;
		});
		return result;
	}

	$: heading = resolveText(chart.content?.heading, chartData?.placeholders);
	$: text = resolveText(chart.content?.text, chartData?.placeholders);
	$: methods = resolveText(chart.content?.methods, chartData?.placeholders);
	$: title = resolveText(chart.content?.title, chartData?.placeholders);

	$: showTable = chartData?.table && chartData.table.rows.length > 0;
	$: showText = !!text || !!methods;
	// Check if chart has data - use explicit hasData flag if provided, otherwise check raw array
	$: hasData = chartData?.hasData ?? (chartData?.raw && chartData.raw.length > 0);

	// Dispatch visibility event when data availability changes
	$: if (chartData !== null) {
		dispatch('dataAvailable', { hasData });
	}
	$: source = chartData?.meta?.source || chart.content?.source;
	$: updateDate = chartData?.meta?.updateDate;
	$: note = chartData?.meta?.note;

	// Tab configuration
	type TabId = 'chart' | 'table' | 'text';
	$: tabs = [
		{ id: 'chart' as TabId, label: t(page.data.translations, 'ui.card.tabChart'), show: true },
		{ id: 'table' as TabId, label: t(page.data.translations, 'ui.card.tabTable'), show: showTable },
		{ id: 'text' as TabId, label: t(page.data.translations, 'ui.card.tabInfo'), show: showText }
	].filter((tab) => tab.show);

	// Intersection observer
	onMount(() => {
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isVisible) {
					isVisible = true;
					obs.unobserve(cardEl);
					setTimeout(() => (isLoading = false), 600);
				}
			},
			{ rootMargin: '100px', threshold: 0.01 }
		);
		if (cardEl) obs.observe(cardEl);

		document.addEventListener('click', handleClickOutside);

		return () => {
			obs.disconnect();
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function handleClick(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.no-card-click')) return;
		dispatch('click');
	}

	function setTab(tab: TabId) {
		activeTab = tab;
	}

	function handleTabKeydown(e: KeyboardEvent, tab: TabId) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			setTab(tab);
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			const currentIndex = tabs.findIndex((t) => t.id === activeTab);
			const direction = e.key === 'ArrowRight' ? 1 : -1;
			const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
			setTab(tabs[nextIndex].id);
			const tabEl = cardEl.querySelector(`[data-tab="${tabs[nextIndex].id}"]`) as HTMLElement;
			tabEl?.focus();
		}
	}

	function handleExportCSV(e: MouseEvent) {
		e.stopPropagation();
		if (chartData?.table) exportCSV(chartData.table, chartData.meta?.region?.codeShort);
		showDownloadMenu = false;
	}

	function handleExportJSON(e: MouseEvent) {
		e.stopPropagation();
		if (chartData?.raw)
			exportJSON(
				chartData.raw,
				chartData.table?.filename || 'data',
				chartData.meta?.region?.codeShort
			);
		showDownloadMenu = false;
	}

	function toggleDownloadMenu(e: MouseEvent) {
		e.stopPropagation();
		showDownloadMenu = !showDownloadMenu;
	}

	function openEmbedModal(e: MouseEvent) {
		e.stopPropagation();
		showEmbedModal = true;
	}

	async function handleImage(e: MouseEvent, type: 'png' | 'svg' = 'png') {
		e.stopPropagation();
		if (!contentEl) return;

		try {
			const base = window.location.origin;
			const condensedFont = `${base}/fonts/barlow-condensed-v13-latin-regular.woff2`;
			const condensedFontBold = `${base}/fonts/barlow-condensed-v13-latin-800.woff2`;

			const localFonts = [
				// Regular Barlow
				{ family: 'Barlow', src: `${base}/fonts/barlow-v12-latin-regular.woff2`, weight: '400' },
				{ family: 'Barlow', src: `${base}/fonts/barlow-v12-latin-200.woff2`, weight: '200' },
				{ family: 'Barlow', src: `${base}/fonts/barlow-v12-latin-600.woff2`, weight: '600' },
				// Condensed
				{ family: 'Barlow Condensed', src: condensedFont, weight: '400' },
				{ family: 'Barlow Condensed', src: condensedFont, weight: '500' },
				{ family: 'Barlow Condensed', src: condensedFontBold, weight: '700' },
				{ family: 'Barlow Condensed', src: condensedFontBold, weight: '800' }
			];

			// Pre-cache fonts before capture
			await preCache(contentEl, { embedFonts: true, localFonts });

			const result = await snapdom(contentEl, {
				scale: 2,
				embedFonts: true,
				cache: 'full',
				localFonts,
				filter: (el) => !(el as HTMLElement).dataset?.shareIgnore
			});

			const filename = chart.content?.title || 'chart';
			const blob = await result.toBlob({ type });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${filename}.${type}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Export failed:', err);
		}

		showDownloadMenu = false;
	}

	function handleMap(e: MouseEvent) {
		e.stopPropagation();
		dispatch('openMap');
	}
</script>

<div
	bind:this={cardEl}
	data-chart-id={chart.id}
	class="chart-card group relative bg-white h-full dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all flex flex-col justify-between"
	style="--span: {span};"
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick(e)}
	role="button"
	tabindex="0"
>
	{#if isVisible}
		<div
			bind:this={contentEl}
			class="p-5 pb-3 min-h-[280px] relative overflow-y-auto"
			in:fade={{ duration: 200 }}
		>
			<!-- Skeleton -->
			{#if isLoading}
				<div
					class="absolute inset-0 p-5 bg-white dark:bg-gray-900 z-10"
					transition:fade={{ duration: 150 }}
				>
					<div class="h-5 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-4 animate-pulse"></div>
					<div class="h-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
				</div>
			{/if}

			<!-- Header (always visible) -->
			<div
				bind:this={headerEl}
				class="flex justify-between items-start mb-3"
				class:opacity-0={isLoading}
			>
				<h2
					class="md:text-lg font-bold text-gray-900 dark:text-white flex-1 pr-4 leading-tight text-balance"
				>
					{title || chart.content?.title}
				</h2>
				<a
					href={logoHref}
					target="_blank"
					aria-label="Klimadashboard.{PUBLIC_VERSION}"
					class="flex-shrink-0 opacity-80 hover:opacity-100 transition flex items-center gap-2"
					on:click={(e) => e.stopPropagation()}
				>
					<span class="text-sm font-bold text-[#28A889]">Klimadashboard.{PUBLIC_VERSION}</span>
					<svg
						width="256"
						height="256"
						viewBox="0 0 256 256"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8 rounded-sm"
					>
						<rect width="256" height="256" fill="url(#kd-gradient-{chart.id})" />
						<path
							d="M119.45 88H53C50.7909 88 49 89.7909 49 92V164C49 166.209 50.7909 168 53 168H119.45C122.998 168 124.79 163.723 122.3 161.194L92.3872 130.806C90.8547 129.249 90.8547 126.751 92.3872 125.194L122.3 94.8061C124.79 92.2773 122.998 88 119.45 88Z"
							fill="#DBF0E0"
						/>
						<path
							opacity="0.6"
							d="M162.95 88H134.808C133.732 88 132.701 88.4337 131.948 89.203L96.7358 125.203C95.2152 126.758 95.2152 129.242 96.7358 130.797L131.948 166.797C132.701 167.566 133.732 168 134.808 168H162.95C166.498 168 168.29 163.723 165.8 161.194L135.887 130.806C134.355 129.249 134.355 126.751 135.887 125.194L165.8 94.8061C168.29 92.2773 166.498 88 162.95 88Z"
							fill="#DBF0E0"
						/>
						<path
							opacity="0.2"
							d="M197.95 88H178.808C177.732 88 176.701 88.4337 175.948 89.203L140.736 125.203C139.215 126.758 139.215 129.242 140.736 130.797L175.948 166.797C176.701 167.566 177.732 168 178.808 168H197.95C201.498 168 203.29 163.723 200.8 161.194L170.887 130.806C169.355 129.249 169.355 126.751 170.887 125.194L200.8 94.8061C203.29 92.2773 201.498 88 197.95 88Z"
							fill="#DBF0E0"
						/>
						<defs>
							<linearGradient
								id="kd-gradient-{chart.id}"
								x1="425"
								y1="8.00003"
								x2="16"
								y2="248"
								gradientUnits="userSpaceOnUse"
							>
								<stop stop-color="#A3D58A" />
								<stop offset="1" stop-color="#28A889" />
							</linearGradient>
						</defs>
					</svg>
				</a>
			</div>

			<!-- Content -->
			<div class:opacity-0={isLoading} class="transition-opacity">
				<!-- Chart Tab -->
				<div
					id="tabpanel-chart"
					role="tabpanel"
					aria-labelledby="tab-chart"
					hidden={activeTab !== 'chart'}
				>
					{#if heading}
						<h3 class="text-xl md:text-2xl mb-3 text-balance">{@html heading}</h3>
					{/if}

					<div class="my-3 relative">
						<RegionProvider {regionId} let:region let:loading>
							{@const onChartData = (data: ChartData | null) => {
								chartData = data;
							}}
							<slot {region} regionLoading={loading} {onChartData} />
						</RegionProvider>
					</div>

					<div class="text-xs text-gray-500 mt-4 flex">
						{#if source || note}
							<div class="">
								{#if source}
									<p>
										{page.data.translations?.source}:
										{@html source}
										{#if updateDate}
											<span class="ml-1">
												| {page.data.translations?.dataDate}: {dayjs(updateDate).format(
													'DD.MM.YYYY'
												)}
											</span>
										{/if}
									</p>
								{/if}
								{#if note}
									<p class="mt-1 italic">{note}</p>
								{/if}
							</div>
						{/if}

						<svg
							width="36"
							height="16"
							viewBox="0 0 36 16"
							fill="none"
							class="ml-auto h-4"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								class="fill-current"
								d="M13.6588 2.32039C15.2053 3.86648 15.9787 5.76003 15.9787 7.99999C15.9787 10.2405 15.2187 12.1137 13.6988 13.6206C12.0857 15.2068 10.1793 16 7.97955 16C5.80633 16 3.93294 15.2138 2.35986 13.6399C0.786531 12.067 0 10.1869 0 7.99999C0 5.81363 0.786531 3.92009 2.35986 2.32039C3.89298 0.773296 5.76637 0 7.97955 0C10.2195 0 12.1123 0.773296 13.6588 2.32039ZM3.40106 3.36023C2.09353 4.68098 1.44004 6.22807 1.44004 8.00198C1.44004 9.7759 2.08708 11.3096 3.38093 12.6035C4.67505 13.897 6.21561 14.5442 8.00312 14.5442C9.79065 14.5442 11.3444 13.8911 12.665 12.5837C13.9189 11.3696 14.5461 9.84291 14.5461 8.00198C14.5461 6.17495 13.9087 4.62439 12.6347 3.35028C11.361 2.07717 9.81722 1.43988 8.00312 1.43988C6.18906 1.43989 4.65469 2.08016 3.40106 3.36023ZM6.84181 7.22174C6.64201 6.78595 6.34293 6.56855 5.94408 6.56855C5.23896 6.56855 4.88651 7.04306 4.88651 7.99206C4.88651 8.94106 5.23896 9.41556 5.94408 9.41556C6.40969 9.41556 6.74228 9.18427 6.94183 8.72167L7.91923 9.24183C7.45337 10.0692 6.75444 10.4837 5.82247 10.4837C5.10368 10.4837 4.52786 10.2633 4.0955 9.82256C3.6624 9.3818 3.44647 8.77429 3.44647 7.99999C3.44647 7.23911 3.66936 6.63506 4.11537 6.18737C4.56138 5.74016 5.11685 5.51682 5.78275 5.51682C6.76785 5.51682 7.47323 5.90445 7.89963 6.68022L6.84181 7.22174ZM11.4402 7.22174C11.2401 6.78595 10.947 6.56855 10.5606 6.56855C9.84127 6.56855 9.4814 7.04306 9.4814 7.99206C9.4814 8.94106 9.84127 9.41556 10.5606 9.41556C11.0269 9.41556 11.3536 9.18427 11.5399 8.72167L12.5392 9.24183C12.0741 10.0692 11.3761 10.4837 10.4459 10.4837C9.72809 10.4837 9.15351 10.2633 8.72142 9.82256C8.29006 9.3818 8.07386 8.77429 8.07386 7.99999C8.07386 7.23911 8.29328 6.63506 8.73185 6.18737C9.17014 5.74016 9.72809 5.51682 10.4062 5.51682C11.3895 5.51682 12.0939 5.90445 12.5189 6.68022L11.4402 7.22174Z"
							/>
							<path
								class="fill-current"
								d="M30.1184 6.01613C30.1184 5.73065 29.887 5.5 29.6022 5.5H26.3346C26.0497 5.5 25.8184 5.73065 25.8184 6.01613V9.28338H26.7297V13.153H29.2063V9.28338H30.1184L30.1184 6.01613Z"
							/>
							<path
								class="fill-current"
								d="M27.9653 5.06702C28.5825 5.06702 29.0829 4.5667 29.0829 3.94953C29.0829 3.33235 28.5825 2.83203 27.9653 2.83203C27.348 2.83203 26.8477 3.33235 26.8477 3.94953C26.8477 4.5667 27.348 5.06702 27.9653 5.06702Z"
							/>
							<path
								fill-rule="evenodd"
								clip-rule="evenodd"
								class="fill-current"
								d="M27.9577 0C25.7452 0 23.8713 0.771515 22.3381 2.31656C20.7648 3.91375 19.9785 5.8051 19.9785 7.98795C19.9785 10.1708 20.7648 12.0488 22.3381 13.6199C23.9114 15.191 25.7849 15.9766 27.9577 15.9766C30.1575 15.9766 32.0644 15.1843 33.6772 13.5998C35.1977 12.0956 35.9572 10.225 35.9572 7.98795C35.9572 5.75095 35.1843 3.86093 33.6377 2.31656C32.0912 0.771522 30.1976 0 27.9577 0ZM27.9777 1.4374C29.7911 1.4374 31.3309 2.07654 32.5973 3.35483C33.8778 4.61908 34.5177 6.16412 34.5177 7.98795C34.5177 9.82515 33.8911 11.3501 32.6375 12.5616C31.3176 13.8659 29.7643 14.5184 27.9777 14.5184C26.1911 14.5184 24.6513 13.8726 23.3585 12.5816C22.0647 11.29 21.4184 9.75896 21.4184 7.98795C21.4184 6.21694 22.0717 4.67257 23.3782 3.35483C24.6316 2.07654 26.1651 1.4374 27.9777 1.4374Z"
							/>
						</svg>
					</div>
				</div>

				<!-- Table Tab -->
				<div
					id="tabpanel-table"
					role="tabpanel"
					aria-labelledby="tab-table"
					hidden={activeTab !== 'table'}
				>
					{#if chartData?.table}
						<Table
							columns={chartData.table.columns}
							rows={chartData.table.rows}
							maxHeight="400px"
						/>
					{/if}
				</div>

				<!-- Text/Info Tab -->
				<div
					id="tabpanel-text"
					role="tabpanel"
					aria-labelledby="tab-text"
					hidden={activeTab !== 'text'}
					class="overflow-y-auto"
					style="max-height: {textPanelMaxHeight}px;"
				>
					{#if text}
						<div class="text-base max-w-xl">
							{@html text}
						</div>
					{/if}
					{#if methods}
						<div class="mt-4 text-base max-w-xl">
							{@html methods}
						</div>
					{/if}
				</div>
			</div>

			<!-- Map button -->
			{#if mapLayerId}
				<button
					class="no-card-click absolute top-5 right-14 p-1.5 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
					on:click={handleMap}
					title={t(page.data.translations, 'ui.card.map')}
					aria-label={t(page.data.translations, 'ui.card.showOnMap')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /></svg
					>
				</button>
			{/if}
		</div>

		<!-- Bottom bar -->
		<div
			class="no-card-click bg-gray-100 dark:bg-gray-800 flex items-stretch justify-between flex-shrink-0 relative z-10"
		>
			<!-- Tabs on the left - connected to content above -->
			<div class="flex items-stretch" role="tablist" aria-label="Chart views">
				{#each tabs as tab}
					<button
						data-tab={tab.id}
						role="tab"
						aria-selected={activeTab === tab.id}
						aria-controls="tabpanel-{tab.id}"
						tabindex={activeTab === tab.id ? 0 : -1}
						class="relative px-4 py-2.5 transition-colors flex items-center gap-1.5
							{activeTab === tab.id
							? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white -mb-px border-t-2 border-t-[#28A889]'
							: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
						on:click={() => setTab(tab.id)}
						on:keydown={(e) => handleTabKeydown(e, tab.id)}
					>
						{#if tab.id === 'chart'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="flex-shrink-0"
							>
								<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line
									x1="6"
									y1="20"
									x2="6"
									y2="14"
								/>
							</svg>
						{:else if tab.id === 'table'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="flex-shrink-0"
							>
								<rect x="3" y="3" width="18" height="18" rx="2" /><line
									x1="3"
									y1="9"
									x2="21"
									y2="9"
								/><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" />
							</svg>
						{:else if tab.id === 'text'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="flex-shrink-0"
							>
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline
									points="14 2 14 8 20 8"
								/><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
							</svg>
						{/if}
						<span class="text-sm font-medium">{tab.label}</span>
					</button>
				{/each}
			</div>

			<!-- Action buttons on the right -->
			<div class="flex items-center gap-1 px-2">
				<!-- Download button with menu -->
				{#if hasData}
					<div class="relative download-menu">
						<button
							on:click={toggleDownloadMenu}
							class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-0.5"
							aria-label={t(page.data.translations, 'action.downloadData')}
							aria-expanded={showDownloadMenu}
							aria-haspopup="true"
							title={t(page.data.translations, 'action.downloadData')}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="7 10 12 15 17 10" />
								<line x1="12" y1="15" x2="12" y2="3" />
							</svg>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="10"
								height="10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="transition-transform {showDownloadMenu ? 'rotate-180' : ''}"
							>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</button>

						{#if showDownloadMenu}
							<div
								class="absolute bottom-full right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-20 min-w-[140px]"
								transition:fade={{ duration: 100 }}
							>
								<!-- Data exports -->
								<div class="border-b border-gray-200 dark:border-gray-700">
									<span
										class="block px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
										>{t(page.data.translations, 'ui.card.data') || 'Data'}</span
									>
									<button
										on:click={handleExportCSV}
										class="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
									>
										<span
											class="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded"
											>CSV</span
										>
										<span>{t(page.data.translations, 'ui.card.tabTable')}</span>
									</button>
									<button
										on:click={handleExportJSON}
										class="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
									>
										<span
											class="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded"
											>JSON</span
										>
										<span>{t(page.data.translations, 'ui.card.rawData')}</span>
									</button>
								</div>

								<!-- Image exports -->
								<div>
									<span
										class="block px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
										>{t(page.data.translations, 'ui.card.image') || 'Image'}</span
									>
									<button
										on:click={(e) => handleImage(e, 'png')}
										class="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
									>
										<span
											class="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded"
											>PNG</span
										>
										<span>{t(page.data.translations, 'ui.card.imageRaster') || 'Raster'}</span>
									</button>
									<button
										on:click={(e) => handleImage(e, 'svg')}
										class="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
									>
										<span
											class="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded"
											>SVG</span
										>
										<span>{t(page.data.translations, 'ui.card.imageVector') || 'Vector'}</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Permalink -->
				<a
					href="/charts/{chart.id}"
					class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700"
					on:click={(e) => e.stopPropagation()}
					aria-label={t(page.data.translations, 'ui.card.permalink')}
					title={t(page.data.translations, 'ui.card.permalink')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
							d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
						/>
					</svg>
				</a>

				<!-- Embed button -->
				<button
					on:click={openEmbedModal}
					class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700"
					aria-label={t(page.data.translations, 'ui.embed.code')}
					title={t(page.data.translations, 'action.embed')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="7 8 3 12 7 16" /><polyline points="17 8 21 12 17 16" /><line
							x1="14"
							y1="4"
							x2="10"
							y2="20"
						/>
					</svg>
				</button>
			</div>
		</div>
	{:else}
		<div class="min-h-[280px] bg-gray-50 dark:bg-gray-900"></div>
	{/if}
</div>

{#if showEmbedModal}
	<EmbedModal
		chartId={chart.id}
		{currentRegionId}
		availableOptions={{ view: hasViewOption, region: !!currentRegionId }}
		customEmbedOptions={chartData?.embedOptions || []}
		onClose={() => (showEmbedModal = false)}
	/>
{/if}

<style>
	@reference "tailwindcss/theme";

	/* Responsive grid span: full width on mobile, respect --span on md+ */
	.chart-card {
		grid-column: span 1;
	}

	@media (min-width: 768px) {
		.chart-card {
			grid-column: span var(--span, 12);
		}
	}

	:global(#tabpanel-text p) {
		@apply my-2;
	}
</style>
