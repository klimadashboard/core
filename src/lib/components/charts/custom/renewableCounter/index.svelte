<script>
	import Chart from './Chart.svelte';
	import Papa from 'papaparse';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	let dataGoals;
	const getGoals = async function () {
		try{
			const directus = getDirectusInstance(fetch);
			const goals = await directus.request(
				readItems('erneuerbare_2030_scenarios', {
					filter: {
						_and: [
							{ 
								Country: { _eq: PUBLIC_VERSION.toUpperCase() },
							}
						]
					},
					limit: -1
				})
			);
			dataGoals = goals;
			
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};
	$: getGoals();


	const getProduction = async function (dataKey) {
		try{
			const directus = getDirectusInstance(fetch);
			const production = await directus.request(
				readItems('ee_produktion', {
					filter: {
						_and: [
							{ 
								Country: { _eq: PUBLIC_VERSION.toUpperCase() },
								Type: {_eq: dataKey}
							}
						]
					},
					limit: -1
				})
			);
			return production
			
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	let dataPV;
	const getPVProduction = async function(){
		dataPV = await getProduction("pv")
	}
	$: getPVProduction();


	let dataWind;
	const getWindProduction = async function(){
		dataWind = await getProduction("windkraft")
	}
	$: getWindProduction();

</script>

{#if dataPV && dataWind && dataGoals}
	<Chart {dataPV} {dataWind} {dataGoals} />
{/if}
