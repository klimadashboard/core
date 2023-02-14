<script>
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import Papa from 'papaparse';
	import duration from 'dayjs/plugin/duration';
	import { glossaryItem } from '$lib/stores/glossary';

	export let gap;
	export let icon;

	let currentGoal;
	Papa.parse('https://data.klimadashboard.org/at/energy/renewables/' + gap + '_zielpfad.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				currentGoal = results.data.find((d) => d.DateTime == '2030-12-31').Jahresproduktion;
			}
		}
	});

	let currentProduction;
	let lastUpdate;
	Papa.parse('https://data.klimadashboard.org/at/energy/renewables/' + gap + '_produktion.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				lastUpdate = results.data[results.data.length - 1].DateTime.substring(0, 10);
				currentProduction = results.data[results.data.length - 1].Jahresproduktion;
			}
		}
	});

	dayjs.extend(duration);

	$: monthsLeftUntil2030 = dayjs.duration(dayjs('2030-12-31').diff(dayjs(lastUpdate))).asMonths();

	$: calculateGap = function (key) {
		const gap = currentGoal - currentProduction;
		let count;
		let area;
		if (key == 'pv') {
			count = (gap * 1000000) / 20;
			area = count * 200;
		} else if (key == 'windkraft') {
			count = (gap * 1000000000) / 11250000;
			area = count * 2500;
		}
		return [Math.round(count / monthsLeftUntil2030), Math.round(area), Math.round(count)];
	};

	$: values = calculateGap(gap);

	$: areaOfAustria = (values[1] / 83871000000) * 100;
</script>

<div>
	<div class="flex items-end gap-4">
		<span class="text-7xl md:text-8xl font-extralight translate-y-2 -translate-x-1 tracking-tight">
			{formatNumber(values[0])}
		</span>
		{@html icon}
	</div>
	<p class="mt-2 leading-snug">
		{#if gap == 'pv'}
			zusätzliche <b>Photovoltaik-Anlagen</b> (je 20 kWp und 200 m<sup>2</sup> PV-Fläche) müssen
			<b>pro Monat</b>
			bis 2030 gebaut werden, um die Erneuerbaren-Ausbau-Gesetzes-Vorgabe zu erreichen. <br />Für
			die Vorgabe wird eine Gesamt-PV-Fläche von etwa {formatNumber(
				Math.round(values[1]) / 1000000
			)} km<sup>2</sup> benötigt.
		{:else}
			<b>zusätzliche Windräder</b> (mit je 5MW Leistung) müssen <b>pro Monat</b> bis 2030 gebaut
			werden, um die Erneuerbaren-Ausbau-Gesetzes-Vorgabe zu erreichen. <br />Für diese {formatNumber(
				values[2]
			)} Windräder würden circa {formatNumber(Math.round(values[1]) / 1000000)} km<sup>2</sup> Fläche
			(inkl. Bauplatz und Wege) benötigt.
		{/if}
		Das entspricht {(Math.round(areaOfAustria * 1000) / 1000).toString().replace('.', ',')}% der
		Fläche Österreichs.
		<button
			on:mousedown={() => glossaryItem.set(gap == 'pv' ? 'platzbedarf-pv' : 'platzbedarf-wind')}
			aria-label="Info"
			class="translate-y-1"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="w-5 h-5 icon icon-tabler icon-tabler-info-circle"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<circle cx="12" cy="12" r="9" />
				<line x1="12" y1="8" x2="12.01" y2="8" />
				<polyline points="11 12 12 12 12 16 13 16" />
			</svg>
		</button>
	</p>
</div>
