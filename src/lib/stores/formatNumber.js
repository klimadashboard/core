export default function formatNumber(number, unit, decimals) {
	const millionNumber = number > 1000000;
	let value = millionNumber ? number / 1000000 : number;

	if (decimals == 0) {
		var roundedValue = Math.round(value);
	} else {
		var roundedValue = Number(Math.round(value + 'e' + (decimals || 1)) + 'e-' + (decimals || 1));
	}

	if (roundedValue == 0) {
		roundedValue = value;
	}
	var valueString = roundedValue.toLocaleString('de-AT');
	if (millionNumber) valueString += ' Mio. ';
	if (unit) valueString += ' ' + unit;

	return valueString;
}
