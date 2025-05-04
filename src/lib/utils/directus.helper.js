import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';


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
