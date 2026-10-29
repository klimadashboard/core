import type { Skin } from './types';

// Adapted to www.klimapakt2030plus.de (checked 2026-10-29); CD reference: Klimapakt2030plus
// CD-Manual (30.10.2023) in the tender documents. Logos are taken from the website.
const skin: Skin = {
	id: 'metropolregion-nuernberg',
	label: 'Metropolregion Nürnberg · Klimapakt2030plus',
	fonts: {
		// The website uses DIN Condensed (headings) and Trade Gothic LT W01 Cond No. 18 (body).
		// Both are commercial webfonts licensed to their domain, so we can't self-host copies.
		// Stand-in: our self-hosted Barlow Condensed (DIN-like) for both. If the licence can be
		// extended to klimadashboard.de, add /skins/metropolregion-nuernberg/fonts.css, set
		// `stylesheet` and prepend the families below.
		body: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
		heading: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
		headingTransform: 'none'
	},
	colors: {
		// Website's dark Klimapakt green — 5.3:1 on white (the signature #a7be59 is only 2.1:1)
		accent: '#647235',
		// Website's signature Klimapakt green — 8.6:1 on gray-900
		accentDark: '#a7be59'
	},
	logos: [
		{
			// Combined EMN | Klimapakt2030plus lockup from the website header (CD: always together)
			src: '/skins/metropolregion-nuernberg/logo-emn-klimapakt2030plus.svg',
			alt: 'Europäische Metropolregion Nürnberg und Klimapakt2030plus',
			href: 'https://www.klimapakt2030plus.de'
		}
	],
	attribution: 'compact',
	// Offer p.3: funding notice + link to the full dashboard on klimadashboard.de
	footer: {
		logos: [
			{
				// From the website (474×231 JPG, includes "Gefördert durch:") — ask for the SVG
				src: '/skins/metropolregion-nuernberg/bmftr-gefoerdert-durch.jpg',
				alt: 'Gefördert durch: Bundesministerium für Forschung, Technologie und Raumfahrt'
			}
		],
		link: {
			// Planned URL of the full dashboard (offer p.3) — not live yet
			href: 'https://klimadashboard.de/metropolregion-nuernberg',
			label: 'Gesamtdashboard auf klimadashboard.de'
		}
	}
};

export default skin;
