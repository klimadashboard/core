import { scaleLinear } from 'd3-scale';

const colorsElectric = ['#F0FFF0', '#003133'];
const colorsHybrid = ['#FFF0E5', '#4D3800'];
const colorsBenzin = ['#FFF5F0', '#661A00'];
const colorsDiesel = ['#F2F2FF', '#1A005C'];
const colorsOther = ['#F7F7F7', '#666'];

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
