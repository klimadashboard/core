<script>
	import Papa from 'papaparse';
	import UsageChart from '$lib/components/charts/custom/fossilEnergy/UsageChart.svelte';
	import HistoricalUsage from '$lib/components/charts/custom/fossilEnergy/HistoricalUsage.svelte';
	import RegionalUsage from '$lib/components/charts/custom/fossilEnergy/RegionalUsage.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import UnitExplainer from '$lib/components/charts/custom/fossilEnergy/UnitExplainer.svelte';

	export let selectedSource = 'gas';

	const textDict = { oil: 'Öl', gas: 'Erdgas', coal: 'Kohle' };

	let dataUsage;
	let labels = [
		{
			key: 'raumklimaUndWarmwasser',
			label: 'Raumklima und Warmwasser'
		},
		{
			key: 'prozesswaermeKleiner200Grad',
			label: 'Prozesswärme < 200°C'
		},
		{
			key: 'prozesswaermeGroesser200Grad',
			label: 'Prozesswärme > 200°C'
		},
		{
			key: 'standmotoren',
			label: 'Standmotoren'
		},
		{
			key: 'verkehr',
			label: 'Verkehr'
		},
		{
			key: 'beleuchtungUndEdv',
			label: 'Beleuchtung & EDV'
		},
		{
			key: 'elektrochemie',
			label: 'Elektrochemie'
		}
	];

	let texts = [
		{
			key: 'gas',
			eyebrow: 'Bruttoinlandsverbrauch',
			heading: 'Die Industrie verbraucht das meiste Erdgas.',
			text: 'Hier ist der Erdgas-Gesamtverbrauch, auch Bruttoinlandsverbrauch genannt, innerhalb eines Jahres dargestellt.',
			faq: [
				{
					question: 'Wofür wird Erdgas verwendet?',
					answer:
						'Erdgas wird in der Industrie, zum Heizen von Gebäuden oder zur Stromerzeugung eingesetzt. In der Regel wird Erdgas verbrannt, um Wärme zu erzeugen wodurch klimaschädliches CO₂ entsteht. Erdgas besteht hauptsächlich aus Methan und wird auch als chemischer Grundstoff für die Produktion von Gütern verwendet.'
				},
				{
					question: 'Was sind klimafreundliche Alternativen?',
					answer:
						"Wärmepumpen könnten Erdgas heute schon bei vielen Anwendungen ersetzen, vor allem beim Heizen von Gebäuden oder in der Industrie, gerade bei Industrieprozessen mit Temperaturen <160°C. Wärmepumpen funktionieren wie ein umgekehrter Kühlschrank und entnehmen der Umgebung Wärme und führen sie dem Gebäude oder dem Prozess zu. Für ihren Betrieb brauchen sie nur geringe Mengen an elektrischen Strom, der leicht aus erneuerbaren Energien erzeugt werden kann. Damit Österreich bis 2030 Strom ausschließlich zu 100% aus erneuerbaren Quellen gewinnen kann, wurde von der Austrian Energy Agency (AEA) folgende Werte für den Zubau berechnet: <ul class='my-2'><li>+11 TWh Photovoltaik </li> <li>+10TWh Windkraft</li> <li>+5 TWh Wasserkraft</li> <li>+1 TWh Wärmekraft/ Biomasse </li></ul>Quelle: <br> <a href='https://www.energyagency.at/aktuelles-presse/presse/detail/artikel/bund-und-laender-koennen-ihre-klimaziele-nur-in-enger-zusammenarbeit-erreichen.html?no_cache=1' class='underline'>AEA Studie</a>."
				},
				{
					question: 'Wie hoch ist der gesamte Erdgasverbrauch?',
					answer:
						'Diese Menge wird durch den Bruttoinlandsverbrauch (BIV) angegeben. Im Jahr 2020 lag der Bruttoinlandsverbrauch bei 84,7 Terrawattstunden (TWh).'
				}
			],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>. ",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		},
		{
			key: 'oil',
			eyebrow: 'Wo wird Österreichs Erdöl eingesetzt?',
			heading: 'Der Großteil des Öls wird im Verkehrssektor verbrannt.',
			text: 'In allen Bundesländern verbraucht der Verkehrssektor am meisten Öl. Alle Bundesländer außer Wien haben zusätzlich noch einen hohen Anteil an Öl, der zum Heizen von Gebäuden verwendet wird.',
			faq: [],
			data: "Datenquelle -<br> Energiedaten: <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a> In dem Diagramm sind folgende Produkte als Öl zusammengefasst:",
			data_readmore:
				'Erdöl (Rohöl & NGL), sonst. Raffinerieeinsatz, Benzin, Petroleum, Diesel, Gasöl für Heizzwecke, Heizöl, Flüssiggas (LPG) &Sonstige Produkte d. Erdölverarbeitung. Die Prozentzahlen beziehen sich auf den Bruttoinlandsverbrauch der ausgewählten Region.',
			source: ''
		},
		{
			key: 'coal',
			eyebrow: 'Wo wird Kohle in Österreich verbraucht?',
			heading: 'Kohle wird vorallem in Oberösterreichs Industrie verbraucht.',
			text: 'Beim regionalen Vergleich muss darauf geachtet werden, dass nur noch bestimmte Industrien Kohle einsetzten. So hat Oberösterreich wegen dem dort sitzendem Stahlkonzern Voestalpine einen enorm hohen Kohle-Verbrauch. In der Steiermark war bis April 2020 noch ein Steinkohlekraftwerk für die Stromerzeugung in Betrieb.',
			faq: [],
			text_more:
				"Bei der Stahlherstellung wird im Hochofen Luft, Koks und Eisenerz eingesetzt. Durch die Verbrennungsreaktion von Koks und Sauerstoff entsteht eine enorme Hitze. Diese Hitze ist notwendig, damit das Eisenerz seinen enthaltenden Sauerstoff abgibt und reines Eisen zurückbleibt. Bei der Verbrennung entsteht wiederum viel CO₂, weshalb die Stahlherstellung mit Kohle klimaschädlich ist. Mittlerweile gibt es Vorhaben, das Koks durch Wasserstoff zu ersetzten. Bei der Reaktion von Wasserstoff und Sauerstoff entsteht auch die nötige Temperatur. Als Abfallprodukt fällt nur Wasser an anstatt CO₂. Wichtig ist dabei, dass der eingesetzte Wasserstoff selber aus erneuerbaren Energien hergestellt wurde, was auch als 'grüner Wasserstoff' bezeichnet wird.",
			data: "Datenquelle -<br> Energiedaten: <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a> <br>Österreichs letztes Kohlekraftwerk: <a href='https://steiermark.orf.at/stories/3044465/' class='underline'>ORF Steiermark</a>. In dem Diagramm sind Steinkohle, Braunkohle, Braunkohle-Briketts & Koks als Kohle zusammengefasst."
		}
	];

	$: Papa.parse(
		'https://data.klimadashboard.org/at/energy/fossil/' + selectedSource + '_usage_twh.csv',
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataUsage = results.data;
				}
			}
		}
	);

	let dataUsageDetailedCategories;

	$: Papa.parse(
		'https://data.klimadashboard.org/at/energy/fossil/NEA_alle_Bundeslaender_und_Austria_ab1999_GWh.csv',
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataUsageDetailedCategories = results.data;
				}
			}
		}
	);

	$: textSource = textDict[selectedSource];
	$: selectedYear = 2023;
	$: selectedRegion = 'austria';
	$: showAbsolute = false;

	$: subgroupLabels =
		selectedSource == 'oil'
			? [
					'Petrolkoks',
					'Heizöl',
					'Gasöl für Heizzwecke',
					'Diesel',
					'Benzin',
					'Petroleum',
					'Flüssiggas'
				]
			: ['Steinkohle', 'Braunkohle', 'Koks'];

	$: showLabelForSubGroup = function (key) {
		var allKeys = [];
		for (var i = 0; i < dataUsageDetailedCategoriesDataset.length; i++) {
			allKeys.push(dataUsageDetailedCategoriesDataset[i].energietraeger_untergruppe);
		}
		var keys = [...new Set(allKeys)];

		if (selectedSource == 'gas') {
			return '';
		} else {
			return subgroupLabels[keys.indexOf(key)] + ' / ';
		}
	};

	$: dataUsageDetailedCategoriesDataset = dataUsageDetailedCategories?.filter(
		(d) =>
			d.region == selectedRegion &&
			d.year == selectedYear &&
			d.energietraeger_gruppe == selectedSource
	);

	$: newDataForSelectedYear = [];

	$: if (dataUsage) {
		const filteredDataUsage = dataUsage.filter(
			(d) => d.region == selectedRegion && d.year == selectedYear
		)[0];
		const filteredDataUsageValues = Object.values(filteredDataUsage);
		const filteredDataUsageKeys = Object.keys(filteredDataUsage);
		for (let i = 0; i < filteredDataUsage.length; i++) {
			newDataForSelectedYear.push({
				key: filteredDataUsageKeys[i],
				total: filteredDataUsageValues[i]
			});
		}
	}

	$: dataForSelectedYear = dataUsage
		?.filter((d) => d.region == selectedRegion && d.year == selectedYear)
		.map((d) => {
			var children = [
				{
					key: 'energeticUsage',
					label: 'Energetischer Endverbrauch',
					total: d.energetischerEndverbrauch || 0,
					color: '#8898AA',
					glossary: 'energeticUsage',
					children: [
						{
							key: 'agriculture',
							label: 'Landwirtschaft',
							total: d.energeEndverbrauch_landwirtschaft || 0,
							color: '#65987D',
							childrenUnit: 'GWh',
							children: dataUsageDetailedCategoriesDataset?.map((e) => {
								return {
									label:
										showLabelForSubGroup(e.energietraeger_untergruppe) +
											labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
										e.nutzenergiekategorie,
									total: e.landwirtschaft
								};
							})
						},
						{
							key: 'industry',
							label: 'Industrie',
							total: d.energeEndverbrauch_industrie_summe || 0,
							color: '#585B74',
							children: [
								{
									key: 'iron',
									label: 'Eisen- und Stahlerzeugung',
									total: d.energeEndverbrauch_industrie_EisenStahlerzeugung || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_eisenStahlerzeugung
										};
									})
								},
								{
									key: 'chemicals',
									label: 'Chemie und Petrochemie',
									total: d.energeEndverbrauch_industrie_chemiePetrochemie || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_chemiePetrochemie
										};
									})
								},
								{
									key: 'notIronMetal',
									label: 'Nicht Eisen und Metalle',
									total: d.energeEndverbrauch_industrie_nichtEisenMetalle || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_nichtEisenMetalle
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_steineErdenGlas',
									label: 'Steine, Erden und Glas',
									total: d.energeEndverbrauch_industrie_steineErdenGlas || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_steineErdenGlas
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_fahrzeugbau',
									label: 'Fahrzeugbau',
									total: d.energeEndverbrauch_industrie_fahrzeugbau || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_fahrzeugbau
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_maschinenbau',
									label: 'Maschinenbau',
									total: d.energeEndverbrauch_industrie_maschinenbau || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_maschinenbau
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_bergbau',
									label: 'Bergbau',
									total: d.energeEndverbrauch_industrie_bergbau || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_bergbau
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_nahrungsGenussmittelTabak',
									label: 'Nahrungs, Genussmittel, Tabak',
									total: d.energeEndverbrauch_industrie_nahrungsGenussmittelTabak || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_nahrungsGenußmittelTabak
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_papierDruck',
									label: 'Papier und Druck',
									total: d.energeEndverbrauch_industrie_papierDruck || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_papierDruck
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_holzverarbeitung',
									label: 'Holzverarbeitung',
									total: d.energeEndverbrauch_industrie_holzverarbeitung || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_holzverarbeitung
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_bau',
									label: 'Bau',
									total: d.energeEndverbrauch_industrie_bau || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_bau
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_textilLeder',
									label: 'Textil und Leder',
									total: d.energeEndverbrauch_industrie_textilLeder || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_textilLeder
										};
									})
								},
								{
									key: 'energeEndverbrauch_industrie_sonstProduzierenderBereich',
									label: 'Sonst. produzierender Bereich',
									total: d.energeEndverbrauch_industrie_sonstProduzierenderBereich || 0,
									color: '#585B74',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.industrie_sonstProduzierenderBereich
										};
									})
								}
							]
						},
						{
							key: 'households',
							label: 'Private Haushalte',
							total: d.energeEndverbrauch_privateHaushalte || 0,
							color: '#4880A8',
							childrenUnit: 'GWh',
							children: dataUsageDetailedCategoriesDataset?.map((e) => {
								return {
									label:
										showLabelForSubGroup(e.energietraeger_untergruppe) +
										(e.nutzenergiekategorie == 'prozesswaermeGroesser200Grad'
											? 'Kochen'
											: labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie),
									total: e.privateHaushalte || 0
								};
							})
						},
						{
							key: 'mobility',
							label: 'Verkehr',
							total: d.energeEndverbrauch_verkehr_summe || 0,
							color: '#F5AF4A',
							children: [
								{
									key: 'eisenbahn',
									label: 'Eisenbahn',
									total: d.energeEndverbrauch_verkehr_eisenbahn || 0,
									color: '#f7bf6e',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												showLabelForSubGroup(e.energietraeger_untergruppe) +
													labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.verkehr_eisenbahn || 0
										};
									})
								},
								{
									key: 'energeEndverbrauch_verkehr_sonstigerLandverkehr',
									label: 'Sonstiger Landverkehr (u.a. PKW, LKW)',
									total: d.energeEndverbrauch_verkehr_sonstigerLandverkehr || 0,
									color: '#F5AF4A',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												showLabelForSubGroup(e.energietraeger_untergruppe) +
													labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.verkehr_sonstigerLandverkehr || 0
										};
									})
								},
								{
									key: 'energeEndverbrauch_verkehr_transportInRohrfernleitungen',
									label: 'Transport in Rohrfernleitungen',
									total: d.energeEndverbrauch_verkehr_transportInRohrfernleitungen || 0,
									color: '#F5AF4A',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												showLabelForSubGroup(e.energietraeger_untergruppe) +
													labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.verkehr_transportinRohrfernleitungen || 0
										};
									})
								},
								{
									key: 'energeEndverbrauch_verkehr_binnenschiffahrt',
									label: 'Binnenschifffahrt',
									total: d.energeEndverbrauch_verkehr_binnenschiffahrt || 0,
									color: '#F5AF4A',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												showLabelForSubGroup(e.energietraeger_untergruppe) +
													labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.verkehr_binnenschiffahrt || 0
										};
									})
								},
								{
									key: 'energeEndverbrauch_verkehr_flugverkehr',
									label: 'Luftverkehr',
									total: d.energeEndverbrauch_verkehr_flugverkehr || 0,
									color: '#F5AF4A',
									children: dataUsageDetailedCategoriesDataset?.map((e) => {
										return {
											label:
												showLabelForSubGroup(e.energietraeger_untergruppe) +
													labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
												e.nutzenergiekategorie,
											total: e.verkehr_flugverkehr || 0
										};
									})
								}
							]
						},
						{
							key: 'services',
							label: 'Öffentliche und private Dienstleistungen',
							total: d.energeEndverbrauch_oeffentUndPrivDienstleistungen || 0,
							color: '#BD5737',
							childrenUnit: 'GWh',
							children: dataUsageDetailedCategoriesDataset?.map((e) => {
								return {
									label:
										labels.find((d) => d.key == e.nutzenergiekategorie)?.label ||
										e.nutzenergiekategorie,
									total: e.oeffentUndPrivDienstleistungen || 0
								};
							})
						}
					]
				},
				{
					key: 'sectorEnergy',
					label: 'Eigenverbrauch des Sektors Energie',
					total: d.verbrauchDesSektorsEnergie || 0,
					description:
						'Der Verbrauch des Sektors Energie gibt den Energieeinsatz an, der in Anlagen zur Energiegewinnung (Erdöl- u. Erdgasföderung), zur Energieumwandlung (zB Raffinerien, Hochöfen) oder in Anlagen der Energieversorgung, inklusive der Stromerzeugung verwendet wird.',
					color: '#BD3737',
					children: [
						{
							key: 'sectorEnergy_sub',
							label: 'Eigenverbrauch des Sektors Energie',
							total: d.verbrauchDesSektorsEnergie || 0,
							color: '#B3504C',
							description:
								'Der Verbrauch des Sektors Energie gibt den Energieeinsatz an, der in Anlagen zur Energiegewinnung (Erdöl- u. Erdgasföderung), zur Energieumwandlung (zB Raffinerien, Hochöfen) oder in Anlagen der Energieversorgung, inklusive der Stromerzeugung verwendet wird.',
							children: [
								{
									key: 'productionOilGas',
									label: 'Gewinnung von Erdöl und Erdgas',
									total: d.verbrauchDesSektorsEnergie_gewinnungErdoelErdgas || 0
								},
								{
									key: 'coalMining',
									label: 'Kohlenbergbau',
									total: d.verbrauchDesSektorsEnergie_kohlenbergbau || 0
								},
								{
									key: 'oilProcessing',
									label: 'Mineralölverarbeitung',
									total: d.verbrauchDesSektorsEnergie_mineralölverarbeitung || 0
								},
								{
									key: 'cokemaking',
									label: 'Kokerei',
									total: d.verbrauchDesSektorsEnergie_kokerei || 0
								},
								{
									key: 'blastFurnace',
									label: 'Hochofen',
									total: d.verbrauchDesSektorsEnergie_hochofen || 0
								},
								{
									key: 'energySupply',
									label: 'Energieversorgung',
									total: d.verbrauchDesSektorsEnergie_energieversorgung || 0
								}
							]
						}
					]
				},
				{
					key: 'transport',
					label: 'Transportverluste',
					total: d.transportverluste || 0,
					color: '#8C976C',
					children: [
						{
							key: 'transport_sub',
							label: 'Transportverluste',
							total: d.transportverluste || 0,
							color: '#8C976C'
						}
					]
				},
				{
					key: 'nonEnergeticUsage',
					label: 'Nicht-energetischer Verbrauch',
					total: d.nichtenergetischerVerbrauch || 0,
					description:
						'Der Nichtenergetische Verbrauch gibt an, welche Menge des Energieträgers als stofflicher Einsatz für die Herstellung von Produkten verwendet wurde, anstatt den Energieträger in Wärmeenergie oder elektrische Energie umzuwandeln. Beispiele wären, dass der Energieträger Erdgas als ‘Rohstoff’ für die Herstellung von Dünger genutzt wird, oder der Energieträger Erdöl für Kunststoffe.',
					color: '#C4C4C4',
					children: [
						{
							key: 'nonEnergeticUsage_sub',
							label: 'Nicht-energetischer Verbrauch',
							total: d.nichtenergetischerVerbrauch || 0,
							description:
								'Der Nichtenergetische Verbrauch gibt an, welche Menge des Energieträgers als stofflicher Einsatz für die Herstellung von Produkten verwendet wurde, anstatt den Energieträger in Wärmeenergie oder elektrische Energie umzuwandeln. Beispiele wären, dass der Energieträger Erdgas als ‘Rohstoff’ für die Herstellung von Dünger genutzt wird, oder der Energieträger Erdöl für Kunststoffe.',
							color: '#8292AA'
						}
					]
				}
			];

			if (selectedSource == 'gas') {
				children.push(
					{
						key: 'conversion',
						label: 'Umwandlungseinsatz',
						total: d.umwandlungseinsatz || 0,
						color: '#C09FB4',
						glossary: 'conversion',
						children: [
							{
								key: 'refineries',
								total: d['umwandlungseinsatz_raffinerie'] || 0,
								label: 'Raffinierie',
								color: '#AE86A0'
							},
							{
								key: 'gasGeneration',
								total: d['umwandlungseinsatz_gaserzeugung'] || 0,
								label: 'Gaserzeugung',
								color: '#AE86A0'
							},
							{
								key: 'coke',
								total: d['umwandlungseinsatz_kokerei'] || 0,
								label: 'Kokerei',
								color: '#BD99A2'
							},
							{
								key: 'hochofen',
								total: d['umwandlungseinsatz_hochofen'] || 0,
								label: 'Hochofen',
								color: '#BC6890'
							},
							{
								key: 'powerPlants',
								total: d['umwandlungseinsatz_kraftwerke'] || 0,
								label: 'Kraftwerke',
								color: '#AE86A0',
								description:
									'Der Umwandlungseinsatz in Kraftwerken gibt die Energiemenge eines Energieträgers (Kohle, Öl, Gas oder Biomasse) an, die als Brennstoff für die Erzeugung von elektrischen Strom verwendet wird. Der Einsatz kann unterteilt werden in “Unternehmenseigene Anlagen” (UEA) und in Kraftwerksanlagen der “Energieversorgungsunternehmen” (EVU).',
								children: [
									{
										key: 'powerPlants_evu',
										label: 'Energieversorgungsunternehmen',
										total: d['umwandlungseinsatz_kraftwerke_evu'] || 0
									},
									{
										key: 'powerPlants_uea',
										label: 'Unternehmenseigene Anlagen',
										total: d['umwandlungseinsatz_kraftwerke_uea'] || 0
									}
								]
							},
							{
								key: 'cwk',
								total: d['umwandlungseinsatz_kwk_anlagen'] || 0,
								label: 'KWK-Anlagen',
								color: '#7F6284',
								description:
									'Der Umwandlungseinsatz eines Energieträgers in Kraft-Wärme-Kopplungsanlagen gibt die Menge eines Energieträgers an, die für die Erzeugung von Wärme verwendet wurde. Der Einsatz kann unterteilt werden in “Unternehmenseigene Anlagen” (UEA) und in Anlagen der “Energieversorgungsunternehmen” (EVU).',
								children: [
									{
										key: 'cwk_evu',
										label: 'Energieversorgungsunternehmen',
										total: d['umwandlungseinsatz_kwk_anlagen_evu'] || 0
									},
									{
										key: 'cwk_uea',
										label: 'Unternehmenseigene Anlagen',
										total: d['umwandlungseinsatz_kwk_anlagen_uea'] || 0
									}
								]
							},
							{
								key: 'heating',
								label: 'Heizwerke',
								color: '#BD99A2',
								total: d.umwandlungseinsatz_heizwerke || 0,
								description:
									'Der Umwandlungseinsatz eines Energieträgers in Heizkraftwerken gibt die Menge eines Energieträgers an, die für die Erzeugung von Wärme verwendet wurde. Der Einsatz kann unterteilt werden in “Unternehmenseigene Anlagen” (UEA) und in Anlagen der “Energieversorgungsunternehmen” (EVU).',
								children: [
									{
										key: 'heating_evu',
										label: 'Energieversorgungsunternehmen',
										total: d['umwandlungseinsatz_heizwerke_evu'] || 0
									},
									{
										key: 'heating_uea',
										label: 'Unternehmenseigene Anlagen',
										total: d['umwandlungseinsatz_heizwerke_uea'] || 0
									}
								]
							}
						]
					},
					{
						key: 'umwandlungsausstoss',
						label: 'Umwandlungsausstoss',
						total: d.umwandlungsausstoss || 0,
						color: '#D6769E',
						children: [
							{
								key: 'umwandlungsausstoss_sub',
								label: 'Umwandlungsausstoss',
								total: d.umwandlungsausstoss || 0,
								color: '#D6769E'
							}
						]
					}
				);
			} else {
				children.push({
					key: 'conversionLosses',
					label: 'Umwandlungsverlust',
					description:
						'Der Umwandlungsverlust gibt den Verlust bei der Umwandlung eines Energieträgers in eine anderen an.',
					total: d.umwandlungseinsatz - d.umwandlungsausstoss || 0,
					color: '#C09FB4',
					children: [
						{
							key: 'conversionLosses_sub',
							label: 'Umwandlungsverlust',
							description:
								'Der Umwandlungsverlust gibt den Verlust bei der Umwandlung eines Energieträgers in eine anderen an.',
							total: d.umwandlungseinsatz - d.umwandlungsausstoss || 0,
							color: '#C09FB4'
						}
					]
				});
			}

			var array = [
				{
					key: 'bruttoinlandsverbrauch',
					label: 'Bruttoinlandsverbrauch',
					color: '#AEA8A6',
					total: d.bruttoinlandsverbrauch_TWh,
					children: children
				}
			];

			return array[0];
		});

	$: max = showAbsolute
		? dataUsage
				?.filter((d) => d.region == selectedRegion)
				.reduce(function (max, arr) {
					return max >= arr['bruttoinlandsverbrauch_TWh'] ? max : arr['bruttoinlandsverbrauch_TWh'];
				}, -Infinity)
		: dataUsage?.filter((d) => d.region == selectedRegion && d.year == selectedYear)[0]
				.bruttoinlandsverbrauch_TWh;

	$: minYear =
		selectedSource == 'gas' ? 1990 : dataUsage?.filter((d) => d.region == selectedRegion)[0].year;

	$: dataUsage = dataUsage;

	$: dataMode = selectedRegion == 'austria' ? 'national' : 'federal';

	$: selectedUnit = 'wattHours';

	const units = [
		{
			key: 'wattHours',
			label: 'Terawattstunden (TWh)',
			icon: null
		},
		{
			key: 'terajoule',
			label: 'Terajoule (TJ)',
			icon: null
		}
	];
