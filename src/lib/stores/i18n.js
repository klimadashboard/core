import { writable } from 'svelte/store';

let locale = writable('de');

export { locale };
