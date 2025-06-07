import { scaleLinear } from 'd3-scale';

const colorsElectric = ['#D1FAE5', '#065F46']; // teal-green
const colorsHybrid = ['#FEF3C7', '#92400E']; // amber-brown
const colorsBenzin = ['#FEE2E2', '#991B1B']; // red
const colorsDiesel = ['#E0E7FF', '#3730A3']; // blue-indigo
const colorsOther = ['#E5E7EB', '#374151']; // gray

export const colors = {
	electric: colorsElectric,
	hybrid: colorsHybrid,
	benzin: colorsBenzin,
	diesel: colorsDiesel,
	other: colorsOther
};

export const scales = {
	electric: scaleLinear().domain([0, 100]).range(colorsElectric),
	hybrid: scaleLinear().domain([0, 100]).range(colorsHybrid),
	benzin: scaleLinear().domain([0, 100]).range(colorsBenzin),
	diesel: scaleLinear().domain([0, 100]).range(colorsDiesel),
	other: scaleLinear().domain([0, 100]).range(colorsOther)
};
