import { scaleLinear } from 'd3-scale';

const colorsPop = ['#CDE6F1', '#1F77B4'];
const colorsElectric = ['#EDFFE6', '#187E8B'];

export const colors = {
	electric: colorsElectric,
	pop: colorsPop
};

export const scales = {
	electric: scaleLinear().domain([0, 100]).range(colorsElectric),
	pop: scaleLinear().domain([0, 100]).range(colorsPop)
};
