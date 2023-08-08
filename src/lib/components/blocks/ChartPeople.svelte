<script>
	import { onMount } from 'svelte';
	export let block;

	const images = [
		'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.3601 16.09C17.0981 16.2993 17.8228 16.5531 18.5301 16.85C19.8601 17.43 19.9001 18.85 19.9001 20.26V22.74" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.1001 22.74V20.26C4.1001 18.85 4.1001 17.43 5.4701 16.85C6.17743 16.5531 6.90209 16.2993 7.6401 16.09" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.2301 8.11006C16.1849 9.79902 15.9433 11.477 15.5101 13.1101C14.8401 14.8601 13.9601 16.1101 12.7201 16.4201C12.2867 16.4676 11.8486 16.4508 11.4201 16.3701C10.2501 16.0101 9.42008 14.7901 8.79008 13.1201C8.17273 11.53 7.92979 9.81913 8.08008 8.12006V8.12006C8.08008 8.12006 14.0101 8.47006 14.0801 5.78006C14.0701 5.73006 14.4701 8.16006 16.2301 8.11006Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.33004 14.65V8.74001C5.29938 7.81818 5.45119 6.89939 5.77675 6.03642C6.10231 5.17345 6.59521 4.38333 7.22712 3.71147C7.85902 3.03961 8.61747 2.49925 9.45888 2.12145C10.3003 1.74365 11.2081 1.53585 12.13 1.51001V1.51001C13.052 1.53585 13.9598 1.74365 14.8012 2.12145C15.6426 2.49925 16.4011 3.03961 17.033 3.71147C17.6649 4.38333 18.1578 5.17345 18.4833 6.03642C18.8089 6.89939 18.9607 7.81818 18.93 8.74001V14.65" stroke="currentColor" stroke-width="0.97" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18.15C10.2816 18.4726 10.629 18.7311 11.0188 18.9083C11.4086 19.0855 11.8318 19.1771 12.26 19.1771C12.6882 19.1771 13.1114 19.0855 13.5012 18.9083C13.891 18.7311 14.2384 18.4726 14.52 18.15V18.15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.1299 16C16.8668 16.2089 17.5913 16.4593 18.2999 16.75C18.954 17.0526 19.5089 17.5346 19.9001 18.14C20.2913 18.7454 20.5027 19.4493 20.5099 20.17V22.65" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 22.66V20.18C3.00716 19.4593 3.21861 18.7554 3.6098 18.15C4.00098 17.5446 4.55586 17.0626 5.21 16.76C5.92821 16.4648 6.66275 16.2111 7.41 16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.13 9.61C16.0563 10.7857 15.7682 11.938 15.28 13.01C14.61 14.77 13.73 16.01 12.49 16.32C12.0587 16.3793 11.6213 16.3793 11.19 16.32C10.02 15.95 9.18996 14.73 8.55996 13.06C8.07051 11.9849 7.78241 10.8291 7.70996 9.65C7.70996 7.25 7.79996 5.83 9.01996 4.65C9.78532 3.94976 10.7735 3.54246 11.81 3.5C12.9014 3.53015 13.9537 3.91252 14.81 4.59C16 5.79 16.13 7.21 16.13 9.61Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.4399 7.20999C10.7199 7.14999 11.1799 8.77999 8.1499 8.77999" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18.3199L11.12 19.6099C11.2317 19.7374 11.3693 19.8395 11.5237 19.9095C11.678 19.9795 11.8455 20.0157 12.015 20.0157C12.1845 20.0157 12.352 19.9795 12.5063 19.9095C12.6607 19.8395 12.7983 19.7374 12.91 19.6099L14 18.3199" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.5508 3.57242C14.6042 2.23589 13.6134 1.11105 12.3376 1.06002C11.0618 1.00899 9.98425 2.05109 9.93078 3.38762C9.87732 4.72415 10.8682 5.84899 12.144 5.90002C13.4198 5.95105 14.4973 4.90895 14.5508 3.57242Z" fill="white" stroke="currentColor" stroke-width="1.0008" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.3601 16.28C17.097 16.4889 17.8215 16.7393 18.5301 17.03C19.1827 17.3319 19.7366 17.8124 20.1277 18.4158C20.5187 19.0192 20.7311 19.721 20.7401 20.44V22.92" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.26001 22.92V20.44C3.26339 19.7159 3.47306 19.0077 3.86447 18.3984C4.25588 17.7892 4.81281 17.3041 5.47001 17C6.17863 16.7093 6.90312 16.4589 7.64001 16.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.3599 9.87002C16.2862 11.0489 15.9981 12.2044 15.5099 13.28C14.8399 15.04 13.9599 16.28 12.7199 16.59C12.2865 16.6376 11.8484 16.6207 11.4199 16.54C10.2499 16.18 9.41994 14.96 8.78994 13.29C8.30059 12.2113 8.01252 11.0523 7.93994 9.87002C7.93994 7.48002 8.02994 6.06002 9.24994 4.87002C10.015 4.20149 10.9849 3.81351 11.9999 3.77002C13.0893 3.80222 14.14 4.1805 14.9999 4.85002C16.2699 6.06002 16.3599 7.48002 16.3599 9.87002Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.0001 6.56998C13.4901 11.5 17.4301 11.38 17.4301 11.38C17.4301 11.38 18.3501 3.60998 12.3701 3.59998C6.00008 3.59998 7.57008 10.81 7.57008 10.81H8.13008C8.13008 10.81 8.24008 8.06998 11.6101 7.71998" fill="white"/><path d="M11.0001 6.56998C13.4901 11.5 17.4301 11.38 17.4301 11.38C17.4301 11.38 18.3501 3.60998 12.3701 3.59998C6.00008 3.59998 7.57008 10.81 7.57008 10.81H8.13008C8.13008 10.81 8.24008 8.06998 11.6101 7.71998" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.3601 16C17.097 16.2089 17.8215 16.4593 18.5301 16.75C19.8601 17.33 19.9001 18.75 19.9001 20.17V22.65" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.1001 22.66V20.18C4.1001 18.76 4.1001 17.34 5.4701 16.76C6.17851 16.4659 6.903 16.2122 7.6401 16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.38 9.61C16.3063 10.7857 16.0183 11.938 15.53 13.01C14.86 14.77 13.97 16.01 12.73 16.32C12.2987 16.3792 11.8613 16.3792 11.43 16.32C10.27 15.95 9.43 14.73 8.81 13.06C8.32956 11.9698 8.05494 10.8001 8 9.61C8 7.21 8.09 5.79 9.31 4.61C10.0666 3.93292 11.0354 3.54045 12.05 3.5C13.1413 3.53087 14.1934 3.91315 15.05 4.59C16.29 5.79 16.38 7.21 16.38 9.61Z" fill="white" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.38 9.26002C16.3479 9.14587 16.2893 9.04096 16.2088 8.95387C16.1284 8.86678 16.0285 8.80001 15.9172 8.75902C15.806 8.71804 15.6866 8.70401 15.5689 8.71809C15.4511 8.73217 15.3384 8.77395 15.24 8.84002C14.7227 8.99798 14.1707 9.00271 13.6507 8.85364C13.1307 8.70457 12.6651 8.40808 12.31 8.00002C11.22 6.86002 10.84 6.33002 9.55 7.00002C9.15645 7.23586 8.81571 7.55026 8.54904 7.92361C8.28236 8.29696 8.09546 8.72125 8 9.17002" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>'
	];

	$: people = [];
	let categories = block.content.values.sort((a, b) => b.value - a.value);

	$: if (categories.length) {
		for (let i = 0; i < categories.length; i++) {
			people.push.apply(people, Array(categories[i].value).fill(categories[i].color));
		}
	}
</script>

<div class="container my-8">
	<div class="max-w-4xl">
		<h2 class="text-2xl" style="color: {categories[0].color}">
			{block.content.heading}
		</h2>
		<div class="flex space-x-4 mt-2">
			{#each categories as value}
				<div class="flex items-center space-x-1" style="color: {value.color}">
					<div class="h-2 w-2 rounded-full bg-current" />
					<span>{value.value}% {value.label}</span>
				</div>
			{/each}
		</div>
		<div class="grid grid-heads gap-2 my-4 -px-1">
			{#each people as person}
				<div style="color: {person}" class="">
					{@html images[Math.floor(Math.random() * images.length)]}
				</div>
			{/each}
		</div>
		{#if block.content.source}
			<p class="text-sm text-gray-700">{block.content.source}</p>
		{/if}
	</div>
</div>

<style>
	.grid-heads {
		grid-template-columns: repeat(10, minmax(0, 1fr));
	}

	@media screen and (min-width: 768px) {
		.grid-heads {
			grid-template-columns: repeat(25, minmax(0, 1fr));
			grid-template-rows: repeat(4, minmax(0, 1fr));
			grid-auto-flow: column;
		}
	}
</style>
