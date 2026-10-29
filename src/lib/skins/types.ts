export interface SkinLogo {
	/** Path under /skins/<id>/ (self-hosted), ideally SVG */
	src: string;
	alt: string;
	href?: string;
	/** Text above the logo, e.g. "Gefördert vom" for funding notices */
	caption?: string;
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
	/** Replaces the top-right Klimadashboard wordmark with a link, e.g. to the partner's full dashboard */
	dashboardLink?: { href: string; label: string };
	/** Optional strip at the bottom of the card content, e.g. funding logos */
	footer?: {
		logos?: SkinLogo[];
	};
}
