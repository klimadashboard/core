import { writable, derived } from 'svelte/store';
import { error } from '@sveltejs/kit';

const uri = "https://cms.klimadashboard.org/de/charts.json";
export const chartsData = writable([]);

const fetchCharts = async () => {
	const response = await fetch(uri).
    then(function(response) {
        if(response.ok) {
            return response;
        }
        throw error(500, "Error when loading chart data from Klimadashboard CMS. Please reload the page to try again.");
    });
	const result = await response.json();
	chartsData.set(result);
}

fetchCharts();