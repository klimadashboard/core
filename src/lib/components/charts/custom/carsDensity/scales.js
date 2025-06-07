import { scaleLinear } from 'd3-scale';

const colorsPop = ['#DBEAFE', '#1E40AF']; // light blue → royal blue
const colorsPrivate = ['#DCFCE7', '#166534']; // pale green → dark green
const colorsCompany = ['#FEF3C7', '#B45309']; // light amber → rich amber

export const colors = {
	private: colorsPrivate,
	pop: colorsPop,
	company: colorsCompany
};

export const scales = {
	pop: scaleLinear().domain([0, 100]).range(colorsPop),
	private: scaleLinear().domain([0, 100]).range(colorsPrivate),
	company: scaleLinear().domain([0, 100]).range(colorsCompany)
};
