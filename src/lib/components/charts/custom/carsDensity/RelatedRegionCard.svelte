<script>
	import formatNumber from '$lib/stores/formatNumber';
	import { icons } from './icons';

	export let region;
	export let selectedRegion;
	export let selectedPeriod;
	export let views;

	// Helper: Get trend info for a view
	function getTrend(dataArray, period) {
		const current = dataArray?.find((d) => d.period == period)?.value;
		const previous = dataArray?.find((d) => d.period == period - 1)?.value;
		const delta = current != null && previous != null ? current - previous : null;
		const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
		return { current, delta, trend };
	}

	const getRotation = (trend) =>
		trend === 'up' ? 'rotate(-45deg)' : trend === 'down' ? 'rotate(45deg)' : 'rotate(0deg)';
</script>

<li class="border-t border-current/10 py-2 hover:bg-current/5 transition -mx-3 px-3">
	<button
		class="w-full appearance-none text-left cursor-pointer"
		on:mousedown={() => (selectedRegion = region.code)}
	>
		<div class="flex space-x-1 items-center">
			<div class="w-6 h-6 flex content-center items-center">
				{@html icons.find((k) => k.key == region.type)?.svg}
			</div>
			<div>
				<h3 class="font-bold">
					{region.name} <span class="font-normal">| {region.typeLabel}</span>
				</h3>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-3 w-full">
			{#each views as view}
				{@const trend = getTrend(region[view.dataKey], selectedPeriod)}
				{#if region[view.dataKey]}
					{#key view.dataKey}
						<div class="flex-1 dark:brightness-175" style="color: {view.color}">
							<p class="leading-tight">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="inline"
									style="transform: {getRotation(trend.trend)}"
								>
									<path stroke="none" d="M0 0h24v24H0z" fill="none" />
									<path d="M5 12l14 0" />
									<path d="M13 18l6 -6" />
									<path d="M13 6l6 6" />
								</svg>
								<b class="tabular-nums">
									{formatNumber(
										region[view.dataKey].find((d) => d.period == selectedPeriod)?.value
									)}
									{view.unit ?? '%'}
								</b>
								<br />
								{view.description}
							</p>
							<div class="mt-3 bg-current/10 rounded-full h-2 relative overflow-hidden">
								{#if view.chart === 'progressBar'}
									<div
										class="h-full relative left-0"
										style="width: {region[view.dataKey].find((d) => d.period == selectedPeriod)
											?.value}%; background: {view.color}"
									></div>
								{/if}
							</div>
						</div>
					{/key}
				{/if}
			{/each}
		</div>
	</button>
</li>
