import { scaleLinear } from 'd3-scale';

const colorsPop = ['#E5F3FA', '#003B80'];
const colorsElectric = ['#F0FFF0', '#005E61'];

export const colors = {
	electric: colorsElectric,
	pop: colorsPop
};

export const scales = {
	electric: scaleLinear().domain([0, 100]).range(colorsElectric),
	pop: scaleLinear().domain([0, 100]).range(colorsPop)
};
