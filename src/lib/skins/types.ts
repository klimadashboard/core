export interface SkinLogo {
	/** Path under /skins/<id>/ (self-hosted), ideally SVG */
	src: string;
	alt: string;
	href?: string;
	/** Text above the logo, e.g. "Gefördert vom" for funding notices */
	caption?: string;
	/** Rendered height in px — footer logos only (default 64) */
	height?: number;
}

export interface Skin {
	/** Permanent, URL-safe id used in `?skin=` — never rename */
	id: string;
	label: string;
	fonts?: {
		/** CSS font stack for body text */
		body?: string;
		/** CSS font stack for the card title and headings */
		heading?: string;
		headingTransform?: 'none' | 'uppercase';
		/** Letter-spacing of the card title (small headline above the chart), e.g. '0.03em' */
		headingTracking?: string;
		/** Self-hosted @font-face stylesheet, e.g. /skins/<id>/fonts.css */
		stylesheet?: string;
	};
	colors?: {
		/** Interface accent on light backgrounds — needs 4.5:1 on white */
		accent?: string;
		/** Interface accent on dark backgrounds — needs 4.5:1 on gray-900 */
		accentDark?: string;
	};
	/** Logos shown top-right in the chart card, on a white plate */
	logos?: SkinLogo[];
	/** How the Klimadashboard credit is shown next to skin logos (default 'compact') */
	attribution?: 'compact' | 'full';
	/** Optional strip at the bottom of the card content, e.g. partner and funding logos */
	footer?: {
		logos?: SkinLogo[];
	};
}
