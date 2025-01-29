import dayjs from 'dayjs';

// todo: integrate formatNumber, formatPercentage, here

export function formatLabel(value) {
    if(dayjs(value).isValid())
    {
        return dayjs(value).format('DD.MM.YYYY')
    } else {
	return value.toLocaleString('de-AT');
    }
}
