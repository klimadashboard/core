import { scaleLinear, scaleTime } from 'd3-scale';
import { min, max } from 'd3-array';

export const scaleApproval = scaleLinear()
	.range([
		'#6e2703',
		'#8c3406',
		'#c44c0a',
		'#cb8447',
		'#c6a66c',
		'#c1bc85',
		'#a5af87',
		'#809a86',
		'#347b7a',
		'#0c4c4f',
		'#033133'
	])
	.domain([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

export function getScale(data, key, range) {
    const isDate = (value) =>
        value instanceof Date ||
        (typeof value === "string" && isNaN(value) && !isNaN(Date.parse(value)));

    // Find the first valid key
    const sampleValue = data.find(d => d[key] !== undefined)?.[key];

    console.log("Sample value:", sampleValue, "Type:", typeof sampleValue, "isDate:", isDate(sampleValue));

    if (isDate(sampleValue)) {
        // Convert all date strings to Date objects
        const parsedData = data.map(d => ({
            ...d,
            [key]: new Date(d[key])
        }));

        const minV = min(parsedData, (d) => d[key]);
        const maxV = max(parsedData, (d) => d[key]);

        let timeScale = scaleTime()
            .domain([
                minV instanceof Date ? minV : new Date(minV),
                maxV instanceof Date ? maxV : new Date(maxV)
            ])
            .range(range);

        // **Create a wrapper function that mimics scaleTime()**
        function wrappedScale(value) {
            return timeScale(value instanceof Date ? value : new Date(value));
        }

        // **Copy all original scaleTime() methods to the wrapper**
        Object.keys(timeScale).forEach((method) => {
            if (typeof timeScale[method] === "function") {
                wrappedScale[method] = (...args) => {
                    const result = timeScale[method](...args);
                    return result === timeScale ? wrappedScale : result; // Maintain chaining
                };
            }
        });

        return wrappedScale;
    } else {
        return scaleLinear()
            .domain([min(data, (d) => +d[key]), max(data, (d) => +d[key])])
            .range(range);
    }
}