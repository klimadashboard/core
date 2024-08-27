import { writable, readable } from 'svelte/store';
import { browser } from '$app/environment';

const defaultValue = 'de';
const initialValue = browser ? window.localStorage.getItem('locale') ?? defaultValue : defaultValue;

const locale = writable(initialValue);

locale.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('locale', value);
	}
});

const locales = readable(['de', 'en']);

export { locale, locales };
