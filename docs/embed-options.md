# Embed options API

CMS plugins (e.g. the TYPO3 extension `klimadashboard/typo3-klimadashboard`) need to know
which chart-specific URL parameters an embed understands, to offer them as fields.

```
GET /api/embed-options/<chartId>?lang=de|en
→ [{ "key": "mode", "label": "…", "choices": [{ "value": "bestand", "label": "…" }], "currentValue": "neuzulassungen" }]
```

- `[]` if the chart has no options, `404` for unknown ids, CORS open, cached 1h.
- `currentValue` is the default the chart uses when the parameter is absent.
- Options are declared statically in the chart's `config.ts` (no data fetch):

```ts
export const embedOptions: EmbedOptionDeclaration[] = [
	{ key: 'historic', label: { de: '…', en: '…' }, choices: [/* … */], default: 'false' }
];
```

Values are passed to the embed as query parameters (`/embed/<id>?historic=true`) and read by the
chart via `page.url.searchParams`. Keep the declaration in sync with what `index.svelte` reads.
Skins are listed separately at `GET /api/skins` (see `embed-skins.md`).
