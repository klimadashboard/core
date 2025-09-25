import { scaleLinear } from 'd3-scale';

const colorsPop = ['#E5F3FA', '#00234D'];
const colorsElectric = ['#F0FFF0', '#003133'];
const colorsHybrid = ['#FFF0E5', '#4D3800'];

export const colors = {
	electric: colorsElectric,
	pop: colorsPop,
	hybrid: colorsHybrid
};

export const scales = {
	electric: scaleLinear().domain([0, 100]).range(colorsElectric),
	hybrid: scaleLinear().domain([0, 100]).range(colorsHybrid),
	pop: scaleLinear().domain([0, 100]).range(colorsPop)
};
