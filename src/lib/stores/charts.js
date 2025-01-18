import { writable } from 'svelte/store';
import { locale } from '$lib/stores/i18n';

let localeString = 'de';
locale.subscribe((value) => {
	localeString = value;
});

const uri = 'https://klimadashboard.org/' + localeString + '/charts.json';
export const chartsData = writable([]);

let fetchCharts = async () => {
	const response = await fetch(uri)
		.then((x) => x.json())
		.catch(function (err) {
			console.log('Timeout when loading chart. ' + err);
		});

	if (response) {
		chartsData.set(response);
	}
};

fetchCharts();
