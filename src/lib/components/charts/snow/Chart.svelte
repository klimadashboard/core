<script>
	export let data;

	import { line, area } from 'd3-shape';

	/**
	 * Groups the data array into separate arrays for each winter period.
	 * Winter is defined as October to April of the following year.
	 *
	 * @param {Array} data - Array of objects with `date` and `sh` properties.
	 * @returns {Array} - Array of winter arrays, each containing daily values.
	 */
	function groupDataByWinter(data) {
		const winters = {};

		data.forEach((entry) => {
			const date = new Date(entry.date);
			let year = date.getFullYear();
			const month = date.getMonth() + 1; // Months are zero-indexed

			// If month is October (10) to December (12), it's the start of a winter
			if (month >= 10) {
				winters[year] = winters[year] || [];
				winters[year].push(entry);
			}
			// If month is January (1) to April (4), it belongs to the previous winter
			else if (month >= 1 && month <= 4) {
				winters[year - 1] = winters[year - 1] || [];
				winters[year - 1].push(entry);
			}
			// Months outside the winter range are ignored
		});

		// Convert the winters object to an array sorted by year
		const sortedWinters = Object.keys(winters)
			.sort((a, b) => a - b)
			.map((year) => winters[year]);

		return sortedWinters;
	}

	// Example usage:
	const wintersData = groupDataByWinter(data);
	console.log(wintersData);

	$: lines = keys.map((k) =>
		generateLine(
			data.filter((d) => !isNaN(d.value)),
			k
		)
	);
</script>

{#each wintersData as winter}
	<div>
		{#each winter as item}
			<svg />
		{/each}
	</div>
{/each}
