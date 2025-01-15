const colors = require('tailwindcss/colors');

module.exports = {
	darkMode: 'selector',
	content: ['./public/index.html', './src/app.html', './src/**/*.svelte', './src/**/**/*.svelte'],
	safelist: [
		'bg-energy',
		'bg-building',
		'bg-industry',
		'bg-agriculture',
		'bg-mobility',
		'bg-waste',
		'bg-fluorinatedGases',
		'bg-economy',
		'text-energy',
		'text-building',
		'text-industry',
		'text-agriculture',
		'text-mobility',
		'text-waste',
		'text-fluorinatedGases',
		'text-economy',
		'border-energy',
		'border-building',
		'border-industry',
		'border-agriculture',
		'border-mobility',
		'border-waste',
		'border-fluorinatedGases',
		'border-economy'
	],
	theme: {
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			black: '#000000',
			white: '#ffffff',
			energy: '#BD3737',
			building: '#4880A8',
			industry: '#373949',
			agriculture: '#65987D',
			mobility: '#F5AF4A',
			waste: '#B7693D',
			fluorinatedGases: '#7CAFBA',
			economy: '#64AE9C',
			green: {
				100: '#F7FCF5',
				200: '#E5F5E0',
				300: '#C7E9C0',
				400: '#A1D99B',
				500: '#74C476',
				600: '#41AB5D',
				700: '#238B45',
				800: '#006D2C',
				900: '#00441B',
				1000: '#000A04'
			},
			blue: {
				100: '#F7FBFF',
				200: '#DEEBF7',
				300: '#C6DBEF',
				400: '#9ECAE1',
				500: '#6BAED6',
				600: '#4292C6',
				700: '#2171B5',
				800: '#08519C',
				900: '#08306B',
				1000: '#020B18'
			},
			red: {
				100: '#FFF5F0',
				200: '#FEE0D2',
				300: '#FCBBA1',
				400: '#FC9272',
				500: '#FB6A4A',
				600: '#EF3B2C',
				700: '#CB181D',
				800: '#A50F15',
				900: '#67000D',
				1000: '#1A0003'
			},
			gray: colors.neutral,
			yellow: colors.yellow,
			orange: colors.orange,
			amber: colors.amber,
			budgetLight: '#FADEA5',
			budgetDefault: '#F56860',
			budgetDark: '#9E0669',
			budgetHistoric: '#268EA5'
		},
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				lg: '2rem'
			},
			screens: {
				sm: '100%',
				md: '100%',
				lg: '100%',
				xl: '1280px'
			}
		},
		extend: {}
	}
};
