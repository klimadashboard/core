import { scaleLinear } from 'd3-scale';

const colorsElectric = ['#D1FAE5', '#065F46']; // teal-green
const colorsPlugInHybrid = ['#DBEAFE', '#1E40AF']; // light-electric blue → deep electric blue
const colorsHybrid = ['#FEF9C3', '#CA8A04']; // pale yellow → strong golden yellow
const colorsBenzin = ['#FEE2E2', '#991B1B']; // red
const colorsDiesel = ['#FEF2F2', '#78350F']; // pale ash → dark brown
const colorsOther = ['#E5E7EB', '#374151']; // gray

export const colors = {
	electric: colorsElectric,
	hybrid: colorsHybrid,
	benzin: colorsBenzin,
	diesel: colorsDiesel,
	other: colorsOther,
	plugInHybrid: colorsPlugInHybrid
};

export const scales = {
	electric: scaleLinear().domain([0, 100]).range(colorsElectric),
	hybrid: scaleLinear().domain([0, 100]).range(colorsHybrid),
	benzin: scaleLinear().domain([0, 100]).range(colorsBenzin),
	diesel: scaleLinear().domain([0, 100]).range(colorsDiesel),
	other: scaleLinear().domain([0, 100]).range(colorsOther),
	plugInHybrid: scaleLinear().domain([0, 100]).range(colorsPlugInHybrid)
};
