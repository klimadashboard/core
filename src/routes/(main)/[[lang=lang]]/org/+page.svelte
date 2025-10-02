<script>
	import Team from './Team.svelte';
	import Media from './Media.svelte';
</script>

<div class="m-1">
	<div class="max-w-3xl mx-auto mt-8 px-4">
		<h1 class="text-5xl text-center">Wir machen Klimawissenschaft zugänglich. Für alle.</h1>

		<p class="mt-4 text-xl text-center">
			Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
			pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
			mollit anim id est laborum.
		</p>

		<div class="grid md:grid-cols-2 gap-1 mt-8">
			<a href="https://klimadashboard.at" target="_blank" class="bg-gray-100 rounded-2xl p-4">
				<h3 class="text-2xl">Klimadashboard.at</h3>
				<p class="text-lg">Daten und Fakten zur Klimakrise in Österreich</p>
			</a>
			<a href="https://klimadashboard.at" target="_blank" class="bg-gray-100 rounded-2xl p-4">
				<h3 class="text-2xl">Klimadashboard.at</h3>
				<p class="text-lg">Daten und Fakten zur Klimakrise in Österreich</p>
			</a>
			<a
				href="https://emission-tracker.eu"
				target="_blank"
				class="rounded-2xl bg-gray-900 text-white p-3 col-span-2"
			>
				<h3 class="text-2xl">EU Emission Tracker</h3>
				<p class="text-lg">Daten und Fakten zur Klimakrise in der EU</p>
			</a>
		</div>

		<p class="text-xl mt-8 text-center">
			Außerdem sind unsere Visualisierungen Teil des neuen österreichischen Sachstandsberichts,
			TED-Talks und Schulbüchern.
		</p>
	</div>

	<Media />

	<Team />

	<div class="grid grid-cols-3 container my-10 gap-4 text-lg">
		<div>
			<img
				src="https://base.klimadashboard.org/assets/cae5be62-3e2c-4bc4-9867-8013150a69d1"
				class="h-20 mb-2"
			/>
			<p>
				<b>Open Data</b> Wir arbeiten mit anerkannten wissenschaftlichen Institutionen daran, Datensätze
				zugänglich zu machen.
			</p>
		</div>
		<div class="">
			<img
				src="https://base.klimadashboard.org/assets/c21c6aed-9a90-425c-927a-dd9775da7a63"
				class="h-20 mb-2"
			/>
			<div>
				<p>
					<b>Open Finance</b> Unsere Arbeit wird durch ehrenamtliches Engagment und Förderungen, Spenden
					und Aufträge getragen. Die Budgets unserer Projekte und aktuelle Ausgaben und Einnahmen legen
					wir offen.
				</p>
			</div>
		</div>
		<div>
			<img
				src="https://base.klimadashboard.org/assets/36861d61-5344-4857-8930-635798b88656"
				class="h-20 mb-2"
			/>
			<p>
				<b>Open Source</b> Die von uns entwickelte Software steht allen offen – zur Kontrolle, zum Kopieren
				und zum Verbessern.
			</p>
		</div>
	</div>
</div>
