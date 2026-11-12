import type { Skin } from './types';

// Adapted to www.klimapakt2030plus.de (checked 2026-10-29); CD reference: Klimapakt2030plus
// CD-Manual (30.10.2023) in the tender documents. Logos are taken from the website.
const skin: Skin = {
	id: 'metropolregion-nuernberg',
	label: 'Metropolregion Nürnberg · Klimapakt2030plus',
	site: 'de',
	fonts: {
		// Barlow Condensed (headings) + Barlow Semi Condensed (body), SIL OFL, self-hosted via
		// fonts.css — close to the website's condensed DIN / Trade Gothic look. The stylesheet is
		// only linked on skinned embeds, so other pages never load these files.
		stylesheet: '/skins/metropolregion-nuernberg/fonts.css',
		body: "'KD Skin Body', 'Arial Narrow', Arial, sans-serif",
		heading: "'KD Skin Heading', 'Arial Narrow', Arial, sans-serif",
		headingTransform: 'none',
		// Barlow Condensed Bold is too dense at eyebrow size; SemiBold reads closer to the website
		titleWeight: 600
	},
	colors: {
		// Website's dark Klimapakt green — 5.3:1 on white (the signature #a7be59 is only 2.1:1)
		accent: '#647235',
		// Website's signature Klimapakt green — 8.6:1 on gray-900
		accentDark: '#a7be59'
	},
	// Top-right keeps the regular Klimadashboard credit (links to the region page with
	// ?region=, e.g. klimadashboard.de/metropolregion-nuernberg). Partner and funding logos
	// sit in the footer.
	footer: {
		logos: [
			{
				// Combined EMN | Klimapakt2030plus lockup from the website header (CD: always together)
				src: '/skins/metropolregion-nuernberg/logo-emn-klimapakt2030plus.svg',
				alt: 'Europäische Metropolregion Nürnberg und Klimapakt2030plus',
				href: 'https://www.klimapakt2030plus.de',
				height: 36
			},
			{
				// From the website (474×231 JPG, includes "Gefördert durch:") — ask for the SVG
				src: '/skins/metropolregion-nuernberg/bmftr-gefoerdert-durch.jpg',
				alt: 'Gefördert durch: Bundesministerium für Forschung, Technologie und Raumfahrt'
			}
		]
	}
};

export default skin;
