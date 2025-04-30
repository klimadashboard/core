import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

export const getEmissionsData = async function () {
    // sources: "BLI 2024 (1990-2022)", ?"NowCast (1990-2023)"?...not used
    try{
        const directus = getDirectusInstance(fetch);
        let data = await directus.request(
            readItems('emissions_data', {
                filter: {
                    _and: [
                        { 
                            country: { _eq: PUBLIC_VERSION.toUpperCase() },
                            source: { _eq: "BLI 2024 (1990-2022)" }
                        }
                    ]
                },
                sort: "year,region.name",
                fields: ["country.name","country.population","category.label","gas.name","gas.unit","id","region.name","region.population","source","type","value","year"],
                limit: -1
            })
        );

        data = data.map((row, i) => ({
            id: row.id,
            source: row.source,
            value: row.value,
            year: row.year,
            region: row.region === null ? row.country.name : row.region.name,
            population: row.region === null ? row.country.population : row.region.population,
            sektor: row.category.label,
            pollutant: row.gas.name,
            unit: row.gas.unit,
            classification: row.type,
        }));

        const pivot_table = pivot_multikey(data, ["year", "classification", "pollutant", "region", "source", "unit"], "sektor")
        console.log("pivot", pivot_table)

        console.log("directus", data)
        
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
};

interface DataItem {
    [key: string]: any;
}

export const pivot_multikey = (data: DataItem[], keys: string[], category: string) => {
    // Step 1: Create a map to track the rows by composite key
    const map: any = {};

    // Step 2: Iterate over the data array and populate the map
    data.forEach((item) => {
        // Create a composite key from the provided keys
        const compositeKey = keys.map(key => item[key]).join('-');

        if (!map[compositeKey]) {
            // If a row for this composite key doesn't exist, create a new row
            map[compositeKey] = {};
            keys.forEach(key => {
                map[compositeKey][key] = item[key];
            });
        }

        // Set the value for the category dynamically
        map[compositeKey][item[category]] = item.value;
    });

    // Step 3: Convert the map values to an array
    return Object.values(map);
};
