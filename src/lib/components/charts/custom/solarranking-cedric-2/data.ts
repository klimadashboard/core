// Mock data for the Solarpotential Gemeinde prototype (Starnberg)
// TODO: Replace with real API / GraphQL data when wiring up the live version

export const GEMEINDE = {
	name: 'Starnberg',
	land: 'Bayern',
	landKurz: 'BY',
	kreis: 'Starnberg',
	ew: 24437,
	flaeche: 61.8,
	bez: 'Stadt',
	potential: 5.26,
	daecher: 11.06,
	dachPV: 9.3,
	freiPV: 0.4,
	balkonPV: 0.6,
	balkonAnlagen: 180,
	gebaeudeMitPV: 829,
	anzahlGeb: 7495,
	rankDE: 9428,
	rankDEGesamt: 10794,
	rankNachbarn: 9,
	rankNachbarnGesamt: 10,
	rankLand: 1970,
	rankLandGesamt: 2056,
	rankMittelBY: 58,
	rankMittelBYGesamt: 67,
	trend: 0.12,
	neuAnlagenMonat: 8,
	neuLeistungMonat: 65 // kW
};

export interface RankEntry {
	name: string;
	potential: number;
	daecher: number;
	ew: number;
	trend: number;
	mwp: number;
	rc: number; // rank change
	self?: boolean;
	km?: number;
}

// Sorted by potential descending
export const NAECHSTE: RankEntry[] = [
	{ name: 'Wörthsee', potential: 9.98, daecher: 16.06, ew: 5139, trend: 0.3, km: 6.2, mwp: 4.2, rc: 0 },
	{ name: 'Pöcking', potential: 6.05, daecher: 10.92, ew: 5518, trend: 0.12, km: 3.1, mwp: 3.4, rc: 1 },
	{ name: 'Berg', potential: 6.55, daecher: 11.78, ew: 8072, trend: 0.15, km: 4.5, mwp: 5.7, rc: -1 },
	{ name: 'Feldafing', potential: 6.89, daecher: 15.36, ew: 4360, trend: 0.1, km: 5.3, mwp: 2.7, rc: 2 },
	{ name: 'Tutzing', potential: 6.05, daecher: 12.1, ew: 9890, trend: 0.18, km: 7.8, mwp: 4.7, rc: 0 },
	{ name: 'Gauting', potential: 5.59, daecher: 9.8, ew: 21857, trend: 0.15, km: 8.2, mwp: 8.9, rc: -1 },
	{ name: 'Krailling', potential: 6.01, daecher: 11.84, ew: 7796, trend: 0.14, km: 9.1, mwp: 3.3, rc: 0 },
	{ name: 'Gilching', potential: 7.07, daecher: 13.61, ew: 19045, trend: 0.2, km: 9.7, mwp: 10.2, rc: 1 },
	{ name: 'Starnberg', potential: 5.26, daecher: 11.06, ew: 24437, trend: 0.12, km: 0, mwp: 9.3, rc: 0, self: true },
	{ name: 'Herrsching a.Ammersee', potential: 5.85, daecher: 14.77, ew: 11050, trend: 0.22, km: 10.4, mwp: 4.1, rc: -1 }
].sort((a, b) => b.potential - a.potential);

export const BAYERN_TOP: RankEntry[] = [
	{ name: 'Frickenhausen a.Main', potential: 39.69, daecher: 26.31, ew: 950, trend: 0.8, mwp: 3.9, rc: 0 },
	{ name: 'Kirchdorf', potential: 37.61, daecher: 38.05, ew: 1800, trend: 0.6, mwp: 9.3, rc: 1 },
	{ name: 'Niederschönenfeld', potential: 35.75, daecher: 26.05, ew: 2100, trend: 0.5, mwp: 6.9, rc: -1 },
	{ name: 'Wechingen', potential: 33.26, daecher: 37.26, ew: 1420, trend: 0.4, mwp: 6.6, rc: 2 },
	{ name: 'Attenhofen', potential: 30.4, daecher: 44.02, ew: 2600, trend: 0.3, mwp: 9.1, rc: 0 },
	{ name: 'Geslau', potential: 28.59, daecher: 20.93, ew: 1480, trend: 0.5, mwp: 9.9, rc: -1 },
	{ name: 'Kraftisried', potential: 28.26, daecher: 34.26, ew: 1240, trend: 0.4, mwp: 6.1, rc: 0 },
	{ name: 'Ehingen a.Ries', potential: 27.93, daecher: 28.55, ew: 1820, trend: 0.3, mwp: 4.0, rc: 1 },
	{ name: 'Engelsberg', potential: 26.85, daecher: 35.04, ew: 2300, trend: 0.6, mwp: 15.5, rc: -2 },
	{ name: 'Mamming', potential: 26.59, daecher: 27.0, ew: 3100, trend: 0.4, mwp: 19.8, rc: 0 }
];

