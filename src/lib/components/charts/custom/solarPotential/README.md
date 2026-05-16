# solarPotential

This chart is more complex than the standard 2-file (`config.ts` + `index.svelte`) pattern and is split accordingly:

| File | Purpose |
|---|---|
| `config.ts` | Entry point required by the chart system — re-exports `fetchChartData` from `data.ts` |
| `types.ts` | All shared TypeScript interfaces and type aliases |
| `data.ts` | API constants, fetch logic, data transformation, and `fetchChartData` |
| `index.svelte` | Main chart component |
| `MunicipalityKPIs.svelte` | KPI stat cards for the selected region |
| `RankingTable.svelte` | Sortable ranking table with neighbour comparison |
| `AwardsSection.svelte` | Award badges derived from historical data |
| `awards.ts` | Award computation logic |
| `utils.ts` | Formatting helpers and filter/sort utilities |
