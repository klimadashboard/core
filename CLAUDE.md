# Klimadashboard – Chart Authoring Guide

## Structure

Every chart is a directory under `src/lib/components/charts/custom/<chartName>/` with two files:

- **`config.ts`** — server-side: fetch data, return `ChartData`
- **`index.svelte`** — client-side: render the chart

The system auto-discovers any `config.ts` that exports `fetchChartData`. No registration needed.

**Reference charts:**
- Simple line: `co2PriceHistory` — minimal config + primitives usage
- Stacked area: `historicalEmissions` — multi-series with Legend
- Stat cards: `renewablesTypes` — no SVG chart, custom layout

---

## `config.ts`

Must export `fetchChartData(params: ChartFetchParams): Promise<ChartData | null>`.

**Critical:** always pass the `fetch` param from `ChartFetchParams` to every HTTP call — it enables the 4h response cache. Never use `globalThis.fetch`.

```ts
export async function fetchChartData({ fetch, regionId, translations }: ChartFetchParams): Promise<ChartData | null> {
  const res = await fetch('https://...');
  if (!res.ok || !data.length) return null;
  return {
    raw: data,
    table: { columns, rows: data, filename: 'my-chart' },
    placeholders: { lastValue: formatNumber(data.at(-1).value, 1) },
    meta: { source: 'Source Name', updateDate: '...' }
  };
}
```

`TableColumn` fields: `key`, `label`, `align?: 'left'|'center'|'right'`, `format?: (v) => string`.

---

## `index.svelte`

Required props — always exactly these two:

```svelte
export let region: Region | null = null;
export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
```

Call `onChartData(data)` on success, `onChartData(null)` on error.

Always handle all three states: loading skeleton, error, empty data.

```svelte
{#if loading}
  <div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
  <div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data.length}
  <div class="h-[300px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
{:else}
  <!-- chart -->
{/if}
```

---

## Chart primitives

Import from `$lib/components/charts/primitives`. Available: `Chart`, `AxisX`, `AxisY`, `Line`, `Area`, `BarY`, `BarStack`, `Tooltip`, `Legend`, `RuleX`, `RuleY`.

`<Chart>` handles responsive sizing, D3 scales, and hover. Key props:

| Prop | Default | Notes |
|---|---|---|
| `data` | `[]` | array of data points |
| `x` | `'x'` | field name for x |
| `y` | `'y'` | field name(s) for y |
| `xType` | `'linear'` | `'band'` for bar charts |
| `height` | `300` | px |
| `yMin/yMax` | auto | pin axis bounds |
| `margin` | `{top:15,right:20,bottom:35,left:55}` | adjust left for label width |

Slot props from `slot="default"`: `xScale`, `yScale`, `xDomain`, `innerWidth`, `innerHeight`, `bandwidth`, `hover`.

Use the two-pass AxisY pattern so grid lines render behind marks, labels on top:
```svelte
<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
<!-- marks here -->
<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={...} unit="GW" />
```

---

## UI components

Import from `$lib/components/ui`. All components are WCAG 2.1 AA compliant and dark-mode ready.

| Component | Props | Usage |
|---|---|---|
| `Toggle` | `label`, `bind:checked`, `disabled?` | On/off switch |
| `Select` | `label`, `bind:value`, `options`, `hideLabel?`, `small?`, `disabled?` | Dropdown — options: `{value, label, group?}[]` |
| `RadioGroup` | `label`, `bind:value`, `options`, `inline?`, `hideLabel?`, `disabled?` | Pill-style radio buttons |
| `RangeSlider` | `label`, `bind:value`, `min`, `max`, `step?`, `format?`, `hideLabel?`, `disabled?` | Slider with visible value |
| `Checkbox` | `label`, `bind:checked`, `disabled?` | Single checkbox |

All emit a `change` event with the new value. Example:

```svelte
import { Toggle, Select, RadioGroup, RangeSlider } from '$lib/components/ui';

<Select label="Jahr" bind:value={year} options={years.map(y => ({ value: y, label: String(y) }))} hideLabel />
<RadioGroup label="Ansicht" bind:value={view} options={[{ value: 'day', label: 'Tag' }, { value: 'year', label: 'Jahr' }]} />
<Toggle label="Pro Kopf" bind:checked={perCapita} />
<RangeSlider label="Jahr" bind:value={year} min={1990} max={2024} format={(v) => String(v)} />
```

---

## Formatters

Always use `$lib/utils/formatters` — never hand-roll number formatting.

`formatNumber(v, decimals?)` · `formatPercent(v)` · `formatCO2(tons)` · `formatPower(kw)` · `formatDate(date)` · `formatArea(km2)` · `formatPopulation(v)`

---

## Styling

**Tailwind only — no `<style>` blocks.** Always add `dark:` variants for background and text colors.

Responsive margins: use `bind:clientWidth` on the container and reduce left/right margins below 500px.

---

## Colors & accessibility

Semantic sector colors (match Tailwind config):

| Sector | Hex |
|---|---|
| Energy | `#BD3737` |
| Buildings | `#4880A8` |
| Industry | `#373949` |
| Agriculture | `#65987D` |
| Mobility/Transport | `#F5AF4A` |
| Waste | `#B7693D` |
| F-gases | `#7CAFBA` |

For multi-series without sector semantics, use the ColorBrewer-derived palettes in `tailwind.config.cjs`: green (100–1000), blue (100–1000), red (100–1000).

**A11y rules:**
- Never differentiate series by color alone — also vary line dash, labels, or marker shape
- Always show a `<Legend>` for multi-series charts
- Tooltip must show the actual value (not just a color swatch)
- Avoid red+green as the only pair (color-blind unsafe)
