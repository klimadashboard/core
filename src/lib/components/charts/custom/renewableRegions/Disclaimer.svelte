<script>
	import formatNumber from '$lib/stores/formatNumber';
	export let region;
	export let ratio;
	export let colors;
	export let selectedEnergy;
	export let updateDate;
</script>

<ul class=" my-4 space-y-2 text-base opacity-80">
	{#if selectedEnergy == 'solar'}
		<li>
			Wir aktualisieren jeden Morgen die Daten. Die letzte Aktualisierung wurde am {updateDate} Uhr durchgeführt.
		</li>
		<li>
			Ein Balkonkraftwerk muss wie jede andere Stromerzeugungsanlage im <a
				href="https://www.marktstammdatenregister.de/MaStR"
				>Marktstammdatenregister der Bundesnetzagentur</a
			> registriert werden. Da dies allerdings nicht nachverfolgt wird, sind viele Balkonkraftwerke wahrscheinlich
			nicht registriert und tauchen in den Daten nicht auf. Die tatsächliche Anzahl an Balkonkraftwerken
			dürfte durch die Dunkelziffer in den meisten Regionen also höher sein.
		</li>
		<li>
			{formatNumber(100 - ratio)}% aller im Marktstammdatenregister registrierten Solaranlagen in {region.name}
			(ausgenommen Balkonkraftwerke) wurden noch nicht abschließend durch den Netzbetreiber geprüft.
			Die tatsächlich installierte Leistung kann demnach variieren.
		</li>
	{:else}
		<li>Die Daten wurden zuletzt am {updateDate} aktualisiert.</li>
		<li>
			In Deutschland gibt es große regionale Unterschiede beim Ausbau der Windenergie: Im Norden
			stehen bereits viele Anlagen, während der Ausbau im Süden noch vergleichsweise langsam
			voranschreitet – teils trotz verfügbarer geeigneter freier Flächen. In dicht bebauten Gebieten
			wie Städten fehlt oft der Platz, in anderen Regionen bisher der politische oder
			gesellschaftliche Rückhalt.
		</li>
		<li>
			Die Grafiken funktionieren besonders gut für Regionen, in denen über viele Jahre hinweg
			regelmäßig Windräder installiert wurden. In Orten mit nur wenigen oder einmaligen Zubaujahren
			erscheinen einzelne Balken oder deutliche Sprünge in der Darstellung – das bildet die Daten
			korrekt ab, kann visuell aber ungewohnt wirken.
		</li>
		<li>
			Im Marktstammdatenregister werden Genehmigungsdaten teilweise überschrieben, wodurch zeitliche
			Verzerrungen entstehen können. Zudem sind einige Windenergieanlagen durch falsche
			Koordinatenangaben falschen Regionen oder sogar Bundesländern zugeordnet. Deshalb verwenden
			wir für die Darstellung korrigierte Daten von <a
				href="https://goal100.org"
				target="_blank"
				class="underline underline-offset-2">Goal100</a
			>, die auf Einträgen aus dem Marktstammdatenregister und Daten des Helmholtz-Zentrums für
			Umweltforschung beruhen.
		</li>
	{/if}
</ul>
