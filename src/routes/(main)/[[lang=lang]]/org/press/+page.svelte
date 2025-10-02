<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import dayjs from 'dayjs';

	let totalReportsRounded = 0;
	let totalMediums = 0;

	$: getData = async () => {
		const directus = getDirectusInstance();
		const data = await directus.request(
			readItems('org_press_reports', {
				fields: ['*.*'],
				limit: -1
			})
		);

		console.log(data);

		// total number of reports, rounded down to nearest 10
		totalReportsRounded = Math.floor(data.length / 10) * 10;

		// count unique mediums
		const mediums = new Set(data.map((item) => item.medium?.name).filter(Boolean));
		totalMediums = mediums.size;

		return data;
	};

	$: promise = getData();
</script>

<div class="container my-8">
	<h1 class="text-4xl font-bold">Presse</h1>
	<div class="text-lg">
		<p class="mt-4">
			Über {totalReportsRounded} Berichte in {totalMediums} nationalen und regionalen Medien berichten
			über die Grafiken, Daten und Projekte des Klimadashboards.
		</p>
	</div>

	<div class="grid md:grid-cols-2 text-lg gap-4 my-4">
		<a
			href="https://drive.google.com/drive/folders/11b5qKmPABoxtRbo68F5V3shaJj6TOp3n?usp=share_link"
			>Press Kit mit Texten und Grafiken zur freien Verwendung</a
		>

		<a href="mailto:team@klimadashboard.org"
			>Unser Team steht gerne unter team@klimadashboard.org zur Verfügung.</a
		>
	</div>

	{#await promise then data}
		<ul class="grid md:grid-cols-3 gap-4 my-8">
			{#each data as item}
				<li class="pt-2 border-t">
					<div class="flex items-center gap-1 text-sm">
						<span>
							{#if item.medium}
								{#if item.medium.logo}
									<img
										src="https://base.klimadashboard.org/assets/{item.medium.logo}"
										alt={item.medium.name}
										class="h-4"
									/>
								{:else}
									<span class="">{item.medium.name}</span>
								{/if}
							{/if}
						</span>
						<span class="border-l pl-1">{dayjs(item.date).format('DD.MM.YYYY')}</span>
					</div>
					<h3 class="text-2xl leading-tight my-0.5 font-serif">{item.title}</h3>
					<p>
						{item.summary &&
							(item.summary.length > 140 ? item.summary.slice(0, 137) + '...' : item.summary)}
					</p>
					{#if item.link}
						<a href={item.link} target="_blank" class="button flex justify-between mt-2"
							><span>{item.link.slice(0, 20)}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"
								><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
									d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"
								/><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg
							>
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	{/await}
</div>
