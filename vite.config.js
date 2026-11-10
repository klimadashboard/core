import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	ssr: {
		noExternal: ['@tabler/icons-svelte-runes']
	},
	worker: {
		format: 'es'
	},
	build: {
		// Map libraries (maplibre, deck.gl) make a few large chunks unavoidable
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			onwarn(warning, defaultHandler) {
				// Noise coming from third-party packages we can't change
				if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids?.every((id) => id.includes('node_modules'))) return;
				if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
				defaultHandler(warning);
			}
		}
	}
});
