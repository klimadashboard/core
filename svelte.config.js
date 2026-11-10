import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	vitePlugin: {
		experimental: {
			// @splidejs/svelte-splide and @sveltejs/svelte-scroller ship a `svelte` field without an
			// `exports` condition. They work fine, the upstream packages are just unmaintained.
			disableSvelteResolveWarnings: true
		}
	},
	onwarn: (warning, handler) => {
		// Every chart must accept `region` (and route components `data`) even when unused,
		// see CLAUDE.md – so unused export props are intentional.
		if (warning.code === 'export_let_unused') return;
		handler(warning);
	},
	kit: {
		adapter: adapter(),
		alias: {
			'@': path.resolve('./src')
		}
	}
};

export default config;