</script>

<div class="container">
	<article class="mt-20 pb-16">
		<div class=" relative">
			<div class="absolute top-10 left-0 right-0 border-t-2 border-gray-300" />
			<h2
				class="px-2 mx-auto text-center text-3xl bg-white dark:bg-gray-800 relative z-10 inline-block left-1/2 -translate-x-1/2 translate-y-5"
			>
				Wo wird {textSource} verbraucht?
			</h2>
			<div class="flex justify-center items-start mt-10 mb-8 gap-2">
				<Switch
					type="primary"
					views={units}
					activeView={selectedUnit}
					on:itemClick={(event) => {
						selectedUnit = event.detail;
					}}
				/>
				<button on:mousedown={() => showGlossary('energyUnits')}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-help"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<desc>Download more icon variants from https://tabler-icons.io/i/help</desc>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<circle cx="12" cy="12" r="9" />
						<line x1="12" y1="17" x2="12" y2="17.01" />
						<path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" />
					</svg>
				</button>
			</div>

			<UnitExplainer {selectedUnit} />
		</div>

		<section class="border-l-2 pl-4 md:pl-8 md:pr-4 mt-20 border-gray-300 relative">
			<svg width="16" height="16" class="absolute -bottom-1" style="left: -9px">
				<circle
					cx="8"
					cy="8"
					r="6"
					class="stroke-gray-300 fill-transparent stroke-2 fill-white dark:fill-gray-800"
				/>
			</svg>
			<h3 class="uppercase tracking-wide text-sm font-semibold mb-2">
				{texts.find((t) => t.key == selectedSource)?.eyebrow}
			</h3>

			<h2 class="text-2xl max-w-lg">
				{texts.find((t) => t.key == selectedSource)?.heading}
			</h2>
			<p class="max-w-xl mt-2">
				{@html texts
					.find((t) => t.key == selectedSource)
					?.text.replace(
						'{glossary_grossDomesticConsumption}',
						"<span class='glossary-label' onclick=showGlossary('gas_grossDomesticConsumption')></span>"
					)}
			</p>

			<div class="my-4">
				{#each texts.find((t) => t.key == selectedSource)?.faq as faq, index}
					<details class="my-2">
						<summary class="text-gray-800 dark:text-gray-200 border-b">{faq.question}</summary>
						<p class="max-w-md">{@html faq.answer}</p>
					</details>
				{/each}
			</div>

			<div class="md:flex flex-wrap justify-between items-end">
				<p class="mt-2 text-sm text-gray-400 dark:tex max-w-lg">
					{@html texts.find((t) => t.key == selectedSource)?.data}
				</p>

				<div class="flex gap-4 items-center flex-wrap text-sm">
					<div class="relative dark:text-gray-400">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="absolute pointer-events-none h-full right-2"
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
							<polyline points="8 9 12 5 16 9" />
							<polyline points="16 15 12 19 8 15" />
						</svg>
						<select
							name="selectedRegion"
							bind:value={selectedRegion}
							class="block appearance-none bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-xs"
						>
							<option value="austria">Österreich</option>
							<option value="burgenland">Burgenland</option>
							<option value="steiermark">Steiermark</option>
							<option value="tirol">Tirol</option>
							<option value="vorarlberg">Vorarlberg</option>
							<option value="wien">Wien</option>
							<option value="niederoesterreich">Niederösterreich</option>
							<option value="oberoesterreich">Oberösterreich</option>
							<option value="salzburg">Salzburg</option>
							<option value="kaernten">Kärnten</option>
						</select>
					</div>

					<div class="flex gap-2 items-center">
						<input
							type="range"
							min={minYear}
							max="2023"
							bind:value={selectedYear}
							aria-label="Jahr auswählen"
						/>
						<span>{selectedYear}</span>
					</div>

					<label class="flex gap-2 items-center">
						<input type="checkbox" bind:checked={showAbsolute} />
						<span>Absolute Werte anzeigen?</span>
					</label>
				</div>
			</div>
			{#if dataForSelectedYear}
				<div class="chart-layer w-full mt-4">
					<UsageChart data={dataForSelectedYear} {max} {dataMode} {selectedUnit} />
				</div>
			{/if}

			{#if dataUsage}
				<HistoricalUsage {dataUsage} {selectedSource} {selectedUnit} />

				<RegionalUsage {dataUsage} {selectedSource} {selectedUnit} />
			{/if}
		</section>
	</article>
</div>

<style>
</style>
