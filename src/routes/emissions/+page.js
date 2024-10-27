import { parse } from 'csv-parse/sync';

export async function load({ fetch }) {
    const url = '/static/emissions_de_federal_states_25102024.csv';
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        
        const records = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        return {
            emissions: records
        };
    } catch (error) {
        console.error('Error fetching or parsing CSV:', error);
        return {
            emissions: [],
            error: 'Failed to load emissions data'
        };
    }
}
