function evaluateCondition(d, condition) {
	const fieldValue = d[condition.field];

	if (condition.value !== undefined) {
		if (Array.isArray(condition.value)) {
			return condition.value.includes(fieldValue);
		}
		return fieldValue === condition.value;
	}

	// Handle range conditions (min and/or max)
	if (condition.min !== undefined || condition.max !== undefined) {
		// First, try to parse the field as a date.
		const fieldDate = new Date(fieldValue);
		if (!isNaN(fieldDate.getTime())) {
			// Field is a valid date so compare timestamps.
			const valueToCheck = fieldDate.getTime();
			// Parse the boundaries as dates (if defined)
			const min = condition.min !== undefined ? new Date(condition.min).getTime() : -Infinity;
			const max = condition.max !== undefined ? new Date(condition.max).getTime() : Infinity;

			if (valueToCheck < min || valueToCheck > max) {
				return false;
			}
		} else {
			// Fallback: treat as a number.
			const numValue = parseFloat(fieldValue);
			if (isNaN(numValue)) {
				console.warn(`Skipping invalid value for field ${condition.field}:`, fieldValue);
				return false;
			}
			const min = condition.min !== undefined ? parseFloat(condition.min) : -Infinity;
			const max = condition.max !== undefined ? parseFloat(condition.max) : Infinity;
			if (numValue < min || numValue > max) {
				return false;
			}
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

export const mapAndFilterData = (chart, data) => {
	const processedData = data
		.map((d) => ({
			x: d[chart.x_axis],
			x_axis_name: chart.x_axis_name,
			layers: chart.layers
				.map((l, i) => {
					const layerFilters = l.filter || { logic: 'and', conditions: [] };
					const passesFilter = evaluateLogic(d, layerFilters);

					if (!passesFilter) return null;

					return {
						label: l.name,
						y: d[l.y_axis],
						unit: d.unit,
						type: l.type
					};
				})
				.filter((layer) => layer !== null) // Remove layers that didn't pass filtering.
		}))
		.filter((entry) => entry.layers.length > 0);

	return processedData;
};
