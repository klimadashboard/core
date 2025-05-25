export function formatPower(value) {
	if (value >= 1_000_000) {
		const gw = value / 1_000_000;
		return `${gw >= 10 ? gw.toFixed(1) : gw.toFixed(2)} GW`;
	} else if (value >= 1_000) {
		const mw = value / 1_000;
		return `${mw >= 10 ? mw.toFixed(1) : mw.toFixed(2)} MW`;
	} else if (value > 0) {
		return `${value.toFixed(value >= 10 ? 0 : 1)} kW`;
	} else {
		return `0 kW`;
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
