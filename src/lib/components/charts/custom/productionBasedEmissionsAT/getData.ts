import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';

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


export const getYearlyPopulationByRegionID = async function (region_id) {
    try{
        const directus = getDirectusInstance(fetch);
        let data = await directus.request(
            readItems('population', {
                filter: {
                    region: { _eq: region_id },
                },
                sort: "period",
                fields: ["period","region","value"],
            })
        );
        return data;
    } catch (error) {
        console.error('Error fetching population:', error);
    }
}