// All 67 Mittelstädte in Bavaria (20k–99k EW), sorted by rank
export interface MittelstadtEntry {
	name: string;
	potential: number;
	trend: number;
	daecher: number;
	mwp: number;
	ew: number;
	rank: number;
	rc: number;
}

export const ALL_MITTEL_BY: MittelstadtEntry[] = [
	{ name: 'Memmingen', potential: 14.2, trend: 0.3, daecher: 19.4, mwp: 45.1, ew: 46000, rank: 1, rc: 0 },
	{ name: 'Kempten (Allgäu)', potential: 13.8, trend: 0.25, daecher: 18.7, mwp: 78.2, ew: 70000, rank: 2, rc: 1 },
	{ name: 'Rosenheim', potential: 13.1, trend: 0.2, daecher: 17.9, mwp: 82.4, ew: 63000, rank: 3, rc: -1 },
	{ name: 'Kaufbeuren', potential: 12.7, trend: 0.22, daecher: 17.2, mwp: 39.8, ew: 45000, rank: 4, rc: 0 },
	{ name: 'Landshut', potential: 12.4, trend: 0.18, daecher: 16.8, mwp: 124.3, ew: 75000, rank: 5, rc: 2 },
	{ name: 'Straubing', potential: 11.9, trend: 0.15, daecher: 16.1, mwp: 58.7, ew: 49000, rank: 6, rc: 0 },
	{ name: 'Weiden i.d.OPf.', potential: 11.5, trend: 0.14, daecher: 15.6, mwp: 49.2, ew: 42000, rank: 7, rc: -1 },
	{ name: 'Amberg', potential: 11.2, trend: 0.12, daecher: 15.1, mwp: 47.8, ew: 42000, rank: 8, rc: 0 },
	{ name: 'Ansbach', potential: 10.9, trend: 0.11, daecher: 14.7, mwp: 61.3, ew: 42000, rank: 9, rc: 1 },
	{ name: 'Schweinfurt', potential: 10.6, trend: 0.13, daecher: 14.3, mwp: 55.9, ew: 53000, rank: 10, rc: -1 },
	{ name: 'Aschaffenburg', potential: 10.3, trend: 0.1, daecher: 13.9, mwp: 72.1, ew: 71000, rank: 11, rc: 0 },
	{ name: 'Passau', potential: 10.1, trend: 0.09, daecher: 13.5, mwp: 55.4, ew: 52000, rank: 12, rc: 2 },
	{ name: 'Bamberg', potential: 9.8, trend: 0.08, daecher: 13.2, mwp: 77.6, ew: 78000, rank: 13, rc: 0 },
	{ name: 'Bayreuth', potential: 9.5, trend: 0.07, daecher: 12.8, mwp: 73.4, ew: 75000, rank: 14, rc: -1 },
	{ name: 'Coburg', potential: 9.2, trend: 0.09, daecher: 12.4, mwp: 42.1, ew: 41000, rank: 15, rc: 0 },
	{ name: 'Hof', potential: 8.9, trend: 0.06, daecher: 12.0, mwp: 44.8, ew: 46000, rank: 16, rc: 1 },
	{ name: 'Regensburg', potential: 8.7, trend: 0.08, daecher: 11.7, mwp: 152.3, ew: 94000, rank: 17, rc: 0 },
	{ name: 'Ingolstadt', potential: 8.4, trend: 0.07, daecher: 11.3, mwp: 195.4, ew: 98000, rank: 18, rc: -2 },
	{ name: 'Erlangen', potential: 8.1, trend: 0.06, daecher: 10.9, mwp: 91.2, ew: 114000, rank: 19, rc: 0 },
	{ name: 'Würzburg', potential: 7.8, trend: 0.05, daecher: 10.5, mwp: 101.7, ew: 128000, rank: 20, rc: 1 },
	{ name: 'Fürth', potential: 7.5, trend: 0.06, daecher: 10.1, mwp: 97.3, ew: 130000, rank: 21, rc: 0 },
	{ name: 'Augsburg', potential: 7.2, trend: 0.05, daecher: 9.7, mwp: 218.6, ew: 300000, rank: 22, rc: -1 },
	{ name: 'Nürnberg', potential: 7.0, trend: 0.04, daecher: 9.4, mwp: 382.1, ew: 525000, rank: 23, rc: 0 },
	{ name: 'Schwabach', potential: 6.8, trend: 0.05, daecher: 9.1, mwp: 35.4, ew: 42000, rank: 24, rc: 2 },
	{ name: 'Neu-Ulm', potential: 6.5, trend: 0.04, daecher: 8.8, mwp: 65.8, ew: 60000, rank: 25, rc: 0 },
	{ name: 'Garmisch-Partenkirchen', potential: 6.3, trend: 0.03, daecher: 8.5, mwp: 14.7, ew: 27000, rank: 26, rc: -1 },
	{ name: 'Fürstenfeldbruck', potential: 6.1, trend: 0.04, daecher: 8.2, mwp: 38.9, ew: 38000, rank: 27, rc: 0 },
	{ name: 'Dachau', potential: 5.9, trend: 0.03, daecher: 7.9, mwp: 44.2, ew: 49000, rank: 28, rc: 1 },
	{ name: 'Erding', potential: 5.8, trend: 0.04, daecher: 7.7, mwp: 40.1, ew: 38000, rank: 29, rc: 0 },
	{ name: 'Germering', potential: 5.7, trend: 0.03, daecher: 7.5, mwp: 47.8, ew: 41000, rank: 30, rc: -1 },
	{ name: 'Freising', potential: 5.6, trend: 0.03, daecher: 7.4, mwp: 52.3, ew: 50000, rank: 31, rc: 0 },
	{ name: 'Landsberg a.Lech', potential: 5.5, trend: 0.02, daecher: 7.2, mwp: 36.7, ew: 30000, rank: 32, rc: 2 },
	{ name: 'Puchheim', potential: 5.45, trend: 0.03, daecher: 7.1, mwp: 29.4, ew: 22000, rank: 33, rc: 0 },
	{ name: 'Unterschleißheim', potential: 5.4, trend: 0.02, daecher: 7.0, mwp: 41.2, ew: 28000, rank: 34, rc: -1 },
	{ name: 'Haar', potential: 5.35, trend: 0.02, daecher: 6.9, mwp: 28.6, ew: 21000, rank: 35, rc: 0 },
	{ name: 'Vaterstetten', potential: 5.3, trend: 0.02, daecher: 6.8, mwp: 38.9, ew: 34000, rank: 36, rc: 0 },
	{ name: 'Kirchheim b.München', potential: 5.28, trend: 0.01, daecher: 6.7, mwp: 24.1, ew: 13000, rank: 37, rc: 1 },
	{ name: 'Gauting', potential: 5.26, trend: 0.02, daecher: 9.8, mwp: 8.9, ew: 21857, rank: 38, rc: 0 },
	{ name: 'Gilching', potential: 5.24, trend: 0.02, daecher: 13.6, mwp: 10.2, ew: 19045, rank: 39, rc: -1 },
	{ name: 'Markt Schwaben', potential: 5.2, trend: 0.01, daecher: 6.6, mwp: 22.8, ew: 14000, rank: 40, rc: 0 },
	{ name: 'Geretsried', potential: 5.15, trend: 0.02, daecher: 6.5, mwp: 31.4, ew: 26000, rank: 41, rc: 1 },
	{ name: 'Gröbenzell', potential: 5.1, trend: 0.01, daecher: 6.4, mwp: 25.7, ew: 21000, rank: 42, rc: 0 },
	{ name: 'Eching', potential: 5.05, trend: 0.01, daecher: 6.3, mwp: 32.1, ew: 14000, rank: 43, rc: -1 },
	{ name: 'Neufahrn b.Freising', potential: 5.0, trend: 0.01, daecher: 6.2, mwp: 29.8, ew: 21000, rank: 44, rc: 0 },
	{ name: 'Waldkraiburg', potential: 4.95, trend: 0.01, daecher: 6.1, mwp: 19.3, ew: 24000, rank: 45, rc: 2 },
	{ name: 'Olching', potential: 4.9, trend: 0.01, daecher: 6.0, mwp: 33.4, ew: 28000, rank: 46, rc: 0 },
	{ name: 'Penzberg', potential: 4.85, trend: 0.01, daecher: 5.9, mwp: 16.7, ew: 16000, rank: 47, rc: -1 },
	{ name: 'Weilheim i.OB', potential: 4.8, trend: 0.01, daecher: 5.8, mwp: 21.4, ew: 21000, rank: 48, rc: 0 },
	{ name: 'Schwandorf', potential: 4.75, trend: 0.01, daecher: 5.7, mwp: 23.8, ew: 29000, rank: 49, rc: 1 },
	{ name: 'Deggendorf', potential: 4.7, trend: 0.01, daecher: 5.6, mwp: 27.9, ew: 34000, rank: 50, rc: 0 },
	{ name: 'Neuburg a.d.Donau', potential: 4.65, trend: 0.0, daecher: 5.5, mwp: 20.1, ew: 30000, rank: 51, rc: -1 },
	{ name: 'Mühldorf a.Inn', potential: 4.6, trend: 0.01, daecher: 5.4, mwp: 18.6, ew: 19000, rank: 52, rc: 0 },
	{ name: 'Traunreut', potential: 4.55, trend: 0.01, daecher: 5.3, mwp: 22.4, ew: 22000, rank: 53, rc: 2 },
	{ name: 'Forchheim', potential: 4.5, trend: 0.0, daecher: 5.2, mwp: 31.8, ew: 32000, rank: 54, rc: 0 },
	{ name: 'Bad Kissingen', potential: 4.45, trend: 0.0, daecher: 5.1, mwp: 12.9, ew: 23000, rank: 55, rc: -1 },
	{ name: 'Weißenburg i.Bay.', potential: 4.4, trend: 0.0, daecher: 5.0, mwp: 18.3, ew: 19000, rank: 56, rc: 0 },
	{ name: 'Traunstein', potential: 4.35, trend: 0.0, daecher: 4.9, mwp: 21.7, ew: 22000, rank: 57, rc: 1 },
	{ name: 'Starnberg', potential: 5.26, trend: 0.12, daecher: 11.06, mwp: 9.3, ew: 24437, rank: 58, rc: 0 },
	{ name: 'Lauf a.d.Pegnitz', potential: 4.3, trend: 0.0, daecher: 4.8, mwp: 23.1, ew: 26000, rank: 59, rc: -2 },
	{ name: 'Neumarkt i.d.OPf.', potential: 4.25, trend: 0.0, daecher: 4.7, mwp: 30.4, ew: 40000, rank: 60, rc: 0 },
	{ name: 'Aichach', potential: 4.2, trend: 0.0, daecher: 4.6, mwp: 15.8, ew: 22000, rank: 61, rc: 1 },
	{ name: 'Füssen', potential: 4.15, trend: 0.0, daecher: 4.5, mwp: 14.2, ew: 15000, rank: 62, rc: 0 },
	{ name: 'Bad Tölz', potential: 4.1, trend: 0.0, daecher: 4.4, mwp: 16.9, ew: 18000, rank: 63, rc: -1 },
	{ name: 'Marktoberdorf', potential: 4.05, trend: 0.0, daecher: 4.3, mwp: 17.4, ew: 19000, rank: 64, rc: 0 },
	{ name: 'Lindau (Bodensee)', potential: 4.0, trend: 0.0, daecher: 4.2, mwp: 26.8, ew: 26000, rank: 65, rc: 2 },
	{ name: 'Bad Reichenhall', potential: 3.95, trend: 0.0, daecher: 4.1, mwp: 12.3, ew: 18000, rank: 66, rc: 0 },
	{ name: 'Miesbach', potential: 3.8, trend: -0.01, daecher: 3.9, mwp: 9.8, ew: 12000, rank: 67, rc: -1 }
];

