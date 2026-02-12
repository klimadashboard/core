// calculateAverages.worker.js

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import 'dayjs/locale/de';

dayjs.extend(isBetween);
dayjs.extend(isLeapYear);
dayjs.locale('de');

const seasonCodes = {
	Winter: 0,
	Frühling: 1,
	Sommer: 2,
	Herbst: 3
};

function getSeasonCode(date) {
	const month = dayjs(date).month();
	if ([11, 0, 1].includes(month)) return seasonCodes.Winter;
	if ([2, 3, 4].includes(month)) return seasonCodes.Frühling;
	if ([5, 6, 7].includes(month)) return seasonCodes.Sommer;
	if ([8, 9, 10].includes(month)) return seasonCodes.Herbst;
}

function isSeasonOngoing(seasonPeriod, currentDate) {
	const [seasonCodeStr, yearStr] = seasonPeriod.split('-');
	const seasonCode = parseInt(seasonCodeStr);
	let year = parseInt(yearStr);

	let startMonth, endMonth;
	let endYear = year;

	if (seasonCode === seasonCodes.Winter) {
		startMonth = 11;
		endMonth = 1;
		endYear = year + 1;
	} else if (seasonCode === seasonCodes.Frühling) {
		startMonth = 2;
		endMonth = 4;
	} else if (seasonCode === seasonCodes.Sommer) {
		startMonth = 5;
		endMonth = 7;
	} else if (seasonCode === seasonCodes.Herbst) {
		startMonth = 8;
		endMonth = 10;
	}

	const seasonStartDate = dayjs().year(year).month(startMonth).startOf('month');
	const seasonEndDate = dayjs().year(endYear).month(endMonth).endOf('month');

	return currentDate.isBetween(seasonStartDate, seasonEndDate, null, '[]');
}

onmessage = function (e) {
	const { data, resolution, period, slice } = e.data;

	try {
		const compareStartYear = period.start;
		const compareEndYear = period.end;
		const today = dayjs();

		let historicalPeriods = {};
		for (const entry of data) {
			const year = dayjs(entry.date).year();
			if (year < compareStartYear || year > compareEndYear) continue;

			let key;
			if (resolution.key === 'months') {
				key = String(dayjs(entry.date).month());
			} else if (resolution.key === 'seasons') {
				key = String(getSeasonCode(entry.date));
			} else {
				key = 'Overall';
			}
			if (!historicalPeriods[key]) historicalPeriods[key] = [];
			historicalPeriods[key].push({
				date: dayjs(entry.date),
				temp: parseFloat(entry.tl_mittel)
			});
		}

		const historicalAverages = Object.entries(historicalPeriods).map(([period, entries]) => {
			const filteredTemps = entries.filter((e) => !isNaN(e.temp)).map((e) => e.temp);
			const avg =
				filteredTemps.length > 0
					? filteredTemps.reduce((a, b) => a + b, 0) / filteredTemps.length
					: null;
			return {
				period,
				averageTemperature: avg !== null ? +avg.toFixed(2) : null
			};
		});

		const historicalAvgLookup = Object.fromEntries(
			historicalAverages.map((d) => [d.period, d.averageTemperature])
		);

		let recentPeriods;
		if (resolution.key === 'months') {
			recentPeriods = [...new Set(data.map((d) => dayjs(d.date).format('YYYY-MM')))]
				.filter((p) => dayjs(p, 'YYYY-MM').isBefore(today, 'month'))
				.sort((a, b) => dayjs(a, 'YYYY-MM').valueOf() - dayjs(b, 'YYYY-MM').valueOf());
		} else if (resolution.key === 'seasons') {
			recentPeriods = [
				...new Set(data.map((d) => `${getSeasonCode(d.date)}-${dayjs(d.date).year()}`))
			]
				.filter((p) => !isSeasonOngoing(p, today))
				.sort((a, b) => {
					const [sa, ya] = a.split('-').map(Number);
					const [sb, yb] = b.split('-').map(Number);
					return ya * 10 + sa - (yb * 10 + sb);
				});
		} else {
			recentPeriods = [...new Set(data.map((d) => String(dayjs(d.date).year())))]
				.filter((year) => parseInt(year) < today.year())
				.sort((a, b) => parseInt(a) - parseInt(b));
		}

		if (resolution.key !== 'months') {
			recentPeriods = recentPeriods.slice(1).slice(-slice);
		}

		const recentData = recentPeriods.map((p) => {
			let periodData;
			let type;
			let label;
			let expectedDays = 0;
			let avg = null;
			let diff = null;

			if (resolution.key === 'months') {
				periodData = data.filter((d) => dayjs(d.date).format('YYYY-MM') === p);
				const dt = dayjs(p, 'YYYY-MM');
				type = String(dt.month());
				label = dt.locale('de').format('MMMM YYYY');
				expectedDays = dt.daysInMonth();
			} else if (resolution.key === 'seasons') {
				const [seasonCodeStr, yearStr] = p.split('-');
				const seasonCode = parseInt(seasonCodeStr);
				const year = parseInt(yearStr);
				label = `${Object.keys(seasonCodes).find((k) => seasonCodes[k] === seasonCode)} ${year}`;
				type = String(seasonCode);
				periodData = data.filter((d) => {
					return getSeasonCode(d.date) === seasonCode && dayjs(d.date).year() === year;
				});

				let months = [];
				if (seasonCode === seasonCodes.Winter) {
					months = [dayjs(`${year - 1}-12-01`), dayjs(`${year}-01-01`), dayjs(`${year}-02-01`)];
				} else {
					months = [0, 1, 2].map((i) => dayjs(`${year}-${seasonCode * 3 + i + 1}-01`));
				}
				expectedDays = months.reduce((sum, m) => sum + m.daysInMonth(), 0);
			} else {
				const year = parseInt(p);
				label = String(year);
				type = 'Overall';
				periodData = data.filter((d) => dayjs(d.date).year() === year);
				expectedDays = dayjs(`${year}-01-01`).isLeapYear() ? 366 : 365;
			}

			const validTemps = periodData.map((d) => parseFloat(d.tl_mittel)).filter((t) => !isNaN(t));

			if (validTemps.length >= expectedDays * 0.9 || validTemps.length > 0) {
				const sum = validTemps.reduce((a, b) => a + b, 0);
				avg = sum / validTemps.length;
				if (historicalAvgLookup[type] !== undefined && historicalAvgLookup[type] !== null) {
					diff = avg - historicalAvgLookup[type];
				}
			}

			return {
				period: label,
				averageTemperature: avg !== null ? +avg.toFixed(2) : null,
				differenceFromHistorical: diff !== null ? +diff.toFixed(2) : null,
				selectedResolution: resolution.key,
				isOngoing: false
			};
		});

		postMessage({ result: { historicalAverages, recentData } });
	} catch (err) {
		postMessage({ error: err.message });
	}
};
