<script>
	import formatNumber from '$lib/stores/formatNumber';
	import { readSingleton } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import Loader from '$lib/components/Loader.svelte';

	const getData = async () => {
		try {
			const directus = getDirectusInstance();
			const donationData = await directus.request(readSingleton('org_donation'));
			const goalAmount = donationData.donationGoal;
			const raisedAmount = donationData.donationStatus;
			return { goalAmount, raisedAmount };
		} catch (error) {
			console.error('Error fetching donation data:', error);
			return { goalAmount: 0, raisedAmount: 0 };
		}
	};

	const promise = getData();
</script>

{#await promise}
	<Loader />
{:then { goalAmount, raisedAmount }}
	<!-- Progress -->
	{#if raisedAmount > 0}
		<div class="rounded-full overflow-hidden bg-gray-100 dark:bg-gray-900 h-10 w-full relative">
			<div
				class="absolute top-0 left-0 bottom-0 bg-green-600 rounded-full"
				style="width: {(raisedAmount / goalAmount) * 100}%"
			>
				<p
					class="text-white absolute left-3 md:left-auto right-2 md:text-lg text-sm leading-none top-1/2 -translate-y-1/2"
				>
					<b>{formatNumber(Math.round(raisedAmount))}€</b> von {formatNumber(goalAmount)}€ gesammelt
				</p>
			</div>
		</div>
	{/if}
{/await}