export interface Award {
	icon: string;
	name: string;
	desc: string;
	date?: string;
	remaining?: string;
	color: 'blue' | 'green' | 'gold' | 'purple';
	unlocked: boolean;
}

export const AWARDS: Award[] = [
	{ icon: '☀', name: '5-Prozent-Klub', desc: '5 % des Solarpotentials in Starnberg wird genutzt', date: 'Dez 2025', color: 'blue', unlocked: true },
	{ icon: '🏠', name: 'Jedes 10. Dach', desc: '10 % aller Gebäude haben eine PV-Anlage', date: 'Aug 2024', color: 'green', unlocked: true },
	{ icon: '⚡', name: '500 Dächer', desc: '500 PV-Anlagen auf Dächern in Starnberg', date: 'Nov 2018', color: 'gold', unlocked: true },
	{ icon: '🔋', name: '5-Megawatt-Stadt', desc: '5 MWp installierte Dach-Leistung', date: 'Jul 2019', color: 'green', unlocked: true },
	{ icon: '⚡', name: '1.000 Dächer', desc: '1.000 PV-Anlagen auf Dächern', remaining: 'Noch 171 Anlagen', color: 'gold', unlocked: false },
	{ icon: '🔋', name: '10-Megawatt-Stadt', desc: '10 MWp installierte Dach-Leistung', remaining: 'Noch 0,7 MWp', color: 'green', unlocked: false },
	{ icon: '☀', name: '10-Prozent-Klub', desc: '10 % des Solarpotentials genutzt', remaining: 'Noch 4,7 Prozentpunkte', color: 'blue', unlocked: false }
];

