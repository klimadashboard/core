<script>
	import formatNumber from '$lib/stores/formatNumber';
	export let data;
	console.log(data);

	// Find the needed entries
	const gasEntry = data.find((d) => d.category === 'gas');
	const oilEntry = data.find((d) => d.category === 'heating oil');

	// Extract the values
	const gasTotal = gasEntry?.value || 0;
	const oilTotal = oilEntry?.value || 0;

	// Total number of days left
	const totalDays = 8267;

	// Calculate how many gas/oil heatings need to be exchanged per day
	const gasPerDay = gasTotal / totalDays;
	const oilPerDay = oilTotal / totalDays;

	// Helper to format the output based on quantity
	function formatRate(perDay) {
		const perMonth = perDay * 30.4375; // average month length
		const perYear = perDay * 365;

		if (perYear > 100) {
			if (perMonth > 60) {
				return [Math.round(perDay), 'day'];
			} else {
				return [Math.round(perMonth), 'month'];
			}
		} else {
			return [Math.round(perYear), 'year'];
		}
	}
</script>

<div class="grid grid-cols-2 gap-2 mt-4">
	<div class="rounded-2xl p-3 border border-current/20">
		<p class="text-6xl font-light tabular-nums">{formatNumber(formatRate(gasPerDay)[0])}</p>
		<p class="text-lg mt-2">
			Gasheizungen müssen im Schnitt zwischen Mitte 2022 & Anfang 2045 <strong
				>pro {formatRate(gasPerDay)[1]}</strong
			> getauscht werden, um die Klimaziele einzuhalten.
		</p>
	</div>
	<div class="rounded-2xl p-3 border border-current/20">
		<p class="text-6xl font-light tabular-nums">{formatNumber(formatRate(oilPerDay)[0])}</p>
		<p class="text-lg mt-2">
			Heizölheizungen müssen im Schnitt zwischen Mitte 2022 & Anfang 2045 <strong
				>pro {formatRate(oilPerDay)[1]}</strong
			> getauscht werden, um die Klimaziele einzuhalten.
		</p>
	</div>
</div>
