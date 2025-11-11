<script lang="ts">
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';
	export let data: { years: number[]; byYear: Record<number, GroupedResult> };
</script>

<div class="max-w-3xl mx-auto p-4 py-16">
	<h1 class="text-4xl mb-4 text-balance">
		<img src="/logo.svg" class="inline w-8 rounded -translate-y-1" alt="Klimadashboard" />
		Open Finance
	</h1>
	<p class="text-lg">
		Als gemeinnütziger Verein legen wir unsere Einnahmen und Ausgaben transparent offen. Die
		folgenden Daten kommen direkt aus unserer Buchhaltung. Solange Jahre noch nicht abgeschlossen
		sind, kann es zu Verschiebungen und vorläufigen Einträgen kommen, die später korrigiert werden.
	</p>

	{#each data.years as y}
		<div class="mt-8" id={y.toString()}>
			<h2 class="text-4xl font-light">{y}</h2>
			{#if data.byYear[y].totalsByAccount.length > 0}
				<ul class="text-lg mt-4">
					{#each data.byYear[y].totalsByAccount as acc}
						<li class="mb-4">
							<details class="block w-full">
								<summary class="w-full border-b border-current/10 py-2">
									<div class="flex">
										<p>{acc.accountName}</p>
										<p
											class="ml-auto text-right {acc.total > 0 ? 'text-green-600' : 'text-red-600'}"
										>
											{formatNumber(acc.total)}€
										</p>
									</div>
								</summary>

								<ul class="tabular-nums mt-2 opacity-80">
									{#each acc.items as it}
										<li class="flex even:bg-black/5">
											<p class="w-[12ch]">{dayjs(it.date).format('DD.MM.YYYY')}</p>
											<p>{it.label}</p>
											<p
												class="ml-auto text-right {it.amount > 0
													? 'text-green-600'
													: 'text-red-600'}"
											>
												{formatNumber(it.amount)}€
											</p>
										</li>
									{/each}
								</ul>
							</details>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="opacity-80 text-lg mt-4">Keine Daten für dieses Jahr verfügbar.</p>
			{/if}
		</div>
	{/each}

	<h2 class="text-4xl font-light mt-8">2024</h2>
	<p class="text-lg mt-2">
		Im Jahr 2024 betrugen die Einnahmen des Klimadashboards 21.051,19€ (davon 18.836,32€ Spenden und
		2.214,87€ Umsätze). Die Ausgaben betrugen 3.069,05€, wovon 1.878,19€ auf Sachkosten, 1.087,10€
		auf Reisekosten und 103,76€ auf Bankspesen entfallen.
	</p>

	<h2 class="text-4xl font-light mt-8">2023</h2>
	<p class="text-lg mt-2">
		Im Jahr 2023 betrugen die Einnahmen des Klimadashboards 14.513,86€, die Ausgaben beliefen sich
		auf 1.214,64€.
	</p>

	<h2 class="text-4xl font-light mt-8">2022</h2>
	<p class="text-lg mt-2">
		Im Jahr 2022 betrugen die Einnahmen des Vereins 1.614,68€ und die Ausgaben 33,84€. Unser Verein
		wurde am 24.03.2022 ins Vereinsregister eingetragen.
	</p>
</div>

<style>
	summary:before {
		content: '';
	}

	details[open] summary:before {
		content: '';
	}
</style>
