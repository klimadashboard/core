<script>
	import dayjs from 'dayjs';
	export let data;

	const formatAmount = (value) => {
		const sign = value < 0 ? '-' : '';
		const abs = Math.abs(value);
		const formatted = abs
			.toFixed(2)
			.replace('.', ',')
			.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		return `${sign}${formatted}€`;
	};

	// Calculate total incoming and outgoing for a specific year
	const getYearTotals = (year) => {
		let incoming = 0;
		let outgoing = 0;

		const yearData = data.byYear[year];
		if (yearData?.totalsByAccount) {
			yearData.totalsByAccount.forEach((acc) => {
				acc.items.forEach((item) => {
					if (item.amount > 0) {
						incoming += item.amount;
					} else {
						outgoing += item.amount;
					}
				});
			});
		}

		return { incoming, outgoing, net: incoming + outgoing };
	};
</script>

<div class="max-w-3xl mx-auto p-4 py-16">
	<h1 class="text-4xl mb-4 text-balance">
		<a href="/">
			<img src="/logo.svg" class="inline w-8 rounded -translate-y-1" alt="Klimadashboard" />
		</a>
		Open Finance
	</h1>
	<p class="text-lg">
		{@html data.intro}
	</p>

	{#each data.years as y}
		{@const totals = getYearTotals(y.year)}
		<div class="mt-8" id={y.toString()}>
			<h2 class="text-4xl font-light">{y.year}</h2>
			{#if y.text}
				<p class="text-lg mt-2">{@html y.text}</p>
			{/if}
			{#if data.byYear[y.year].totalsByAccount.length > 0 && y.year >= 2025}
				<!-- Year Summary -->
				<div class="mt-4 p-4 bg-gray-50 rounded-lg">
					<div class="grid grid-cols-3 gap-4 text-lg">
						<div>
							<p class="text-sm opacity-60">Einnahmen</p>
							<p class="tabular-nums text-green-600 font-medium">{formatAmount(totals.incoming)}</p>
						</div>
						<div>
							<p class="text-sm opacity-60">Ausgaben</p>
							<p class="tabular-nums text-red-600 font-medium">{formatAmount(totals.outgoing)}</p>
						</div>
						<div>
							<p class="text-sm opacity-60">Saldo</p>
							<p
								class="tabular-nums font-medium {totals.net > 0
									? 'text-green-600'
									: 'text-red-600'}"
							>
								{formatAmount(totals.net)}
							</p>
						</div>
					</div>
				</div>

				<ul class="text-lg mt-4">
					{#each data.byYear[y.year].totalsByAccount as acc}
						<li class="mb-4">
							<details class="block group">
								<summary
									class="w-full border-b border-current/10 py-2 cursor-pointer hover:bg-gray-50 hover:border-current/20 transition-colors px-2 mx-auto"
								>
									<div class="flex">
										<p class="group-hover:text-gray-900">{acc.accountName}</p>
										<p
											class="tabular-nums ml-auto text-right {acc.total > 0
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{formatAmount(acc.total)}
										</p>
									</div>
								</summary>
								<ul class="tabular-nums mt-2 opacity-80">
									{#each acc.items as it}
										<li class="flex even:bg-black/5 leading-snug py-1 text-balance px-2">
											<p>{dayjs(it.date).format('DD.MM.YYYY')} | {it.label}</p>
											<p
												class="tabular-nums ml-auto text-right {it.amount > 0
													? 'text-green-600'
													: 'text-red-600'}"
											>
												{formatAmount(it.amount)}
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
	summary::-webkit-details-marker {
		display: none;
	}
	summary {
		list-style: none;
	}
</style>
