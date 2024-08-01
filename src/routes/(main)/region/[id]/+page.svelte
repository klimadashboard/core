<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<main class="py-16">
	<div class="container">
		<h1 class="text-3xl">Die Klimakrise in {data.page.name}</h1>

		<section class="my-8">
			<h2>Auf einen Blick</h2>
			<div class="grid md:grid-cols-3 gap-4">
				<div class="bg-gray-50 p-4 rounded">Aktuelle Statistik aus der Region</div>
				<div class="bg-gray-50 p-4 rounded">Aktuelle Statistik aus der Region</div>
				<div class="bg-gray-50 p-4 rounded">Aktuelle Statistik aus der Region</div>
			</div>
		</section>

		<section class="my-8">
			<h2>Herausforderungen</h2>
			<div class="bg-gray-50 h-80" />
		</section>

		<section class="my-8">
			<h2>Auswirkungen</h2>
			<div class="bg-gray-50 h-80" />
		</section>

		<section class="my-8">
			<h2>Lösungen</h2>
			<div class="bg-gray-50 h-80" />
		</section>
	</div>
</main>
