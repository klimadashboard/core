<script>
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let categories;

	let processedData = data
		.filter((d) => d.category !== 'total')
		.map((d) => {
			return {
				category: d.category,
				value: d.value,
				percentage: (d.value / data.find((d) => d.category == 'total')?.value) * 100
			};
		})
		.sort((a, b) => b.percentage - a.percentage);
	let categoriesVisualised = processedData.filter((d) => d.percentage > 1);
	let categoriesOther = processedData.filter((d) => d.percentage <= 1);
</script>

<div class="mt-2 text-lg">
	<ul>
		{#each categoriesVisualised as datapoint}
			{@const category = categories.find((d) => d.key == datapoint.category)}
			<li class="my-1" style="color: {category?.color}">
				<p class="leading-tight font-bold">
					{category?.label}
					{datapoint.icon}
				</p>
				<div class="flex items-center gap-2">
					<div class="h-2 rounded-full bg-current" style="    width: {datapoint.percentage}%"></div>
					<p>
						<strong>{formatNumber(datapoint.percentage)}%</strong> | Anzahl: {formatNumber(
							datapoint.value
						)}
					</p>
				</div>
			</li>
		{/each}
	</ul>

	{#if categoriesOther.length > 0}
		<p class="opacity-80 mt-2">
			<b>Sonstige:</b>
			{#each categoriesOther as datapoint, i}
				{@const category = categories.find((d) => d.key == datapoint.category)}
				{category?.label || datapoint.category} ({formatNumber(datapoint.percentage)}%)
				{#if i !== categoriesOther.length - 1}
					,
				{/if}
			{/each}
		</p>
	{/if}
</div>
