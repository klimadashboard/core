import type { Skin } from './types';

// Source: Gestaltungsleitfaden EMN (2010) + Klimapakt2030plus CD-Manual (30.10.2023),
// both in the tender documents (Leistungsverzeichnis, Anhang).
const skin: Skin = {
	id: 'metropolregion-nuernberg',
	label: 'Metropolregion Nürnberg · Klimapakt2030plus',
	fonts: {
		// CD web substitute for Trade Gothic LT Condensed No. 18 is Arial (system font, nothing loaded)
		body: "Arial, 'Helvetica Neue', Helvetica, 'Liberation Sans', sans-serif",
		// PLACEHOLDER: CD headline font is DIN 1451 Engschrift LT in caps. Until a webfont licence
		// and woff2 files exist, use our self-hosted Barlow Condensed (DIN-like). When available:
		// add static/skins/metropolregion-nuernberg/fonts.css, set `stylesheet`, prepend the family.
		heading: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
		headingTransform: 'uppercase'
	},
	colors: {
		// EMN-Rot #d40032 — 5.5:1 on white
		accent: '#d40032',
		// Klimapakt-Grün #94c11c — the CD forbids tinting EMN-Rot, which is too dark on gray-900
		accentDark: '#94c11c'
	},
	logos: [
		{
			// PLACEHOLDER file — replace with the official SVG
			src: '/skins/metropolregion-nuernberg/logo-emn.svg',
			alt: 'Europäische Metropolregion Nürnberg',
			href: 'https://www.metropolregion.nuernberg.de'
		},
		{
			// PLACEHOLDER file — replace with the official SVG
			src: '/skins/metropolregion-nuernberg/logo-klimapakt2030plus.svg',
			alt: 'Klimapakt2030plus',
			href: 'https://www.klimapakt2030plus.de'
		}
	],
	attribution: 'compact'
};

export default skin;
