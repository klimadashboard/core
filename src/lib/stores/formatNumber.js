export default function formatNumber(number, unit, decimals) {
	if (decimals == 0) {
		var roundedValue = Math.round(number);
	} else {
		var roundedValue = Number(Math.round(number + 'e' + (decimals || 2)) + 'e-' + (decimals || 2));
	}

	if (roundedValue == 0) {
		roundedValue = number;
	}
	var valueString = roundedValue.toLocaleString('de-AT');
	if (unit) {
		valueString += ' ' + unit;
	}

	return valueString;
}
