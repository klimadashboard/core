import { locale } from '$lib/stores/i18n';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

let localeString = 'de';
locale.subscribe((value) => {
	localeString = value;
});

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const url =
		'https://cms.klimadashboard.org/' +
		localeString +
		'/klimadashboard-' +
		'at' +
		(params.slug !== '' ? '/' : '') +
		params.slug +
		'.json';

	const promise = await fetch(url)
		.then((x) => x.json())
		.catch(function (err) {
			throw error(404, 'Timeout when loading page data. ' + err);
		});

	return promise;
}
