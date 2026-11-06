// Single entry point for maplibre-gl.
//
// maplibre-gl v6 is ESM-only and loads its web worker from a URL. Bundlers can't resolve that
// URL on their own, so it has to be set once with `setWorkerUrl` (see the v5 → v6 migration
// guide). Import maplibre from here – never directly from 'maplibre-gl' – so that the worker
// URL is always configured before a map is created.
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

if (typeof window !== 'undefined') {
	setWorkerUrl(workerUrl);
}

export * from 'maplibre-gl';
