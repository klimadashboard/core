<script>
	import dayjs from 'dayjs';
	import Papa from 'papaparse';
	import 'dayjs/locale/de-at';
	import formatNumber from '$lib/stores/formatNumber';

	export let v;

	$: dataETS = [];

	Papa.parse('https://data.klimadashboard.org/eu/ets.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				dataETS = results.data;
			}
		}
	});

	$: priceETS = 0;
	$: dateETS = dayjs();

	$: if (dataETS.length > 0) {
		priceETS = dataETS[dataETS.length - 1][1];
		if (priceETS < 30 || priceETS > 200) {
			priceETS = undefined;
		}
		dateETS = dayjs(dataETS[dataETS.length - 1][0]).format('D.M.YYYY; HH:mm');
	}

	const parser = new DOMParser();
</script>

<div class="grid sm:grid-cols-2 gap-4">
	<div>
		<span class="text-6xl font-extralight tracking-tighter">{v.nationalPrice}€</span>
		<p>{@html v.nationalPriceDescription}</p>
		<p class="text-sm text-gray-400 mt-2">
			{v.source}:
			{@html v.nationalPriceSource}
		</p>
	</div>

	<div>
		<span class="text-6xl font-extralight tracking-tighter">{formatNumber(priceETS)}€</span>
		<p>{@html v.descriptionETS.replace('{date}', dateETS)}</p>
		<p class="text-sm text-gray-400 mt-2">
			{v.source}:
			{@html v.sourceETS}
		</p>
	</div>

	<div>
		<span class="text-6xl font-extralight tracking-tighter">{v.priceNoGenerationalJustice}€</span>
		<p>{@html v.descriptionNoGenerationalJustice}</p>
		<p class="text-sm">{@html v.descriptionNoGenerationalJusticeSmall}</p>
		<p class="text-sm text-gray-400 mt-2">
			{v.source}:
			{@html v.sourceNoGenerationalJustice}
		</p>
	</div>

	<div>
		<span class="text-6xl font-extralight tracking-tighter">{v.priceGenerationalJustice}€</span>
		<p>{@html v.descriptionGenerationalJustice}</p>
		<p class="text-sm text-gray-400 mt-2">
			{v.source}:
			{@html v.sourceGenerationalJustice}
		</p>
	</div>
</div>
