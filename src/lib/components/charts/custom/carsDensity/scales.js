import { scaleLinear } from 'd3-scale';

const colorsPop = ['#E5F3FA', '#00234D'];
const colorsPrivate = ['#F0FFF0', '#003133'];
const colorsCompany = ['#FFF0E5', '#4D3800'];

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
