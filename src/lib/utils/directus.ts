import { createDirectus, rest } from '@directus/sdk';
import { Schema } from './my-collections';

function getDirectusInstance(fetch) {
	const options = fetch ? { globals: { fetch } } : {};
	const directus = createDirectus<Schema>('https://base.klimadashboard.org', options).with(rest());
	return directus;
}

export default getDirectusInstance;
