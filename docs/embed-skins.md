# Embed skins

A **skin** changes how an embedded chart looks in a partner's website — typefaces,
interface accent colors, the logo(s) in the top-right corner of the chart card and an
link to the partner's full dashboard and an optional footer (funding notices).
Data, layout, interactions, texts and chart-series colors stay the same.

Skins only apply on embed routes (`/embed/*`). On klimadashboard.* itself they are ignored.

## Contract (stable — the TYPO3 extension relies on this)

### iframe

```
https://klimadashboard.de/embed/<chartId>?skin=<skinId>[&region=…&auto=true&…]
```

- `skin` — optional. Lower-case skin id, e.g. `metropolregion-nuernberg`.
- Unknown, empty or missing id → the default Klimadashboard look, **silently** (no error,
  no 4xx). Embeds therefore never break because a skin was renamed or removed.
- `skin` can be combined with every other existing embed parameter
  (`region`, `lang`, `auto`, `notitle`, `showtext`, `bgcolor`, chart-specific options).

### Script embed

`/embed.js` forwards every `data-*` attribute as a URL parameter, so `data-skin` works:

```html
<div id="kd-chart-1"></div>
<script
  src="https://klimadashboard.de/embed.js"
  data-chart="<chartId>"
  data-target="kd-chart-1"
  data-skin="metropolregion-nuernberg"
  async
></script>
```

### Available skins

| id | label | since |
|---|---|---|
| `metropolregion-nuernberg` | Metropolregion Nürnberg · Klimapakt2030plus | 2026-10 |

A machine-readable list is available at `GET /api/skins` →
`[{ "id": "metropolregion-nuernberg", "label": "…" }]`, e.g. to populate a select field in a
CMS plugin. Ids are permanent; a skin may be visually updated without changing its id.

## What a skin can change

| Property | Effect |
|---|---|
| `fonts.body` / `fonts.heading` | CSS font stacks for body text and the card title/headings |
| `fonts.headingTransform` | e.g. `uppercase` (corporate designs that set headlines in caps) |
| `fonts.stylesheet` | optional URL of a self-hosted `@font-face` stylesheet under `/skins/<id>/` |
| `colors.accent` | interface accent: active tab marker and the Klimadashboard wordmark |
| `colors.accentDark` | the same for dark mode (must reach 4.5:1 on `gray-900`) |
| `logos[]` | logos shown top-right (`src`, `alt`, optional `href`; rendered 32px high on phones, 40px from `sm`). They are placed on a white plate, so logos that must sit on white (as most CDs require) stay correct in dark mode |
| `footer.logos[]` | logos (64px high) at the bottom of the card content, each with an optional `caption` above it (e.g. "Gefördert vom") |
| `dashboardLink` | `{ href, label }` — replaces the top-right "Klimadashboard.de" wordmark with this label (Klimadashboard icon stays), e.g. a link to the partner's full dashboard |
| `attribution` | `'compact'` (default when a skin has logos) keeps a small "Klimadashboard" icon link next to the partner logos (ignored when `dashboardLink` is set); `'full'` keeps the default wordmark + icon |

Every property is optional. A **logos-only skin** (just `logos` and/or `footer`, no `fonts` or
`colors`) keeps the Klimadashboard fonts and colours and only adds partner logos. This is the
intended model for partner pages on klimadashboard.de itself (e.g. the planned
`/metropolregion-nuernberg` dashboard). Skins are currently only *applied* on `/embed/*`;
using them on regular pages is a separate step.

Not changed by skins (on purpose): chart data-series colors, layout, chart primitives.
See "Data-series colors" below.

## Adding a skin

1. Create `src/lib/skins/<id>.ts` exporting a `Skin` (see `src/lib/skins/types.ts`).
2. Add it to the list in `src/lib/skins/index.ts`.
3. Put assets under `static/skins/<id>/` (logos as SVG, fonts as `woff2` + a `fonts.css`).
   Fonts must be self-hosted (DSGVO — no Google Fonts or other font CDNs).
4. Check contrast: accent colors are used for text/markers and must meet WCAG 2.1 AA
   (4.5:1 for text) on white **and** (`accentDark`) on `gray-900`.
5. Add a row to the table above.

## Data-series colors

Chart series colors are mostly hard-coded hex values inside each chart (≈570 values in
≈76 files), plus Tailwind classes. Skinning them would mean touching many charts and is
**not** part of the current implementation; nothing changes for chart authors until that is
decided. Options, from least to most invasive:

1. **Opt-in per chart** — a `skinPalette` helper charts may read; only the charts actually
   embedded by a partner get migrated (for Nürnberg: the Klimapakt monitoring charts).
2. **Semantic tokens** — move sector/series colors to CSS variables (`--kd-energy`, …)
   referenced via Tailwind and `var()` in charts; skins override the variables. Touches all
   charts once, but afterwards every chart is skinnable.

Either way, a skin palette must keep the a11y rules from `CLAUDE.md` (no red/green-only
pairs, contrast, series also differentiated by dash/labels).

## metropolregion-nuernberg — status

Adapted to the look of www.klimapakt2030plus.de (checked 2026-10-29). CD reference: EMN
Gestaltungsleitfaden (2010) and Klimapakt2030plus CD-Manual (30.10.2023) in the tender
documents.

| Element | Now | Website / CD | Open |
|---|---|---|---|
| Fonts | Barlow Condensed for headings and body (self-hosted, DIN-like) — **stand-in** | website: DIN Condensed (headings), Trade Gothic LT W01 Cond No. 18 (body), both commercial webfonts licensed to their domain | licence extension for klimadashboard.de + `woff2` files, or OK to keep the stand-in |
| Heading case | mixed case (as on the website) | CD: DIN 1451 Engschrift in caps (print) | — |
| Accent | `#647235` (5.3:1 on white); dark mode `#a7be59` (8.6:1 on gray-900) | website green `#a7be59`, darker shades `#8da440`/`#647235`; `#a7be59` fails contrast on white, so it is used in dark mode only | — |
| Header logo | combined EMN \| Klimapakt2030plus lockup (SVG from the website) | CD: both logos always together, on white | confirm we may use the website file; ideally an official delivery |
| Förderhinweis | footer: BMFTR "Gefördert durch" (474×231 JPG from the website) | required by the tender | official BMFTR logo as SVG (the JPG is low-res) |
| Full-dashboard link | top-right, "Zum Gesamtdashboard" + Klimadashboard icon → `klimadashboard.de/metropolregion-nuernberg` | offer p.3 | URL is not live yet — confirm path |

Screenshots: `docs/embed-skins-screenshots/` (`default-light`, `nuernberg-light`,
`nuernberg-dark`, `nuernberg-mobile`).
