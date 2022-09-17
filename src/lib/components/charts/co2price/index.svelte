<script>
    import dayjs from "dayjs";
    import Papa from "papaparse";
    import "dayjs/locale/de-at";
    import formatNumber from "$lib/stores/formatNumber";

    export let v;

    $: dataETS = [];

    Papa.parse(
    'https://data.klimadashboard.org/eu/ets.csv',
    {
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          dataETS = results.data;
        }
      }
    }
    );

    let priceAustria = 30;

    $: priceETS = 0;
    $: dateETS = dayjs();

    $: if(dataETS.length > 0) {
    priceETS = dataETS[dataETS.length - 1][1];
    if(priceETS < 30 || priceETS > 200) {
      priceETS = undefined;
    }
    dateETS = dayjs(dataETS[dataETS.length - 1][0]).format('D.M.YYYY; HH:mm');
    }

    let priceNoGenerationalJustice = 201;
    let priceGenerationalJustice = 698;
</script>

<div class="grid sm:grid-cols-2 gap-4">
    <div>
    <span class="text-6xl font-extralight tracking-tighter">{formatNumber(priceAustria)}€</span>
    <p>{@html v.descriptionAustria.replace("glossary_nonETSPrice","<span class='glossary-label' onclick=showGlossary('nonETSPrice')></span>")}</p>
    <p class="text-sm text-gray-400 mt-2">{v.source}: <a href="https://www.parlament.gv.at/PAKT/VHG/XXVII/ME/ME_00158/" class="underline">{v.sourceAustria}</a></p>
    </div>

    <div>
    <span class="text-6xl font-extralight tracking-tighter">{formatNumber(priceETS)}€</span>
    <p>{@html v.descriptionETS.replace("date", dateETS).replace("glossary_ETSPrice", "<span class='glossary-label' onclick=showGlossary('ETSPrice')></span>")}</p>
    <p class="text-sm text-gray-400 mt-2">{v.source}: <a href="https://tradingeconomics.com/commodity/carbon" class="underline">Trading Economics</a></p>
    </div>

    <div>
    <span class="text-6xl font-extralight tracking-tighter">{formatNumber(priceNoGenerationalJustice)}€</span>
    <p>{v.descriptionNoGenerationalJustice}</p>
    <p class="text-sm">{v.descriptionNoGenerationalJusticeSmall}</p>
    <p class="text-sm text-gray-400 mt-2">{v.source}: <a href="https://www.umweltbundesamt.de/bild/tab-uba-empfehlung-zu-den-klimakosten" class="underline">Umweltbundesamt.de</a></p>
    </div>

    <div>
      <span class="text-6xl font-extralight tracking-tighter">{formatNumber(priceGenerationalJustice)}€</span>
      <p>{v.descriptionGenerationalJustice}</p>
      <p class="text-sm text-gray-400 mt-2">{v.source}: <a href="https://www.umweltbundesamt.de/bild/tab-uba-empfehlung-zu-den-klimakosten" class="underline">Umweltbundesamt.de</a></p>
      </div>
</div>