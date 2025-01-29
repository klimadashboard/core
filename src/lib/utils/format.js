import dayjs from 'dayjs';

// Helper function to check if a value is a valid date
function isValidDate(value) {
    return typeof value === 'string' && dayjs(value, 'YYYY-MM-DD', true).isValid();
}

// Helper function for number formatting
function formatNumber(value, decimals = 2, unit = '') {
    const isMillion = value >= 1_000_000;
    let adjustedValue = isMillion ? value / 1_000_000 : value;

    let roundedValue = decimals === 0
        ? Math.round(adjustedValue)
        : Number(Math.round(adjustedValue + 'e' + decimals) + 'e-' + decimals);

    // Fallback in case of unexpected rounding to 0
    if (roundedValue === 0) {
        roundedValue = adjustedValue;
    }

    let valueString = roundedValue.toLocaleString('de-AT');
    if (isMillion) valueString += ' Mio.';
    if (unit) valueString += ` ${unit}`;

    return valueString;
}

export function formatLabel(value, decimals = 2, unit = '') {
    if (isValidDate(value)) {
        return dayjs(value).format('DD.MM.YYYY');
    }

    if (typeof value !== 'number' || isNaN(value)) {
        return String(value); // Ensure non-number values return as strings
    }

    return formatNumber(value, decimals, unit);
}
