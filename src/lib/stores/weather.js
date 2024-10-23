import { readable, writable } from 'svelte/store';
import { PUBLIC_VERSION } from '$env/static/public';

const climateIndices = [];

climateIndices.push({
	label: 'Sommertage',
	key: 'summerDay',
	description: 'mindestens 25°C',
	color: '#DB7C37',
	icon: "<svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-temperature' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5'></path><line x1='10' y1='12' x2='14' y2='12'></line></svg>"
});

climateIndices.push({
	label: 'Hitzetage',
	key: 'heatDay',
	description: 'mindestens 30°C',
	color: '#DB5537',
	icon: "<svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-temperature' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5'></path><line x1='10' y1='9' x2='14' y2='9'></line></svg>"
});

if (PUBLIC_VERSION == 'at') {
	climateIndices.push({
		label: 'Wüstentage',
		key: 'extremeHeatDay',
		description: 'mindestens 35°C',
		color: '#D61C1C',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-temperature' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5'></path><line x1='10' y1='9' x2='14' y2='9'></line></svg>"
	});
}

climateIndices.push({
	label: 'Tropennächte',
	key: 'tropicalNight',
	description: 'nicht kühler als 20°C',
	color: '#B33965',
	icon: "<svg width='22' height='24' viewBox='0 0 22 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4.61199 18.5985C4.2785 19.1249 4.01733 19.6633 4.01733 20.0651C4.01733 21.1861 4.92539 22.0941 6.04639 22.0941C7.0348 22.0941 7.85445 21.387 8.03526 20.4548' stroke='white' stroke-width='2' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/><path d='M11.2898 12.3185C12.0934 12.0493 12.676 11.2979 12.676 10.4019C12.676 9.28094 10.6469 7.08313 10.6469 7.08313C10.6469 7.08313 9.93978 7.85457 9.35718 8.71441' stroke='white' stroke-width='2' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/><path d='M19.9685 13.8453C18.6988 14.4761 17.2283 14.7574 15.6733 14.5525C13.9697 14.3275 12.4389 13.5078 11.2898 12.3185C11.0849 12.3868 10.8719 12.431 10.6469 12.431C9.52591 12.431 8.61786 11.5229 8.61786 10.4019C8.61786 9.9439 8.95938 9.30505 9.35716 8.71442C9.31698 8.52156 9.28082 8.32468 9.25671 8.12378C8.88706 5.24293 10.1688 2.6353 12.2782 1.10045C11.8402 1.04018 11.3983 1 10.9442 1C5.07405 1 0.393166 6.08669 1.06416 12.0895C1.35345 14.6851 2.67937 16.9954 4.60797 18.5985C5.20664 17.6543 6.04237 16.7463 6.04237 16.7463C6.04237 16.7463 8.07142 18.9441 8.07142 20.0651C8.07142 20.1977 8.05535 20.3302 8.03124 20.4548C8.57768 20.6236 9.14421 20.7441 9.72279 20.8124C14.6006 21.391 18.8676 18.4378 20.3341 14.1748C20.4145 13.9498 20.1855 13.7368 19.9685 13.8453Z' stroke='white' stroke-width='2' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/></svg>"
});

climateIndices.push({
	label: 'Frosttage',
	key: 'frostDay',
	description: 'zwischenzeitlich unter 0°C',
	color: '#39A4B3',
	icon: "<svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-snowflake' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(60 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(120 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(180 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(240 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(300 12 12)'></path></svg>"
});
if (PUBLIC_VERSION == 'de') {
	climateIndices.push({
		label: 'Schneedeckentage',
		key: 'snowCoverDay',
		description: 'mindestens 1cm Schnee',
		color: '#6a9fcd',
		icon: "<svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-snowflake' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(60 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(120 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(180 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(240 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(300 12 12)'></path></svg>",
		values: [
			{
				label: 'in diesem Jahr',
				value: 7,
				average: 9
			}
		]
	});
}
climateIndices.push({
	label: 'Eistage',
	key: 'iceDay',
	description: 'nie über 0°C',
	color: '#004989',
	icon: "<svg xmlns='http://www.w3.org/2000/svg' class='icon icon-tabler icon-tabler-snowflake' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(60 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(120 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(180 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(240 12 12)'></path><path d='M10 4l2 1l2 -1m-2 -2v6.5l3 1.72' transform='rotate(300 12 12)'></path></svg>",
	values: [
		{
			label: 'in diesem Jahr',
			value: 7,
			average: 9
		}
	]
});

export const selectedStation = writable(PUBLIC_VERSION == 'at' ? 105 : 433); // 105 is ID for Wien Hohe Warte+
export const selectedWeatherYear = writable(
	PUBLIC_VERSION == 'at' ? new Date().getFullYear() : 2022
); // set to current year

export const types = readable(climateIndices);
