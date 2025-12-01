<script>
	import Papa from 'papaparse';
	import { Plot, Line, Text } from 'svelteplot';

	let data = [];
	let categories = [];
	let colors = [
		'#047857', // deeper, brighter green
		'#1D4ED8', // saturated blue with more luminance
		'#6B7280', // lighter neutral gray to contrast more with colors
		'#DC2626', // brighter red for contrast
		'#B45309', // distinct warm brown (lighter/more saturated)
		'#EAB308' // saturated yellow-gold (high contrast)
	];
	let xKey = 'Stichtag';

	Papa.parse('/data_temp/neuzulassungen-test.tsv', {
		download: true,
		header: true,
		dynamicTyping: true,
		complete: function (results) {
			categories = Object.keys(results.data[0] || {}).filter((d) => d !== xKey);
			// Extract categories
			categories = Object.keys(results.data[0] || {}).filter((d) => d !== xKey);

			// Clean & convert
			data = results.data
				.filter((d) => d[xKey]) // remove empty rows
				.map((d) => ({
					...d,
					[xKey]: new Date(d[xKey]) // <-- convert the date string into a JS Date
				}));
			console.log(data);
		}
	});

	$: labelData = data.length
		? categories.map((cat) => {
				// Find the most recent row with a valid value
				const valid = data.filter((d) => d[cat] !== undefined && d[cat] !== null);
				const last = valid[valid.length - 1];

				return {
					x: last?.[xKey],
					y: last?.[cat],
					label: cat,
					color: colors[categories.indexOf(cat)]
				};
			})
		: [];
</script>

{#if data.length}
	<Plot
		height={500}
		y={{ domain: [0, 0.5], label: '%' }}
		x={{ domain: [new Date('2020-01-01'), new Date('2025-12-31')] }}
		grid
	>
		{#each categories as cat, i}
			<Line {data} x={'Stichtag'} y={cat} stroke={colors[i]} strokeWidth={2} label={cat} />
		{/each}
		{#each labelData as row}
			<Text
				data={[row]}
				x="x"
				y="y"
				text="label"
				fill={row.color}
				dx={6}
				dy={-1}
				textAnchor="start"
			/>
		{/each}
	</Plot>
{/if}

<!--
<div class="flex gap-2">
	{#each categories as cat, i}
		<div class="flex items-center">
			<span class="block w-2 h-2" style="background: {colors[i]}"></span>
			<span>{cat}</span>
		</div>
	{/each}
</div>
-->
