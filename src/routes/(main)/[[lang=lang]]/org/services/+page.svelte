<script>
	let services = [
		{
			title: 'Workshops',
			text: ''
		},
		{
			title: 'Installationen & Ausstellungen',
			text: ''
		},
		{
			title: 'Beratung',
			text: ''
		},
		{
			title: 'Design & Code',
			text: ''
		}
	];
</script>

<div class="container py-20">
	<h1 class="text-4xl font-bold">Angebote</h1>
	<p>
		Neben Klimadashboards für Österreich, Deutschland, die EU und über 13.000 Gemeinden ist das
		interdisziplinäre Team Klimadashboard auch in diesen Bereichen aktiv.
	</p>

	{#each services as service, i}
		<div class="my-10 grid md:grid-cols-2 gap-4">
			<div class="bg-gray-100 h-40 {i % 2 == 0 ? 'order-2' : ''}"></div>
			<div>
				<h2 class="text-2xl font-light">{service.title}</h2>
				<p class="">{service.text}</p>
			</div>
		</div>
	{/each}
</div>