export interface BadgeLevel {
	threshold: string;
	done: boolean;
	date?: string;
}

export interface Badge {
	id: string;
	icon: string;
	label: string;
	levels: BadgeLevel[];
	current: string;
	desc: string;
}

export const BADGES: Badge[] = [
	{
		id: 'anlagen',
		icon: '⚡',
		label: 'PV-Anlagen',
		levels: [
			{ threshold: '100', done: true, date: 'Jun 2006' },
			{ threshold: '500', done: true, date: 'Nov 2018' },
			{ threshold: '1.000', done: false },
			{ threshold: '2.500', done: false },
			{ threshold: '5.000', done: false }
		],
		current: '829',
		desc: 'Registrierte PV-Anlagen'
	},
	{
		id: 'potential',
		icon: '☀',
		label: 'Solarpotential',
		levels: [
			{ threshold: '1 %', done: true, date: 'Apr 2012' },
			{ threshold: '2,5 %', done: true, date: 'Aug 2019' },
			{ threshold: '5 %', done: true, date: 'Dez 2025' },
			{ threshold: '10 %', done: false },
			{ threshold: '25 %', done: false }
		],
		current: '5,3 %',
		desc: 'Genutztes Dach-Potential'
	},
	{
		id: 'daecher',
		icon: '🏠',
		label: 'Dächer belegt',
		levels: [
			{ threshold: '5 %', done: true, date: 'Mär 2017' },
			{ threshold: '10 %', done: true, date: 'Aug 2024' },
			{ threshold: '15 %', done: false },
			{ threshold: '25 %', done: false },
			{ threshold: '50 %', done: false }
		],
		current: '11,1 %',
		desc: 'Anteil Dächer mit PV'
	},
	{
		id: 'leistung',
		icon: '🔋',
		label: 'Installierte Leistung',
		levels: [
			{ threshold: '1 MWp', done: true, date: 'Okt 2009' },
			{ threshold: '5 MWp', done: true, date: 'Jul 2019' },
			{ threshold: '10 MWp', done: false },
			{ threshold: '25 MWp', done: false },
			{ threshold: '50 MWp', done: false }
		],
		current: '9,3 MWp',
		desc: 'Dach-PV installiert'
	},
	{
		id: 'top-land',
		icon: '🏅',
		label: 'Top im Bundesland',
		levels: [
			{ threshold: 'Top 50 %', done: false },
			{ threshold: 'Top 25 %', done: false },
			{ threshold: 'Top 10 %', done: false },
			{ threshold: 'Top 5 %', done: false },
			{ threshold: 'Top 1 %', done: false }
		],
		current: 'Bottom 5 %',
		desc: 'Rang im Bundesland'
	},
	{
		id: 'nachbar',
		icon: '📍',
		label: 'Nachbarschafts-Champion',
		levels: [
			{ threshold: 'Top 5', done: false },
			{ threshold: 'Top 3', done: false },
			{ threshold: 'Platz 1', done: false }
		],
		current: 'Platz 9',
		desc: 'Rang unter Nachbargemeinden'
	}
];
