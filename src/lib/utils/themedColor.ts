// Sector colours like industry (#373949) are nearly invisible on the dark background.
// These helpers give such colours a lighter variant for dark mode, keeping their hue.
//
// Usage: put `themedColorVars(color)` in a `style` attribute and use the classes
// `text-[color:var(--themed-color)] dark:text-[color:var(--themed-color-dark)]`
// (or `bg-[…]` instead of `text-[…]`).

/**
 * Lighter variant of a hex colour for dark mode if it is too dark to read there, else the
 * colour itself. Keeps the hue and raises saturation, so a dark slate (industry #373949)
 * turns into a clear blue-violet rather than a neutral grey that looks like other UI greys.
 */
export function darkModeColor(color: string): string {
	const match = /^#([0-9a-f]{6})$/i.exec(color);
	if (!match) return color;
	const n = parseInt(match[1], 16);
	const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	const [r, g, b] = rgb.map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	if (luminance >= 0.1) return color;

	const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
	return `hsl(${Math.round(h)} ${Math.round(Math.max(s, 0.45) * 100)}% 68%)`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	const h =
		max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
	return [h, s, l];
}

/** CSS custom properties `--themed-color` and `--themed-color-dark` for an inline style. */
export function themedColorVars(color: string | null | undefined): string {
	if (!color) return '';
	return `--themed-color: ${color}; --themed-color-dark: ${darkModeColor(color)};`;
}
