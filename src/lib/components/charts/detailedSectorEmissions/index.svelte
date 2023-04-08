<script>
	import HistoryChart from './HistoryChart.svelte';
	import SectorsTreeChart from './SectorsTreeChart.svelte';
	import { glossaryItem } from '$lib/stores/glossary';
	import { PUBLIC_VERSION } from '$env/static/public';

	let dataset = null;
	let explanations = null;

	let maxYear = 2020;

	let years = Array.from({ length: maxYear - 1990 + 1 }).map((_, i) => 1990 + i);

	let ghGas = [
		{ key: 'THG', label: 'Alle Treibhausgase' },
		{ key: 'CO2', label: 'CO₂' },
		{ key: 'CH4', label: 'Methan' },
		{ key: 'N2O', label: 'Lachgas (N₂O)' },
		{ key: 'FLU', label: 'Fluorierte Gase' }
	];

	let ksgSectors = [
		{
			label: 'Industrie',
			color: 'industry',
			colorCode: '#373949',
			colorCodeHighlighted: '#21222c',
			colorCodeLight: '#e2e3e9',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Mobilität',
			color: 'traffic',
			colorCode: '#f6af4c',
			colorCodeHighlighted: '#f3991b',
			colorCodeLight: 'hsl(35, 90%, 90%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Energie',
			color: 'energy',
			colorCode: '#be3737',
			colorCodeHighlighted: '#962c2c',
			colorCodeLight: 'hsl(0, 55%, 90%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Gebäude',
			color: 'buildings',
			colorCode: 'hsl(205, 40%, 47%)',
			colorCodeHighlighted: 'hsl(205, 40%, 37%)',
			colorCodeLight: 'hsl(205, 40%, 90%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Landwirtschaft',
			color: 'agriculture',
			colorCode: 'hsl(148, 20%, 50%)',
			colorCodeHighlighted: 'hsl(148, 20%, 40%)',
			colorCodeLight: 'hsl(148, 20%, 90%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Abfall',
			color: 'waste',
			colorCode: 'hsl(22, 50%, 48%)',
			colorCodeHighlighted: 'hsl(22, 50%, 38%)',
			colorCodeLight: 'hsl(22, 50%, 90%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Fluorierte Gase',
			color: 'fluorinated',
			colorCode: 'hsl(191, 31%, 61%)',
			colorCodeHighlighted: 'hsl(191, 31%, 51%)',
			colorCodeLight: 'hsl(191, 31%, 90%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Memo',
			color: 'memo',
			colorCode: 'hsl(227, 38%, 61%)',
			colorCodeHighlighted: 'hsl(227, 38%, 51%)',
			icon: (size) =>
				`<svg width='${size * 30}' height='${
					size * 30
				}' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		}
	];
	const colorForKey = (key) => ksgSectors.find((sector) => sector.color == key);
	let rows = [2, 3, (sortedData?.length || 8) - 5];

	let crfIcons = [
		// Auto
		{
			codes: ['1 A 3 b 1'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 66 49" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1437_83)"><path d="M16.2777 45.5775C19.8736 45.5775 22.7887 42.6625 22.7887 39.0664C22.7887 35.4704 19.8736 32.5554 16.2777 32.5554C12.6817 32.5554 9.7666 35.4704 9.7666 39.0664C9.7666 42.6625 12.6817 45.5775 16.2777 45.5775Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M48.8331 45.5775C52.4292 45.5775 55.3442 42.6625 55.3442 39.0664C55.3442 35.4704 52.4292 32.5554 48.8331 32.5554C45.237 32.5554 42.322 35.4704 42.322 39.0664C42.322 42.6625 45.237 45.5775 48.8331 45.5775Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.76669 39.0663H3.25562V19.5331M3.25562 19.5331L9.76669 3.25543H39.0665L52.0887 19.5331M3.25562 19.5331H52.0887M52.0887 19.5331H55.3442C57.0709 19.5331 58.727 20.2191 59.9482 21.4402C61.1693 22.6612 61.8553 24.3174 61.8553 26.0442V39.0663H55.3442M32.5554 19.5331V3.25543" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.7888 39.0663H42.322" stroke="white" stroke-width="6.51107" stroke-linejoin="round"/></g><defs><clipPath id="clip0_1437_83"><rect width="65.1107" height="48.8331" fill="white"/></clipPath></defs></svg>`
		},
		// Sattelschlepper
		{
			codes: ['1 A 3 b 3'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 83 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M65.5111 56.0221C69.1071 56.0221 72.0221 53.1071 72.0221 49.5111C72.0221 45.915 69.1071 43 65.5111 43C61.915 43 59 45.915 59 49.5111C59 53.1071 61.915 56.0221 65.5111 56.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M35.5111 56.0221C39.1071 56.0221 42.0221 53.1071 42.0221 49.5111C42.0221 45.915 39.1071 43 35.5111 43C31.915 43 29 45.915 29 49.5111C29 53.1071 31.915 56.0221 35.5111 56.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5111 56.0221C21.1071 56.0221 24.0221 53.1071 24.0221 49.5111C24.0221 45.915 21.1071 43 17.5111 43C13.915 43 11 45.915 11 49.5111C11 53.1071 13.915 56.0221 17.5111 56.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M59 10.5V9C59 6.23858 56.7614 4 54 4H52" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M79 21.1522V38C79 39.6569 77.6569 41 76 41H59V12C59 11.4477 59.4477 11 60 11H69.7331C70.0159 11 70.2855 11.1198 70.4751 11.3297L78.7421 20.4819C78.9081 20.6657 79 20.9045 79 21.1522Z" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M57 51L44 51" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M11 51L5 51" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M18 27L18 42" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M36 27L36 42" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M59 42H5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><rect x="4" y="7" width="47" height="26" rx="13" stroke="white" stroke-width="6.45"/></svg>`
		},
		// Campervan
		// { codes: ['1 A 3 b 2'], icon: (size) => `<svg width="${size * 30}" height="${size * 50}" viewBox="0 0 85 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.0111 46.5221C30.6071 46.5221 33.5221 43.6071 33.5221 40.0111C33.5221 36.415 30.6071 33.5 27.0111 33.5C23.415 33.5 20.5 36.415 20.5 40.0111C20.5 43.6071 23.415 46.5221 27.0111 46.5221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M65.0111 46.5221C68.6071 46.5221 71.5221 43.6071 71.5221 40.0111C71.5221 36.415 68.6071 33.5 65.0111 33.5C61.415 33.5 58.5 36.415 58.5 40.0111C58.5 43.6071 61.415 46.5221 65.0111 46.5221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 40V5C8 4.44772 8.44772 4 9 4H66.4683C66.8007 4 67.1114 4.16523 67.2973 4.44086L77.3977 19.4173C80.0715 23.3819 81.5 28.0548 81.5 32.8367V39C81.5 39.5523 81.0523 40 80.5 40H71M4 40H20.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M33.5 40H58.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M79 22.5H8" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M52.5 5.5V22.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// Schottertranspo30
		{
			codes: ['1 A 3 b 2'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 72 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.9008 40H12.5659C12.1707 40 11.8126 39.7673 11.6521 39.4061L4.08619 22.3834C4.02936 22.2555 4 22.1172 4 21.9773V10.3053C4 9.75298 4.44772 9.30526 5 9.30526H35.6971C35.9783 9.30526 36.2465 9.18687 36.436 8.97909L40.6792 4.32618C40.8686 4.1184 41.1369 4 41.4181 4H59.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M25.5111 46.0221C29.107 46.0221 32.0221 43.1071 32.0221 39.5111C32.0221 35.915 29.107 33 25.5111 33C21.9151 33 19 35.915 19 39.5111C19 43.1071 21.9151 46.0221 25.5111 46.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M58.5111 46.0221C62.107 46.0221 65.0221 43.1071 65.0221 39.5111C65.0221 35.915 62.107 33 58.5111 33C54.9151 33 52 35.915 52 39.5111C52 43.1071 54.9151 46.0221 58.5111 46.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 40L52 40" stroke="white" stroke-width="6.45"/><path d="M58.8 33H67C67.5523 33 68 32.5523 68 32V25.7532C68 25.5246 67.9217 25.303 67.7782 25.1252L59.1002 14.372C58.9104 14.1367 58.6243 14 58.322 14H49" stroke="white" stroke-width="6.45"/><path d="M41 40L51 4" stroke="white" stroke-width="6.45"/><path d="M7 21H15" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`
		},
		// Lieferwagen
		// { codes: ['1 A 3 b 2'], icon: (size) => `<svg width="${size * 30}" height="${size * 55}" viewBox="0 0 76 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.5111 51.0221C27.107 51.0221 30.0221 48.1071 30.0221 44.5111C30.0221 40.915 27.107 38 23.5111 38C19.9151 38 17 40.915 17 44.5111C17 48.1071 19.9151 51.0221 23.5111 51.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M59.0111 51.0221C62.607 51.0221 65.5221 48.1071 65.5221 44.5111C65.5221 40.915 62.607 38 59.0111 38C55.4151 38 52.5 40.915 52.5 44.5111C52.5 48.1071 55.4151 51.0221 59.0111 51.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 45V14.5L44.371 4H9V45" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 15H68.3636L72 25.5V43C72 44.1046 71.1046 45 70 45H68.3636" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 45H30" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 45H4.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M4 28H22" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// LKW-Kabi30
		// { codes: ['1 A 3 b 2'], icon: (size) => `<svg width="${size * 30}" height="${size * 58}" viewBox="0 0 76 58" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M56.4889 54.0221C52.893 54.0221 49.9779 51.1071 49.9779 47.5111C49.9779 43.915 52.893 41 56.4889 41C60.0849 41 63 43.915 63 47.5111C63 51.1071 60.0849 54.0221 56.4889 54.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.4889 54.3222C21.8929 54.3222 18.9779 51.4072 18.9779 47.8111C18.9779 44.2151 21.8929 41.3 25.4889 41.3C29.085 41.3 32 44.2151 32 47.8111C32 51.4072 29.085 54.3222 25.4889 54.3222Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 48H9.43448M17.6979 48H9.43448M63.7366 48H71C71.5523 48 72 47.5523 72 47V33H15.4345C12.1208 33 9.43448 35.6863 9.43448 39V48M50.1517 48H32.2759" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M58 10V31" stroke="white" stroke-width="6.45"/><path d="M41 48V10C41 9.44772 41.4477 9 42 9H55C64.3888 9 72 16.6112 72 26V39.9706" stroke="white" stroke-width="6.45"/><path d="M41 10.5V9C41 6.23858 38.7614 4 36 4H34" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M41 10.5V9C41 6.23858 38.7614 4 36 4H34" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// Energ30
		{
			codes: ['1 A 2 g'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 53 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M29.8018 4V26.5765H49.1531L23.3513 62.054V39.4774H4L29.8018 4Z" stroke="white" stroke-width="6.45044" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		},
		// Öl-Pipeline
		{
			codes: ['2 A'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 76 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M45.9333 37.5187C45.9333 41.5561 42.3796 44.8265 38 44.8265C33.6203 44.8265 30.0667 41.553 30.0667 37.5187C30.0667 33.4844 38 25.5599 38 25.5599C38 25.5599 45.9333 33.4813 45.9333 37.5187Z" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 18.6266V54.8932" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M4 18.6266V54.8932" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M21.6924 49.0539L19.1915 51.0901L21.6924 49.0539ZM20.5598 24.4101L23.2362 26.2094L20.5598 24.4101ZM55.01 24.4101L52.3336 26.2094L55.01 24.4101ZM53.8773 49.0539L56.3783 51.0901L53.8773 49.0539ZM51.3764 47.0177C48.1595 50.9689 43.2671 53.4837 37.7849 53.4837V59.9337C45.2889 59.9337 51.989 56.4811 56.3783 51.0901L51.3764 47.0177ZM71 45.4454H54.672V51.8954H71V45.4454ZM68.775 25.8704V47.6704H75.225V25.8704H68.775ZM55.8605 28.0954H71V21.6454H55.8605V28.0954ZM37.7849 18.4516C43.8422 18.4516 49.1833 21.5235 52.3336 26.2094L57.6863 22.6107C53.3889 16.2185 46.0799 12.0016 37.7849 12.0016V18.4516ZM23.2362 26.2094C26.3865 21.5235 31.7275 18.4516 37.7849 18.4516V12.0016C29.4898 12.0016 22.1809 16.2185 17.8834 22.6107L23.2362 26.2094ZM5 28.0954H19.7093V21.6454H5V28.0954ZM7.225 47.6704V25.8704H0.775V47.6704H7.225ZM20.8978 45.4454H5V51.8954H20.8978V45.4454ZM37.7849 53.4837C32.3027 53.4837 27.4103 50.9689 24.1933 47.0177L19.1915 51.0901C23.5808 56.4811 30.2809 59.9337 37.7849 59.9337V53.4837ZM20.8978 51.8954C20.1961 51.8954 19.5827 51.5706 19.1915 51.0901L24.1933 47.0177C23.4119 46.058 22.2174 45.4454 20.8978 45.4454V51.8954ZM0.775 47.6704C0.775 50.0038 2.66659 51.8954 5 51.8954V45.4454C6.22884 45.4454 7.225 46.4416 7.225 47.6704H0.775ZM5 21.6454C2.6666 21.6454 0.775 23.537 0.775 25.8704H7.225C7.225 27.0992 6.22883 28.0954 5 28.0954V21.6454ZM17.8834 22.6107C18.265 22.0431 18.9312 21.6454 19.7093 21.6454V28.0954C21.1722 28.0954 22.4725 27.3453 23.2362 26.2094L17.8834 22.6107ZM55.8605 21.6454C56.6386 21.6454 57.3047 22.0431 57.6863 22.6107L52.3336 26.2094C53.0972 27.3453 54.3976 28.0954 55.8605 28.0954V21.6454ZM75.225 25.8704C75.225 23.537 73.3334 21.6454 71 21.6454V28.0954C69.7712 28.0954 68.775 27.0992 68.775 25.8704H75.225ZM71 51.8954C73.3334 51.8954 75.225 50.0038 75.225 47.6704H68.775C68.775 46.4416 69.7712 45.4454 71 45.4454V51.8954ZM56.3783 51.0901C55.9871 51.5706 55.3736 51.8954 54.672 51.8954V45.4454C53.3523 45.4454 52.1578 46.058 51.3764 47.0177L56.3783 51.0901Z" fill="white"/><path d="M38 15.2266V3.89322" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M44.8 3.89322L31.2 3.89322" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`
		},
		// Valve
		{
			codes: ['1 A 2 c'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 90 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M45 13V4" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M56 4L35 4" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M8 60V35C8 26.7157 14.7157 20 23 20H31M31 35.814H25.64C24.5354 35.814 23.64 36.7094 23.64 37.814V60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M82 60V35C82 26.7157 75.2843 20 67 20H60M60 35.814H64.4167C65.5212 35.814 66.4167 36.7094 66.4167 37.814V60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><rect x="31" y="15" width="28" height="25" rx="2" stroke="white" stroke-width="6.45"/><path d="M4 60L86 60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M4 50H28" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M62 50H86" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`
		},
		// Silo
		// { codes: [''], icon: (size) => `<svg width="${size * 30}" height="${ size * 30 }" viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 66L64 66" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M28 18.5C28 10.4919 34.4919 4 42.5 4V4C50.5081 4 57 10.4919 57 18.5V66H28V18.5Z" stroke="white" stroke-width="6.45"/><path d="M30 21L56 21" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M46 17V52" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M10 49V66" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M5 50L27 45" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// Speicher
		// {codes: [''],icon: (size) =>`<svg width="${size * 30}" height="${size * 30}" viewBox="0 0 69 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 13.3299C4 12.8731 4.31738 12.4722 4.76021 12.3601C27.743 6.54436 39.9352 6.54661 64.2265 12.3673C64.6754 12.4749 65 12.8788 65 13.3404V60C65 60.5523 64.5523 61 64 61H5C4.44771 61 4 60.5523 4 60V13.3299Z" stroke="white" stroke-width="6.45"/><path d="M37 4V60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M51 4V60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35.5333 19.1373L52 20.6343" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35.5333 34.1071L52 35.6041" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35.5333 48.0768L52 49.5738" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`},
		// Ochse
		// {codes: [''],icon: (size) =>`<svg width="${size * 30}" height="${size * 30}" viewBox="0 0 86 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M82 10H29C20.7157 10 14 16.7157 14 25V51.5858C14 52.4767 15.0771 52.9229 15.7071 52.2929L28.2071 39.7929C28.3946 39.6054 28.649 39.5 28.9142 39.5H47.1243C47.3665 39.5 47.6005 39.5879 47.7828 39.7474L61.8415 52.0488C62.4881 52.6146 63.5 52.1554 63.5 51.2962V30" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M32 10H14C8.47715 10 4 14.4772 4 20V31" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M76.5 4L70.7891 25.5257C70.3239 27.2792 68.7369 28.5 66.9228 28.5H61.5772C59.7631 28.5 58.1761 27.2792 57.7109 25.5257L52 4" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`},
		// Kuh
		{
			codes: ['3 A'],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 87 62" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49 11H54.9565C55.5088 11 55.9565 11.4477 55.9565 12V21.9565C55.9565 26.9511 60.0054 31 65 31V31" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M49 11H54.9565C55.5088 11 55.9565 11.4477 55.9565 12V21.9565C55.9565 26.9511 60.0054 31 65 31V31" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M83 11H77.0435C76.4912 11 76.0435 11.4477 76.0435 12V21.9565C76.0435 26.9511 71.9946 31 67 31V31" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M56 12C59.0303 9.73613 67.2727 6.56671 76 12" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M62 4V9" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M70 4V9" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35 19H31C21.6112 19 14 26.6112 14 36V53.9343C14 56.1797 15.8203 58 18.0657 58V58C19.5645 58 20.9418 57.1754 21.6495 55.8542L27.7173 44.5278C27.8913 44.2028 28.2301 44 28.5987 44H46.6924C47.0567 44 47.3923 44.1982 47.5681 44.5173L54.7149 57.4827C54.8908 57.8018 55.2263 58 55.5906 58H58.161C58.6462 58 59.0615 57.6516 59.1458 57.1737L63 35.3256" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M53.5 19H17C9.8203 19 4 24.8203 4 32V42" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`
		},
		// Kalb
		// {codes: [''],icon: (size) =>`<svg width="${size * 30}" height="${size * 30}" viewBox="0 0 83 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M53.6437 12.2436H27.6404C19.156 12.2436 12.6217 19.7302 13.7689 28.1366L17.4534 55.1352C17.521 55.6307 17.9442 56 18.4442 56H23.8129C24.2877 56 24.6971 55.6661 24.7925 55.201L26.5741 46.5183C27.3376 42.7974 30.6124 40.1263 34.4109 40.1263H36.5606C40.359 40.1263 43.6338 42.7974 44.3973 46.5183L46.1789 55.201C46.2744 55.6661 46.6837 56 47.1585 56H52.5652C53.1472 56 53.6061 55.5049 53.5613 54.9246C52.6984 43.7439 51.4739 28.7308 62.4513 28.7308L77.1035 25.9368C77.7698 25.8098 78.3262 25.3538 78.5817 24.7254L79.5147 22.4304C79.8102 21.7034 79.6533 20.8708 79.1135 20.3013L67.5697 8.12179M72.3225 4L63.008 11.7787C62.6483 12.079 62.1946 12.2436 61.726 12.2436H15C8.92487 12.2436 4 17.1685 4 23.2436V37.9368" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`},
		// Fluorierte Gase
		{
			codes: [''],
			icon: (size) =>
				`<svg width="${size * 30}" height="${
					size * 30
				}" viewBox="0 0 60 57" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1437_107)"><path d="M8.54224 17.0843H32.7452C34.0675 17.1096 35.3711 16.766 36.5089 16.092C37.647 15.4179 38.5747 14.4402 39.188 13.2683C39.8017 12.0965 40.0764 10.7769 39.9816 9.45763C39.8871 8.13837 39.4267 6.87156 38.6522 5.79929C37.8779 4.72704 36.8199 3.89172 35.5975 3.38707C34.3748 2.88243 33.0356 2.72841 31.7304 2.94225C30.4251 3.15612 29.2053 3.72939 28.2077 4.59779C27.21 5.46622 26.474 6.59542 26.0823 7.85873" stroke="white" stroke-width="5.69482" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.84741 28.4739H46.9822C48.3046 28.4486 49.6081 28.7923 50.7459 29.4663C51.8841 30.1403 52.8117 31.1181 53.4251 32.2898C54.0387 33.4618 54.3135 34.7813 54.2187 36.1005C54.1241 37.42 53.6637 38.6868 52.8892 39.7588C52.115 40.8312 51.0569 41.6666 49.8345 42.1711C48.6118 42.6757 47.2727 42.8297 45.9674 42.6159C44.6622 42.4021 43.4423 41.8289 42.4446 40.9604C41.4472 40.092 40.7111 38.9627 40.3193 37.6996" stroke="white" stroke-width="5.69482" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.69482 39.8633H21.3556C22.678 39.838 23.9813 40.1817 25.1194 40.8557C26.2574 41.5296 27.1852 42.5074 27.7985 43.6791C28.4119 44.8511 28.6868 46.1706 28.592 47.4898C28.4974 48.8093 28.037 50.0761 27.2626 51.1482C26.4882 52.2205 25.4304 53.0559 24.2077 53.5605C22.9851 54.0651 21.6461 54.2191 20.3408 54.0053C19.0356 53.7914 17.8157 53.2183 16.818 52.3498C15.8204 51.4813 15.0844 50.352 14.6926 49.0889" stroke="white" stroke-width="5.69482" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="clip0_1437_107"><rect width="59.7956" height="56.9482" fill="white"/></clipPath></defs></svg>`
		}
	];

	const iconForCRFCode = ({ crfCode, ksgKey, size }) => {
		console.log('icon for key', ksgKey, crfCode);
		let icon = '';
		const crfIcon = crfIcons.find((icon) => icon.codes.indexOf(crfCode) >= 0);
		if (crfIcon) return crfIcon.icon(size);
		else return colorForKey(ksgKey).icon(size);
		return icon;
	};

	// const datasetPromise = fetch(
	// 	`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_crf_${PUBLIC_VERSION}.json`
	// )
	const datasetPromise = fetch('../data/at/emissions/emissions_crf_at.json')
		// const datasetPromise = fetch('../data/de/emissions/emissions_crf_de.json')
		.then((response) => response.json())
		.then((responseData) => {
			dataset = responseData;
			return responseData;
		});

	$: data = dataset?.[selectedGhGas].sort((a, b) => b.absolute[30] - a.absolute[30]);
	$: sortedData = sectorlyData?.map((ksg, s) => {
		const row = rows.reduce(
			(row, count, c) => {
				if (!row.foundRow && s >= row.start + count)
					return { start: row.start + count, foundRow: false };
				else
					return {
						start: row.start,
						end: row.end || row.start + count,
						foundRow: true
					};
			},
			{ start: 0, foundRow: false }
		);
		// percentages
		const percentSector = ksg.absolute[_y] / totalSelectedYear;
		const percentCumulative = sectorlyData
			.slice(0, s)
			.reduce((sum, sec) => sum + sec.absolute[_y] / totalSelectedYear, 0);
		const percentRow =
			sectorlyData.slice(row.start, row.end).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;
		const percentPreRow =
			sectorlyData.slice(0, row.start).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;
		const percentUpToKSGIndex =
			sectorlyData.slice(row.start, s).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;

		const selected = ksgSelection == s;
		const w = selected ? 1000 : (1000 * percentSector) / percentRow;
		const h = selected ? 1000 : percentRow * 1000;
		const x = selected ? 0 : (percentUpToKSGIndex / percentRow) * 1000;
		const y = selected ? 0 : percentPreRow * 1000;

		// CRF sectors -----------------------------------------
		let moreSection = { active: false, height: 0 };

		let crfSectors = ksg.sectors;
		crfSectors = crfSectors.sort((a, b) => {
			return a.absolute[_y] - b.absolute[_y];
		});
		crfSectors = crfSectors.map((crf, c) => {
			const percentUpToCRFIndex =
				ksg.sectors.slice(0, c).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
				totalSelectedYear;
			const w2 = w;
			const h2 = (h * crf.absolute[_y]) / ksg.absolute[_y];
			const x2 = x;
			const y2 = y + h * (percentUpToCRFIndex / (ksg.absolute[_y] / totalSelectedYear));
			moreSection.active = moreSection.active || h2 < 40;
			if (h2 < 40) moreSection.height += h2;

			console.log(crf.label, crf.code);
			return {
				absolute: crf.absolute,
				key: crf.key,
				code: crf.code,
				label: crf.label,
				explanation: crf.explanation,
				w2,
				h2,
				x2,
				y2
			};
		});

		// KSG sectors -----------------------------------------
		return {
			absolute: ksg.absolute,
			key: ksg.key,
			ksgSector: ksg.ksgSector,
			label: ksg.label,
			sectors: crfSectors,
			percentCumulative,
			relative: percentSector,
			more: { active: moreSection.active, height: moreSection.height },
			w,
			h,
			x,
			y
		};
	});
	// $: console.log('sortedData', sortedData);

	// TODO: compare totals to Klimaschutzbericht
	// console.log('1990', total1990 / 10 ** 6);
	// $: console.log('2020', totalSelectedYear / 10 ** 6);

	$: sectorlyData = data?.filter((sector) => (sector.label == 'Memo' ? showFlightEmissions : true));
	$: memoAvailable = data ? data.find((sector) => sector.label == 'Memo').absolute[0] != 0 : false;

	$: totalForYear = (year) =>
		sectorlyData?.reduce((sum, entry) => sum + entry.absolute[year - 1990], 0);
	$: totalSelectedYear = totalForYear(selectedYear);

	// dynamic variables
	let selectedYear = maxYear;
	let selectedGhGas = 'THG';
	$: _y = selectedYear - 1990;

	// TREE PLOT selections
	let ksgSelection = null;
	let crfSelection = null;
	let ksgHover = null;
	let crfHover = null;
	let extensiveList = false;

	let useAbsoluteUnits = false;
	let showFlightEmissions = true;
</script>

{#if sortedData}
	<div class="flex flex-wrap gap-5 items-center sm:justify-center md:justify-start">
		<div class="relative text-gray-600">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="absolute pointer-events-none top-5 h-5 right-2 transform -translate-y-0.5 icon-tabler-selector"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline
					points="8 9 12 5 16 9"
				/><polyline points="16 15 12 19 8 15" /></svg
			>
			<select
				bind:value={selectedGhGas}
				class="block appearance-none w-full bg-gray-200 border border-gray-100 h-14 py-3 px-4 pr-8 rounded leading-tight cursor-pointer focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
				id="emission-detail-ghg"
			>
				{#each ghGas as ghg}
					<option value={ghg.key}>{ghg.label}</option>
				{/each}
			</select>
		</div>

		{#if memoAvailable}
			<label
				class="flex gap-1 text-sm items-center cursor-pointer {showFlightEmissions
					? 'text-blue-700'
					: 'text-gray-400'}"
				style=""
				><svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5 icon icon-tabler icon-tabler-plane"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z"
					/></svg
				>
				<span
					>Internationale Emissionen (Memo <span
						class="glossary-label"
						on:mousedown={() => glossaryItem.set('memo-items')}
					/>)</span
				> <input type="checkbox" bind:checked={showFlightEmissions} /></label
			>
		{/if}
		<label class="flex gap-1 text-sm items-center text-gray-400">
			<input
				type="range"
				min="1990"
				max="2020"
				bind:value={selectedYear}
				class="cursor-pointer"
			/><span>{selectedYear}</span>
		</label>

		<label
			class="flex gap-1 text-sm items-center cursor-pointer {useAbsoluteUnits
				? 'text-blue-700'
				: 'text-gray-400'}"
			style=""
		>
			<span>Absolute Werte</span>
			<input type="checkbox" bind:checked={useAbsoluteUnits} /></label
		>
	</div>

	<div class="py-3" style="font-size: clamp(1rem, 4vw, 1.5rem)">
		<span
			class="cursor-pointer transition-colors {ksgSelection != null ? 'hover:text-gray-500' : ''}"
			on:mousedown={() => {
				crfSelection = null;
				ksgSelection = null;
				extensiveList = false;
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="inline-block w-5 h-5 icon icon-tabler icon-tabler-plane"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				{#if ksgSelection == null}
					<circle r="10" cx="12" cy="12" fill="currentColor" />
				{:else}
					<path stroke="none" d="M20 4 L 4 12 L 20 20" fill="currentColor" /><path />
				{/if}
			</svg>
			<strong>Gesamtemissionen {selectedYear}</strong>
			<small class="opacity-50"
				>{totalSelectedYear.toFixed(2).replace('.', ',')} Mt CO2eq (100%)</small
			>
		</span>
		{#if ksgSelection != null}
			<svg viewbox="0 0 12 22" class="h-[1em] px-2 inline-block"
				><path
					d="M 2 2 L 10 11 L 2 20"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/></svg
			>
			<span
				class="cursor-pointer transition-colors {crfSelection != null ? 'hover:text-gray-500' : ''}"
				on:mousedown={() => {
					crfSelection = null;
					extensiveList = false;
				}}
				style="color: {colorForKey(sortedData[ksgSelection].color)};"
			>
				<i style="filter: invert(); display: inline-block;"
					>{@html ksgSectors[ksgSelection].icon(1)}</i
				>
				{sortedData[ksgSelection].label}
			</span>
		{/if}
		{#if ksgSelection != null && crfSelection != null}
			<svg viewbox="0 0 12 22" class="h-[1em] px-2 inline-block"
				><path
					d="M 2 2 L 10 11 L 2 20"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/></svg
			>
			<span>
				{sortedData[ksgSelection].sectors[crfSelection].label}
			</span>
		{/if}
	</div>

	<div class="relative flex justify-stretch items-stretch flex-wrap gap-x-8">
		<SectorsTreeChart
			{ksgSectors}
			{explanations}
			{sortedData}
			{colorForKey}
			{iconForCRFCode}
			{years}
			{useAbsoluteUnits}
			{totalSelectedYear}
			{selectedYear}
			bind:ksgSelection
			bind:crfSelection
			bind:ksgHover
			bind:crfHover
			bind:extensiveList
			class="p-4"
		/>
		<HistoryChart
			{years}
			{maxYear}
			{sortedData}
			{colorForKey}
			{selectedYear}
			bind:ksgSelection
			bind:crfSelection
			bind:ksgHover
			bind:crfHover
		/>
	</div>
{/if}
