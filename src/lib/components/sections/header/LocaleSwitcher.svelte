<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	// Fetch languages from Directus
	$: getLanguages = async () => {
		const directus = getDirectusInstance();
		const languages = await directus.request(readItems('languages'));
		return languages;
	};

	$: promise = getLanguages();

	// Update locale and navigate to the corresponding URL
	const updateLocale = (newLocale) => {
		// Get current URL path and break it into segments
		const pathSegments = window.location.pathname.split('/').filter(Boolean);

		// Define supported languages
		const supportedLanguages = ['de', 'en']; // Add your supported languages here

		// Remove the current language segment if present
		if (supportedLanguages.includes(pathSegments[0])) {
			pathSegments.shift();
		}

		// Prepend the new locale if it's not the default language
		const newPath =
			newLocale === 'de' ? `/${pathSegments.join('/')}` : `/${newLocale}/${pathSegments.join('/')}`;

		// Navigate to the new path
		goto(newPath || '/');
	};
</script>

{#await promise then languages}
	<div class="button relative">
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
			class="absolute left-2 top-1 md:top-1.5 pointer-events-none"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"
			/><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path
				d="M12.5 3a17 17 0 0 1 0 18"
			/></svg
		>
		<select
			class="appearance-none bg-transparent uppercase pl-7"
			on:change={(e) => updateLocale(e.target.value)}
			aria-label="Choose language"
		>
			{#each languages as language}
				<option value={language.code} selected={$page.data.language.code === language.code}>
					{language.code.toUpperCase()}
				</option>
			{/each}
		</select>
	</div>
{/await}
