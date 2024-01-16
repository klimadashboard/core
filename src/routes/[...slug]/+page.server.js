import { locale } from '$lib/stores/i18n';
import { error } from '@sveltejs/kit';
import { PUBLIC_VERSION } from '$env/static/public';

let localeString = 'de';
locale.subscribe((value) => {
	localeString = value;
});

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const url =
		'https://klimadashboard.org/' +
		localeString +
		'/klimadashboard-' +
		PUBLIC_VERSION +
		(params.slug !== '' ? '/' : '') +
		params.slug +
		'.json';

	console.log(url);

	const promise = await fetch(url)
		.then((x) => x.json())
		.catch(function (err) {
			throw error(404, 'Timeout when loading page data. ' + err);
		});

	return promise;
}
