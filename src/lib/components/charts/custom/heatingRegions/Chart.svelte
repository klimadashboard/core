<script>
	import formatNumber from '$lib/stores/formatNumber';

	export let data;

	let categories = [
		{
			key: 'gas',
			label: 'Gasheizungen',
			color: '#005E61'
		},
		{
			key: 'district heating (various energy sources)',
			label: 'Fernwärme',
			color: '#800044'
		},
		{
			key: 'heating oil',
			label: 'Heizölheizungen',
			color: '#895129'
		},
		{
			key: 'electricity (without heat pump)',
			label: 'Strom',
			color: '#B28F27'
		},
		{
			key: 'wood, wood pellets',
			label: 'Holz',
			color: '#895129'
		},
		{
			key: 'Erneuerbare',
			label: 'Wärmepumpe',
			color: '#00734D'
		}
	];

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
			<li>
				<p>{datapoint.category} {datapoint.icon}</p>
				<div class="flex items-center gap-2">
					<div class="h-2 rounded-full bg-energy" style="width: {datapoint.percentage}%"></div>
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
			{#each categoriesOther as category, i}
				{category.category} ({formatNumber(category.percentage)}%)
				{#if i !== categoriesOther.length - 1}
					,
				{/if}
			{/each}
		</p>
	{/if}
</div>
