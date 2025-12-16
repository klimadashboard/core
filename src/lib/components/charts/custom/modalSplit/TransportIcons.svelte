<!-- $lib/components/charts/custom/mobilityModalSplitStreet/TransportIcons.svelte -->
<script lang="ts">
	export let category: string;
	export let size: number = 24;
</script>

{#if category === 'on_foot'}
	<!-- Walking person -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="icon icon-tabler icons-tabler-outline icon-tabler-walk"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"
		/><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path
			d="M6 12l2 -3l4 -1l3 3l3 1"
		/></svg
	>
{:else if category === 'bicycle'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="currentColor"
		class="icon icon-tabler icons-tabler-filled icon-tabler-bike"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M5 14a4 4 0 1 1 -4 4l.005 -.2a4 4 0 0 1 3.995 -3.8"
		/><path d="M19 14a4 4 0 1 1 -4 4l.005 -.2a4 4 0 0 1 3.995 -3.8" /><path
			d="M14.832 7.445l1.703 2.555h2.465a1 1 0 0 1 .993 .883l.007 .117a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -.832 -.445l-1.396 -2.093l-3.275 2.62l2.21 2.21a1 1 0 0 1 .284 .577l.009 .131v4a1 1 0 0 1 -2 0v-3.585l-2.707 -2.708a1 1 0 0 1 -.01 -1.403l.092 -.085l5 -4a1 1 0 0 1 1.457 .226"
		/><path d="M17 3a2 2 0 1 1 -2 2l.005 -.15a2 2 0 0 1 1.995 -1.85" /></svg
	>
{:else if category === 'e_bike'}
	<!-- E-Bike (bicycle with bolt) -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="icon icon-tabler icons-tabler-outline icon-tabler-bike"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M5 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
		/><path d="M19 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path
			d="M12 19l0 -4l-3 -3l5 -4l2 3l3 0"
		/><path d="M17 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg
	>
{:else if category === 'public_transport'}
	<!-- Tram/Bus -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="currentColor"
		class="icon icon-tabler icons-tabler-filled icon-tabler-train"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M11 5c6.634 0 10.853 3.11 10.996 7.754l.004 .246a3 3 0 0 1 -3 3h-16a1 1 0 0 1 -1 -1v-9a1 1 0 0 1 1 -1zm-4 2h-3v3h3zm4 0h-2v3h3v-2.974a19 19 0 0 0 -1 -.026m3.001 .257l-.001 2.743h5.04c-.979 -1.337 -2.689 -2.306 -5.039 -2.743m6.999 10.743a1 1 0 0 1 0 2h-18a1 1 0 0 1 0 -2z"
		/></svg
	>
{:else if category === 'motorbike'}
	<!-- Motorcycle -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="currentColor"
		class="icon icon-tabler icons-tabler-filled icon-tabler-motorbike"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M15 5a1 1 0 0 1 .894 .553l3.225 6.449l.08 .003a4 4 0 1 1 -4.199 3.995l.005 -.2a4 4 0 0 1 2.111 -3.33l-.557 -1.115l-3.352 3.352a1 1 0 0 1 -.707 .293h-3.626q .124 .481 .126 1a4 4 0 1 1 -8 0l.005 -.2a4 4 0 0 1 6.33 -3.049l1.749 -1.751h-3.084a1 1 0 0 1 -.993 -.883l-.007 -.117a1 1 0 0 1 1 -1h9.381l-1 -2h-1.381a1 1 0 0 1 -.993 -.883l-.007 -.117a1 1 0 0 1 1 -1z"
		/></svg
	>
{:else if category === 'car_driver'}
	<!-- Car -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="currentColor"
		class="icon icon-tabler icons-tabler-filled icon-tabler-car"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z"
		/></svg
	>
{:else if category === 'car_passenger'}
	<!-- Car with passengers indicator -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="icon icon-tabler icons-tabler-outline icon-tabler-car"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
			d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"
		/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path
			d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"
		/></svg
	>
{:else}
	<!-- Fallback circle -->
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
	>
		<circle cx="12" cy="12" r="8" />
	</svg>
{/if}
