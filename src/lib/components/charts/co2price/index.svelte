<script>
	import dayjs from 'dayjs';
	import 'dayjs/locale/de-at';
	import formatNumber from '$lib/stores/formatNumber';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let v;

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('carbon_prices', {
				filter: {
					type: {
						_eq: 'ETS'
					}
				},
				sort: ['-date'],
				limit: 1
			})
		);
		return data;
	}

	$: promise = getData();
</script>

{#await promise then dataETS}
	<div class="grid sm:grid-cols-2 gap-4">
		<div>
			<span class="text-6xl font-extralight tracking-tighter">{v.nationalPrice}€</span>
			<p>{@html v.nationalPriceDescription}</p>
			<p class="text-sm text-gray-400 mt-2">
				{v.source}:
				{@html v.nationalPriceSource}
			</p>
		</div>

		<div>
			<span class="text-6xl font-extralight tracking-tighter"
				>{formatNumber(dataETS[0].value)}€</span
			>
			<p>{@html v.descriptionETS.replace('{date}', dayjs(dataETS[0].date).format('D.M.YYYY'))}</p>
			<p class="text-sm text-gray-400 mt-2">
				{v.source}:
				{@html v.sourceETS}
			</p>
		</div>

		<div>
			<span class="text-6xl font-extralight tracking-tighter">{v.priceNoGenerationalJustice}€</span>
			<p>{@html v.descriptionNoGenerationalJustice}</p>
			<p class="text-sm">{@html v.descriptionNoGenerationalJusticeSmall}</p>
			<p class="text-sm text-gray-400 mt-2">
				{v.source}:
				{@html v.sourceNoGenerationalJustice}
			</p>
		</div>

		<div>
			<span class="text-6xl font-extralight tracking-tighter">{v.priceGenerationalJustice}€</span>
			<p>{@html v.descriptionGenerationalJustice}</p>
			<p class="text-sm text-gray-400 mt-2">
				{v.source}:
				{@html v.sourceGenerationalJustice}
			</p>
		</div>
	</div>
{/await}
