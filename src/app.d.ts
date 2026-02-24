/// <reference types="@sveltejs/kit" />

interface Window {
	rybbit?: {
		event: (name: string, properties?: Record<string, string | number>) => void;
	};
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	// interface Locals {}
	// interface Platform {}
	// interface Session {}
	// interface Stuff {}
}
