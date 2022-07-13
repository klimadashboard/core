import { writable } from 'svelte/store';
import { browser } from '$app/env';

// Get the value out of storage on load.
var defaultValue = "light";

if(browser) {
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    defaultValue = "dark";
}
}

const stored = browser ? window.localStorage.theme ?? defaultValue : defaultValue;

export let theme = writable(stored || defaultValue)

// Anytime the store changes, update the local storage value.
if(browser) {
theme.subscribe((value) => window.localStorage.setItem('theme', value));
theme.subscribe((value) => {
    if(value == "dark") {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});
};
