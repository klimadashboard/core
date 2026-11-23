// $lib/components/charts/primitives/motion.ts
//
// Entrance ("build-up") transitions for chart marks. Used as `in:grow|global` / `in:wipe|global`
// inside the primitives, so every chart built from them animates without per-chart code.
// Svelte runs them via the Web Animations API: nothing on SSR, final attribute values stay
// in the DOM (SVG export is unaffected), and they only play when an element is inserted, not
// on data updates. `prefers-reduced-motion: reduce` skips them entirely.
import { prefersReducedMotion } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

/** Duration of `grow` */
export const DURATION = 700;
/** Total spread of the per-bar delay, independent of the number of bars */
export const STAGGER = 400;
/** Duration of `wipe`: marks at a line's end can start once it has (almost) arrived */
export const WIPE_DURATION = DURATION * 1.5;

/** Delay for the i-th of n elements so a series builds up left to right */
export const stagger = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * STAGGER : 0);

/**
 * Scale an element up from its baseline: vertical bars (default) or, with `axis: 'x'`, horizontal
 * HTML bars. SVG elements need `[transform-box:fill-box]`; all need an origin class.
 */
export function grow(
	_node: Element,
	{ delay = 0, duration = DURATION, axis = 'y' }: { delay?: number; duration?: number; axis?: 'x' | 'y' } = {}
) {
	if (prefersReducedMotion.current) return { duration: 0 };
	return {
		delay,
		duration,
		easing: cubicOut,
		css: (t: number) => `transform: scale${axis.toUpperCase()}(${t})`
	};
}

/** Reveal an element from left to right (lines draw, areas fill), keeping dashes and gradients intact */
export function wipe(_node: Element, { delay = 0, duration = WIPE_DURATION } = {}) {
	if (prefersReducedMotion.current) return { duration: 0 };
	return {
		delay,
		duration,
		easing: cubicOut,
		css: (t: number) => `clip-path: inset(-10% ${(1 - t) * 100}% -10% -10%)`
	};
}

/** Fade an element in, e.g. a label once the mark it belongs to has built up */
export function appear(_node: Element, { delay = 0, duration = 300 } = {}) {
	if (prefersReducedMotion.current) return { duration: 0 };
	return {
		delay,
		duration,
		easing: cubicOut,
		css: (t: number) => `opacity: ${t}`
	};
}
