import { writable, derived } from 'svelte/store';
import { error } from '@sveltejs/kit';

const uri = 'https://klimadashboard.org/de/charts.json';
export const chartsData = writable([]);

let fetchCharts = async () => {
	const response = await fetch(uri)
		.then((x) => x.json())
		.catch(function (err) {
			// console.log('Timeout when loading chart. ' + err);
		});

	if (response) {
		chartsData.set(response);
	}
};

fetchCharts();
