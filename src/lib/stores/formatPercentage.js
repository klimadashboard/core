export default function formatPercentage(number, decimals) {
	if (!decimals) {
		var decimals = 2;
	}

	var roundedValue = Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
	return roundedValue + '%';
}
