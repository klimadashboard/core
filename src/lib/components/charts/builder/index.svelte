<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Canvas from './Canvas.svelte';
	import SmallCanvas from './small/SmallCanvas.svelte';

	export let chart;
	export let type = 'regular'; // or small

	function evaluateCondition(d, condition) {
		const fieldValue = d[condition.field];

		if (condition.value !== undefined) {
			if (Array.isArray(condition.value)) {
				return condition.value.includes(fieldValue);
			}
			return fieldValue === condition.value;
		}

		if (condition.min !== undefined || condition.max !== undefined) {
			// Ensure correct data parsing
			const valueToCheck = isNaN(new Date(fieldValue).getTime())
				? new Date(fieldValue)
				: parseFloat(fieldValue);

			if (isNaN(valueToCheck)) {
				console.warn(`Skipping invalid value for field ${condition.field}:`, fieldValue);
				return false;
			}

			if (condition.min !== undefined && valueToCheck < condition.min) {
				return false;
			}
			if (condition.max !== undefined && valueToCheck > condition.max) {
				return false;
			}
		}

		return true;
	}

	function evaluateLogic(d, filterGroup) {
		// If it's a single condition, evaluate it directly
		if (!filterGroup.conditions) {
			return evaluateCondition(d, filterGroup);
		}

		if (filterGroup.conditions.length === 0) return true;

		if (filterGroup.logic === 'or') {
			return filterGroup.conditions.some((condition) =>
				condition.conditions ? evaluateLogic(d, condition) : evaluateCondition(d, condition)
			);
		}

		return filterGroup.conditions.every((condition) =>
			condition.conditions ? evaluateLogic(d, condition) : evaluateCondition(d, condition)
		);
	}

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(readItems(chart.table_name, chart.options));
		console.log(JSON.stringify(chart, null, 2));

		const data = rawData
			.map((d) => ({
				x: d[chart.x_axis],
				x_axis_name: chart.x_axis_name,
				layers: chart.layers
					.map((l) => {
						// Check if the layer has filters and apply them
						const layerFilters = l.filter || { logic: 'and', conditions: [] };
						// console.log(layerFilters);

						if (!evaluateLogic(d, layerFilters)) return null;

						return {
							label: l.name,
							y: d[l.y_axis],
							unit: d.unit,
							type: l.type
						};
					})
					.filter((layer) => layer !== null) // Remove layers that didn't pass filtering
			}))
			.filter((entry) => entry.layers.length > 0); // Remove empty x-axis entries

		console.log(data);
		return data;
	};

	$: promise = getData();
</script>

{#await promise then data}
	{#if type == 'regular'}
		<Canvas {data} {chart} />
	{:else}
		<SmallCanvas {data} {chart} />
	{/if}
{/await}
