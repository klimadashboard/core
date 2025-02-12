<script>
	import { locale } from '$lib/stores/i18n';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { goto } from '$app/navigation';

	// Fetch languages from Directus
	$: getLanguages = async () => {
		const directus = getDirectusInstance();
		const languages = await directus.request(readItems('languages'));
		return languages;
	};

	$: promise = getLanguages();

	// Update locale and navigate to the corresponding URL
	const updateLocale = (newLocale) => {
		// Update the locale store
		locale.set(newLocale);

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
			class="absolute pointer-events-none"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M4 5h7" />
			<path d="M9 3v2c0 4.418 -2.239 8 -5 8" />
			<path d="M5 9c0 2.144 2.952 3.908 6.7 4" />
			<path d="M12 20l4 -9l4 9" />
			<path d="M19.1 18h-6.2" />
		</svg>
		<select
			class="appearance-none bg-transparent uppercase pl-7"
			on:change={(e) => updateLocale(e.target.value)}
			aria-label="Choose language"
		>
			{#each languages as language}
				<option value={language.code} selected={$locale === language.code}>
					{language.code}
				</option>
			{/each}
		</select>
	</div>
{/await}
