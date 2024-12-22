<script>
	import ImportAndUsage from './ImportAndUsage.svelte';

	const sources = [
		{
			key: 'gas',
			label: 'Erdgas',
			share: 22.79,
			selectable: true
		},
		{
			key: 'oil',
			label: 'Öl',
			share: 34.45,
			selectable: true
		},
		{
			key: 'coal',
			label: 'Kohle',
			share: 7.81,
			selectable: true
		},
		{
			key: 'renewables',
			label: 'Erneuerbare',
			share: 32.85,
			selectable: false
		},
		{
			key: 'waste',
			label: 'Abfälle',
			share: 2.09,
			selectable: false
		}
	];

	$: selectedSource = 'gas';
	$: showWaste = false;

	$: if (selectedSource == 'renewables') {
		window.location.href = '/energie/erneuerbare-energien';
	}
</script>

<main class="dark:bg-gray-800 -mb-16">
	<div class="md:container relative">
		<div class="absolute top-20 left-4 right-4 border-t border-gray-300 flex items-center">
			<p
				class="text-gray-400 text-xs sm:text-sm uppercase tracking-wide text-center inline-block mx-auto bg-white dark:bg-gray-800 -translate-y-2 sm:-translate-y-3 px-2"
			>
				Gesamter Energieverbrauch im Jahr 2023
			</p>
		</div>
		<div class="flex sticky top-16 z-20 dark:bg-gray-700">
			{#if showWaste}
				<div
					class="absolute -top-8 right-0 text-white text-sm uppercase font-semibold tracking-wide flex"
				>
					<span>Abfälle</span> <span class="ml-1 opacity-70">2%</span>
				</div>
			{/if}

			{#each sources as source}
				<button
					class="transition px-1 md:px-4 py-1 border-x border-y-2 border-white dark:border-gray-800 uppercase text-xs sm:text-sm {source.key ==
					selectedSource
						? 'bg-opacity-100 font-bold bg-white dark:bg-gray-800 '
						: ' font-medium bg-gray-600 text-white bg-opacity-80 ' +
						  (source.selectable ? 'hover:bg-opacity-90' : 'cursor-not-allowed')} "
					style="width: {source.share}%"
					on:mousedown={() =>
						sources.find((d) => d.key == selectedSource).selectable
							? (selectedSource = source.key)
							: window.location.reload()}
					on:mouseover={() => (source.key == 'waste' ? (showWaste = true) : (showWaste = false))}
					on:mouseout={() => (showWaste = false)}
				>
					{#if source.share > 5}
						{source.label}
						<span class="opacity-70">{Math.round(source.share)}%</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="container">
		{#if selectedSource == 'gas' || selectedSource == 'oil' || selectedSource == 'coal'}
			<ImportAndUsage {selectedSource} />
		{:else}
			<p class="text-lg mt-16" style="min-height: 70vh;">
				Weitere Inhalte zu erneuerbaren Energieträgern sind in Arbeit.
			</p>
		{/if}
	</div>
</main>

<style>
	details {
		margin: 1rem 0;
		border: 2px bottom gray;
	}

	summary {
		cursor: pointer;
		font-weight: 600;
	}
</style>
