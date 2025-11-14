<script>
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';
	export let data;
</script>

<div class="max-w-3xl mx-auto p-4 py-16">
	<h1 class="text-4xl mb-4 text-balance">
		<a href="/"
			><img src="/logo.svg" class="inline w-8 rounded -translate-y-1" alt="Klimadashboard" /></a
		>
		Open Finance
	</h1>
	<p class="text-lg">
		{@html data.intro}
	</p>

	{#each data.years as y}
		<div class="mt-8" id={y.toString()}>
			<h2 class="text-4xl font-light">{y.year}</h2>
			{#if y.text}
				<p class="text-lg mt-2">{@html y.text}</p>
			{/if}
			{#if data.byYear[y.year].totalsByAccount.length > 0 && y.year >= 2025}
				<ul class="text-lg mt-4">
					{#each data.byYear[y.year].totalsByAccount as acc}
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
				<p class="opacity-80 text-lg mt-4">
					Keine detaillierte Aufschlüsselung für dieses Jahr verfügbar.
				</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	summary:before {
		content: '';
	}

	details[open] summary:before {
		content: '';
	}
</style>
