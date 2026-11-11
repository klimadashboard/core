// $lib/components/charts/primitives/motion.ts
//
// Entrance ("build-up") transitions for chart marks. Used as `in:grow|global` / `in:wipe|global`
// inside the primitives, so every chart built from them animates without per-chart code.
// Svelte runs them via the Web Animations API: nothing on SSR, final attribute values stay
// in the DOM (SVG export is unaffected), and they only play when an element is inserted, not
// on data updates. `prefers-reduced-motion: reduce` skips them entirely.
import { prefersReducedMotion } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

const DURATION = 700;
/** Total spread of the per-bar delay, independent of the number of bars */
const STAGGER = 400;

/** Delay for the i-th of n elements so a series builds up left to right */
export const stagger = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * STAGGER : 0);

/** Scale an element up from its baseline. Needs `[transform-box:fill-box]` and an origin class. */
export function grow(_node: Element, { delay = 0, duration = DURATION } = {}) {
	if (prefersReducedMotion.current) return { duration: 0 };
	return { delay, duration, easing: cubicOut, css: (t: number) => `transform: scaleY(${t})` };
}

/** Reveal an element from left to right (lines draw, areas fill), keeping dashes and gradients intact */
export function wipe(_node: Element, { delay = 0, duration = DURATION * 1.5 } = {}) {
	if (prefersReducedMotion.current) return { duration: 0 };
	return {
		delay,
		duration,
		easing: cubicOut,
		css: (t: number) => `clip-path: inset(-10% ${(1 - t) * 100}% -10% -10%)`
	};
}
