<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readSingleton } from '@directus/sdk';

	const getData = async () => {
		const directus = getDirectusInstance();

		try {
			const response = await directus.request(readSingleton('org_finance'));
			const data = response.data;
			const donors = response.donors;

			console.log(data);
			console.log(donors);

			return { data, donors };
		} catch (error) {
			console.error(error);
		}
	};

	$: promise = getData();

	$: formatValue = (value) => {
		return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	};
</script>

{#snippet table(items, title)}
	<div>
		<h3 class="text-xl font-bold">{title}</h3>
		<ul>
			{#each items as item}
				<li>{item.label}: <span class="ml-auto">{formatValue(item.value)}</span></li>
			{/each}
			<li class="font-bold">Gesamt: {formatValue(items.reduce((a, b) => a + b.value, 0))}</li>
		</ul>
	</div>
{/snippet}

{#await promise then { data, donors }}
	<div class="container my-8">
		<h1 class="text-4xl font-bold">Finanzen</h1>
		<p class="text-lg">
			Der Verein Klimadashboard berichtet transparent, wie wir unser Geld verdienen und wofür wir
			Geld ausgeben.
		</p>

		<div class="grid md:grid-cols-3">
			<a class="" href="#years">Jahre</a>
			<a class="" href="#income">Geldgeber:innen</a>
			<a class="" href="#staff">Personalkosten</a>
		</div>

		{#each data as item}
			<div class="mt-8" id="years">
				<div class="flex items-end gap-2">
					<h2 class="text-2xl font-bold">{item.year}</h2>
					<p class="text-lg">
						{item.inProgress ? 'vorläufige Daten' : 'abschließende Daten'} bis {item.update}
					</p>
				</div>
				<div class="grid grid-cols-2 mt-2">
					<div class="text-green-900">
						{@render table(item.income, 'Einnahmen')}
					</div>
					<div class="text-red-900">
						{@render table(item.expenses, 'Ausgaben')}
					</div>
				</div>
			</div>
		{/each}

		<div id="income" class="pt-16">
			<h2 class="text-2xl font-bold">Geldgeber:innen</h2>
			<p class="text-lg">
				Von folgenden Personen, Organisationen und Fördergeber:innen haben wir 1.000€ oder mehr
				erhalten. Das Klimadashboard ist stets inhaltlich unabhängig und es gibt keine redaktionelle
				Mitsprache durch Geldgeber:innen.
			</p>
			<ul class="mt-4">
				{#each donors as donor}
					<li>{donor.name}: <span class="ml-auto">{formatValue(donor.value)}</span></li>
				{/each}
			</ul>
		</div>
		<div id="staff"></div>
	</div>
{/await}

<style>
	@import 'tailwindcss';
	li {
		@apply py-2 border-t border-current/20;
	}
</style>
