export function formatPower(value) {
	const sign = value < 0 ? '-' : '';
	const absValue = Math.abs(value);

	if (absValue >= 1_000_000) {
		const gw = absValue / 1_000_000;
		// ≥10 GW → 1 decimal; <10 GW → 2 decimals
		const formatted = gw >= 10 ? gw.toFixed(1) : gw.toFixed(2);
		return `${sign}${formatted}\u202FGW`;
	} else if (absValue >= 1_000) {
		const mw = absValue / 1_000;
		// ≥10 MW → 1 decimal; <10 MW → 2 decimals
		const formatted = mw >= 10 ? mw.toFixed(1) : mw.toFixed(2);
		return `${sign}${formatted}\u202FMW`;
	} else if (absValue > 0) {
		// ≥10 kW → no decimals; <10 kW → 1 decimal
		const formatted = absValue >= 10 ? absValue.toFixed(0) : absValue.toFixed(1);
		return `${sign}${formatted}\u202FkW`;
	} else {
		// exactly zero
		return `0\u202FkW`;
	}
}

export function getPowerUnit(maxValue) {
	if (maxValue >= 1_000_000) return 'GW';
	if (maxValue >= 1_000) return 'MW';
	return 'kW';
}

export function convertToPowerUnit(value, maxValue) {
	if (maxValue >= 1_000_000) return value / 1_000_000;
	if (maxValue >= 1_000) return value / 1_000;
	return value;
}
