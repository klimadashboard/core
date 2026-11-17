<!--
	Simple outline silhouettes for the four goods vehicle classes (Tabler-like stroke style).
	The width grows with the vehicle class, so the icons also show the size difference.
-->
<script lang="ts">
	export let type: 'truck_n1' | 'truck_n2' | 'truck_n3' | 'semi_trailer_tractor' | 'car' | 'bus';
	/** height in px; width follows the icon's aspect ratio */
	export let size: number = 28;

	const WIDTH: Record<string, number> = { truck_n1: 30, truck_n2: 36, truck_n3: 46, semi_trailer_tractor: 32, car: 30, bus: 40 };
	$: w = WIDTH[type] ?? 30;
</script>

<svg
	width={(size * w) / 24}
	height={size}
	viewBox="0 0 {w} 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if type === 'car'}
		<!-- passenger car (sedan) -->
		<path d="M4.5 18H3v-4.2a1.5 1.5 0 0 1 1.1-1.45L8 11.2l3.6-4.1A2 2 0 0 1 13.1 6.5h6.6a2 2 0 0 1 1.6.8l3.2 4 2.4.55a1.5 1.5 0 0 1 1.1 1.45V18h-1.5" />
		<path d="M10.5 18h9" />
		<path d="M11.5 11.2l2.4-2.7h2.6v2.7z" />
		<path d="M18.5 8.5h1.3l2.1 2.7h-3.4z" />
		<circle cx="7.5" cy="18" r="2.5" />
		<circle cx="22.5" cy="18" r="2.5" />
	{:else if type === 'bus'}
		<!-- city bus: long box, window band, door at the front -->
		<path d="M6.5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h30a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2" />
		<path d="M11.5 17h13.5" />
		<path d="M30 17h1.5" />
		<path d="M5 6h5v4.5H5z" />
		<path d="M12.5 6h5v4.5h-5z" />
		<path d="M20 6h5v4.5h-5z" />
		<path d="M31.5 17V6h4" />
		<path d="M33.5 6v11" />
		<circle cx="9" cy="17.5" r="2.5" />
		<circle cx="27.5" cy="17.5" r="2.5" />
	{:else if type === 'truck_n1'}
		<!-- van -->
		<path d="M4.5 18H3V9a2 2 0 0 1 2-2h14l6 5h1a2 2 0 0 1 2 2v4h-1.5" />
		<path d="M10.5 18h11" />
		<path d="M19 7v5h6" />
		<circle cx="7.5" cy="18" r="2.5" />
		<circle cx="24.5" cy="18" r="2.5" />
	{:else if type === 'truck_n2'}
		<!-- light box truck -->
		<rect x="2" y="4" width="20" height="12" rx="1" />
		<path d="M22 8h6l5 5v5h-1.5" />
		<path d="M22 16v2h3" />
		<path d="M2 16v2h3" />
		<path d="M10 18h5" />
		<circle cx="7.5" cy="18" r="2.5" />
		<circle cx="28.5" cy="18" r="2.5" />
		<path d="M27 8v5h5" />
	{:else if type === 'truck_n3'}
		<!-- heavy truck, three axles -->
		<rect x="2" y="2" width="29" height="14" rx="1" />
		<path d="M31 6h7l6 6v6h-1.5" />
		<path d="M31 16v2h3" />
		<path d="M2 16v2h1.5" />
		<path d="M16.5 18h12.5" />
		<circle cx="6" cy="18" r="2.5" />
		<circle cx="12" cy="18" r="2.5" />
		<circle cx="38" cy="18" r="2.5" />
		<path d="M37 6v6h6" />
	{:else}
		<!-- semi-trailer tractor (European cab-over, side view): tall box cab with vertical front over the front axle,
		     door window, short frame with fifth wheel coupling above the rear axle, fuel tank between the axles -->
		<path d="M18.5 15.5V3a1 1 0 0 1 1-1h8.5a1.5 1.5 0 0 1 1.5 1.5v12h-1.25a3.25 3.25 0 0 0-6.5 0z" />
		<path d="M22.5 4.25h6v5.25h-6z" />
		<path d="M2 13.5h16.5" />
		<path d="M2 13.5v2h3.5" />
		<path d="M12.5 15.5h6" />
		<path d="M5 13.5l1-1.75h5l1 1.75" />
		<path d="M13 15.5v2.25h4.5v-2.25" />
		<circle cx="9" cy="18" r="2.5" />
		<circle cx="25" cy="18" r="2.5" />
	{/if}
</svg>
