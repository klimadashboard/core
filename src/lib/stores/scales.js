import { scaleLinear } from 'd3-scale';

export const scaleApproval = scaleLinear()
	.range([
		'#580000',
		'#862f0a',
		'#cc7522',
		'#eaba7b',
		'#f8ebc2',
		'#ffffe0',
		'#e5f0d8',
		'#a9cec1',
		'#3ba1a0',
		'#1a5a5b',
		'#003233'
	])
	.domain([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
