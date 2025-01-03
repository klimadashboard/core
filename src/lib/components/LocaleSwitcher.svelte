<script>
	import { locale } from '$lib/stores/i18n';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { invalidateAll } from '$app/navigation';

	// Fetch languages from Directus
	$: getLanguages = async () => {
		const directus = getDirectusInstance();
		const languages = await directus.request(readItems('languages'));
		return languages;
	};

	$: promise = getLanguages();

	// Watch for locale changes and invalidate pages
	$: {
		locale.subscribe(() => {
			// Invalidate all pages to reload data and server-side logic
		});
	}
</script>

{#await promise then languages}
	<div class="flex items-center gap-2 font-bold">
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
			class="icon icon-tabler icons-tabler-outline icon-tabler-language"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M4 5h7" />
			<path d="M9 3v2c0 4.418 -2.239 8 -5 8" />
			<path d="M5 9c0 2.144 2.952 3.908 6.7 4" />
			<path d="M12 20l4 -9l4 9" />
			<path d="M19.1 18h-6.2" />
		</svg>
		<select
			class="appearance-none bg-transparent"
			bind:value={$locale}
			on:change={(e) => locale.set(e.target.value)}
		>
			{#each languages as language}
				<option value={language.code}>{language.name}</option>
			{/each}
		</select>
	</div>
{/await}
