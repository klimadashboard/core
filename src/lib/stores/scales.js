import { scaleLinear } from 'd3-scale';

export const scaleApproval = scaleLinear()
	.range([
		'#6e2703',
		'#8c3406',
		'#c44c0a',
		'#cb8447',
		'#c6a66c',
		'#c1bc85',
		'#a5af87',
		'#809a86',
		'#347b7a',
		'#0c4c4f',
		'#033133'
	])
	.domain([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
