import { writable, derived } from 'svelte/store';
import { error } from '@sveltejs/kit';

const uri = "https://klimadashboard.org/de/charts.json";
export const chartsData = writable([]);

const fetchCharts = async () => {
	const response = await fetch(uri)
    .then((x) => x.json())
    .catch(function(err){
        throw error(500, 'Timeout when loading chart. ' + err);
    });
    chartsData.set(response);
}

fetchCharts();