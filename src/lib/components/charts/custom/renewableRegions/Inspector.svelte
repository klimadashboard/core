<script>
	import Loader from '$lib/components/Loader.svelte';
	import BarChart from './BarChart.svelte';
	import Types from './Types.svelte';
	import Comparison from './Comparison.svelte';
	import Disclaimer from './Disclaimer.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { REGION_COLORS } from '../mobilityRenewableShare/constants';
	import dayjs from 'dayjs';

	export let region;
	export let data;
	export let regions;
	export let colors;
	export let selectedEnergy;

	let source = 'Datenquelle: Marktstammdatenregister der Bundesnetzagentur';

	$: if (selectedEnergy == 'wind') {
		source += ' | Goal100';
	}

	$: getDataForRegion = async (regionCode = false, selectedEnergy) => {
		const url =
			regionCode && regionCode !== PUBLIC_VERSION
				? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${regionCode}`
				: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;
		const response = await fetch(url);
		const data = await response.json();
		return data;
	};

	$: promise = getDataForRegion(region.code, selectedEnergy);

	$: getFormattedCapacity = (capacity) => {
		if (capacity < 1000) {
			return formatNumber(Math.round(capacity)) + ' KW' + (selectedEnergy == 'solar' ? 'p' : '');
		} else {
			return (
				formatNumber(Math.round(capacity / 1000)) + ' MW' + (selectedEnergy == 'solar' ? 'p' : '')
			);
		}
	};

	$: filteredData = (data) => {
		return data.by_year.filter((d) => d.cumulative_power_kw > 0);
	};

	$: copyEmbedCode = function () {
		var copyText =
			'<iframe src="' +
			window.location.origin +
			'/embed/renewable-regions/' +
			region.id +
			'?energy=' +
			selectedEnergy +
			'" width=1200 height=400>';
		var dummy = document.createElement('textarea');
		document.body.appendChild(dummy);
		dummy.value = copyText;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);
		alert('Der iFrame-Code wurde in die Zwischenablage kopiert.');
	};
</script>

{#if region}
	{#await promise}
		<Loader />
	{:then result}
		{#if result.by_year[result.by_year.length - 1].cumulative_power_kw === 0}
			<h2 class="font-bold text-xl">
				In {region.name} sind aktuell keine aktiven {selectedEnergy === 'solar'
					? 'Solaranlagen'
					: 'Windräder'} registriert.
			</h2>
			<p class="text-lg">
				Das kann unterschiedliche Gründe haben – in dicht bebauten Gebieten wie zum Beispiel
				Großstädten fehlen häufig die Flächen, an anderen Orten fehlt es bislang an politischem oder
				gesellschaftlichem Willen. Häufig wird Strom aus Windenergie dann aus benachbarten Gemeinden
				mitgenutzt. Insgesamt zeigen sich in Deutschland regionale Unterschiede: Während im Norden
				bereits viele Windräder stehen, ist der Ausbau im Süden noch vergleichsweise gering – trotz
				vorhandener Flächen.
			</p>
		{:else}
			<div class="flex justify-between">
				<h2 class="text-lg mb-4">
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
						class="inline -translate-y-0.5 w-5 h-5"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"
						/><path
							d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"
						/></svg
					>
					{region.name}
				</h2>
				<button
					on:mousedown={() => copyEmbedCode()}
					class="opacity-80 hover:opacity-100 transition cursor-pointer flex items-center gap-1"
					aria-label="Einbetten"
				>
					<span>iFrame kopieren</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="translate-y-0.5"
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
						<polyline points="7 8 3 12 7 16" />
						<polyline points="17 8 21 12 17 16" />
						<line x1="14" y1="4" x2="10" y2="20" />
					</svg>
				</button>
			</div>

			{#if result.by_year.reduce((acc, d) => acc + d.added_power_kw, 0) === 0}
				<p class="text-lg">
					Die Anlagen in dieser Region wurden alle vor dem Jahr 2000 in Betrieb genommen.
				</p>
			{:else}
				<h3 class="font-bold">Netto-Zubau pro Jahr</h3>

				{#if selectedEnergy === 'solar'}
					{#if result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw === 0}
						<h3 class="font-bold text-2xl">
							Seit Jahresbeginn wurden in {region.name} keine Solaranlagen installiert
						</h3>
					{:else}
						<h3 class="font-bold text-2xl">
							Seit Jahresbeginn wurden in {region.name}
							{getFormattedCapacity(
								result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw ?? 0
							)} Solarkapazität installiert
						</h3>
					{/if}
				{:else if result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw === 0}
					<h3 class="font-bold text-2xl leading-tight text-balance">
						Zuletzt wurde im Jahr {result.by_year.filter((d) => d.added_power_kw > 0).pop()?.year} ein
						Windrad in {region.name} in Betrieb genommen.
					</h3>
				{:else}
					<h3 class="font-bold text-2xl leading-tight text-balance">
						Seit Jahresbeginn wurden in {region.name}
						{getFormattedCapacity(
							result.by_year.find((d) => d.year === new Date().getFullYear())?.added_power_kw ?? 0
						)} Kapazität Windenergie installiert
					</h3>
				{/if}

				<BarChart data={result.by_year} {colors} {selectedEnergy} />
				<p class="text-sm mt-2 opacity-80">
					{source} | Datenstand: {dayjs(result.update_date).format('DD.MM.YYYY HH:mm')}
				</p>

				<p class="text-lg mt-4">
					Schaut man nicht nur auf die jährlich installierte Leistung, sondern auf die kumulative
					Gesamtleistung, die in {region.name} installiert ist, ergibt sich die Kurve in der folgenden
					Grafik. Erkunde hierbei auch den flächenbezogenen Vergleich zu benachbarten Gemeinden, der
					durchschnittlichen Entwicklung verschiedener Bundesländer oder sogar für ganz Deutschland.
				</p>
			{/if}

			<h3 class="mt-6 font-bold">Kumulative Leistung</h3>

			<h3 class="font-bold text-2xl mb-2">
				Insgesamt wurden bisher in {region.name}
				{getFormattedCapacity(
					result.by_year.find((d) => d.year === new Date().getFullYear())?.cumulative_power_kw
				)} installiert
			</h3>

			<Comparison data={result.by_year} {regions} {region} {colors} {selectedEnergy} />
			<p class="text-sm mt-2 opacity-80">
				{source} | Datenstand: {dayjs(result.update_date).format('DD.MM.YYYY HH:mm')}
			</p>

			{#if selectedEnergy === 'solar'}
				<p class="text-lg my-4">
					Im Diagramm sieht man, wie sich die gesamte Solarstrom-Leistung in {region.name} über die Jahre
					entwickelt hat. Für die Darstellung werden die Daten für jedes Jahr aufsummiert und ergeben
					somit die gesamte Solarstromleistung (auch kumulative Leistung genannt). Im Jahr 2015, lag
					die installierte PV-Leistung noch bei {formatNumber(
						result.by_year.find((d) => d.year === 2015)?.cumulative_power_kw
					)}
					kWp, während sie Ende 2024 bereits bei {formatNumber(
						result.by_year.find((d) => d.year === 2024)?.cumulative_power_kw
					)}
					kWp lag. Der Solarausbau sieht in Städten anders aus als in ländlichen Regionen. Städte können
					vorwiegend auf Gebäudeflächen PV-Anlagen errichten, während ländliche Regionen auch Freiflächen
					zur Verfügung haben. Deswegen kann ein Vergleich zwischen den beiden Typen verzerrend sein.
				</p>
			{:else}
				<p class="text-lg my-4">
					Im Diagramm sieht man, wie sich die gesamte Windstrom-Leistung in {region.name} über die Jahre entwickelt hat. 
					Für die Darstellung werden die Daten für jedes Jahr aufsummiert und ergeben somit die gesamte Windstromleistung 
					(auch kumulative Leistung genannt).
  					{#if (result.by_year.find(d => d.year === 2024)?.cumulative_power_kw ?? 0) > (result.by_year.find(d => d.year === 2015)?.cumulative_power_kw ?? 0)}
   						Im Jahr 2015 lag die installierte Wind-Leistung noch bei 
							{formatNumber((result.by_year.find(d => d.year === 2015)?.cumulative_power_kw ?? 0) / 1000)} 
						MW, während sie Ende 2024 bereits bei 
							{formatNumber((result.by_year.find(d => d.year === 2024)?.cumulative_power_kw ?? 0) / 1000)} 
						MW lag. 
					{:else if (result.by_year.find(d => d.year === 2024)?.cumulative_power_kw ?? 0) === (result.by_year.find(d => d.year === 2015)?.cumulative_power_kw ?? 0)}
    					Seit 2015 beträgt die installierte Wind-Leistung in {region.name} unverändert 
							{formatNumber((result.by_year.find(d => d.year === 2015)?.cumulative_power_kw ?? 0) / 1000)} MW. 
						Seitdem wurde kein neues Windrad in Betrieb genommen.
					{:else}
						Im Jahr 2015 lag die installierte Wind-Leistung bei 
							{formatNumber((result.by_year.find(d => d.year === 2015)?.cumulative_power_kw ?? 0) / 1000)} 
						MW, während sie Ende 2024 bei 
							{formatNumber((result.by_year.find(d => d.year === 2024)?.cumulative_power_kw ?? 0) / 1000)} 
						MW lag. Die installierte Wind-Leistung hat sich in diesem Zeitraum somit aufgrund von mehr Abschaltungen 
						als Neuinbetriebnahmen verringert. 
					{/if}
  					Ein Vergleich zwischen Städten und ländlichen Regionen kann verzerrend sein, da Städte aufgrund der 
					Bebauung keinen Platz für Windräder haben.
				</p>
			{/if}

			<Disclaimer
				{region}
				ratio={result.grid_operator_checked_ratio}
				{colors}
				{selectedEnergy}
				updateDate={dayjs(result.update_date).format('DD.MM.YYYY HH:mm')}
			/>
			{#if selectedEnergy == 'solar'}
				<Types data={result.current_by_type} {colors} {region} />
			{/if}
		{/if}
	{/await}
{/if}
