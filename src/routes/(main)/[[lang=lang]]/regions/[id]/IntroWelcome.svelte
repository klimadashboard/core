<script>
	import { page } from '$app/stores';
	import formatNumber from '$lib/stores/formatNumber';
	import { getRegion } from '@/lib/utils/getRegion';
	import RegionOutline from './RegionOutline.svelte';

	export let name;
	export let introText;
	export let outline = null;
	export let isDesktop = false;

	$: parentStatePromise = (async () => {
		const parents = $page.data?.page?.parents;
		if (!parents) return null;
		const stateParent = parents.find((d) => d.layer === 'state');
		if (!stateParent?.id) return null;
		return getRegion(stateParent.id);
	})();
</script>

<div
	class="rounded-xl overflow-hidden relative bg-gradient-to-tr from-[#006E54] to-[#004636] text-white h-full"
	class:reg-card={!isDesktop}
	class:reg-card-half={isDesktop}
	class:row-span-2={isDesktop}
>
	<div class="p-4 flex flex-col h-full relative z-10">
		<h1 class="font-bold leading-none mb-4 hyphens-auto text-3xl md:text-4xl">
			Klimadashboard {name}
		</h1>
		<p class="leading-snug mb-auto" class:text-base={true} class:xl:text-lg={isDesktop}>
			{introText}
		</p>
		{#if outline}
			<RegionOutline {outline} />
		{/if}
		<div class="flex gap-2 mt-4 items-center flex-wrap leading-none text-sm pr-10">
			<div class="flex items-center gap-0.5">
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
					class="w-4 h-4"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" />
					<path d="M5 21v-7" />
				</svg>
				<p>{$page.data.page.layer_label}</p>
			</div>
			<div class="flex items-center gap-1">
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
					class="w-4 h-4"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
					<path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
					<path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
					<path d="M17 10h2a2 2 0 0 1 2 2v1" />
					<path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
					<path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
				</svg>
				<p>{formatNumber($page.data.page.population)}</p>
			</div>
			<div class="flex items-center gap-0.5">
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
					class="w-4 h-4"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" />
					<path d="M9 4v13" />
					<path d="M15 7v13" />
				</svg>
				<p>{formatNumber($page.data.page.area)} km²</p>
			</div>
			{#await parentStatePromise then parentState}
				{#if parentState?.name}
					<div class="flex gap-1">
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
							class="w-4 h-4"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v8.5"
							/><path d="M9 4v13" /><path d="M15 7v7.5" /><path d="M19 22v-6" /><path
								d="M22 19l-3 -3l-3 3"
							/></svg
						>
						<span>{parentState.name}</span>
					</div>
				{/if}
			{/await}
			{#if $page.data.page.slug}
				<div>
					<a href="https://{$page.url.host}/{$page.data.page.slug.split(',')[0]}" target="_blank">
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
							class="inline w-4 h-4"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M9 15l6 -6" />
							<path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
							<path
								d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"
							/>
						</svg>
						{$page.url.host}/{$page.data.page.slug.split(',')[0]}
					</a>
				</div>
			{/if}
		</div>
		<svg
			width="36"
			height="16"
			viewBox="0 0 36 16"
			fill="none"
			class="h-8 absolute bottom-2 right-4"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				class="fill-current"
				d="M13.6588 2.32039C15.2053 3.86648 15.9787 5.76003 15.9787 7.99999C15.9787 10.2405 15.2187 12.1137 13.6988 13.6206C12.0857 15.2068 10.1793 16 7.97955 16C5.80633 16 3.93294 15.2138 2.35986 13.6399C0.786531 12.067 0 10.1869 0 7.99999C0 5.81363 0.786531 3.92009 2.35986 2.32039C3.89298 0.773296 5.76637 0 7.97955 0C10.2195 0 12.1123 0.773296 13.6588 2.32039ZM3.40106 3.36023C2.09353 4.68098 1.44004 6.22807 1.44004 8.00198C1.44004 9.7759 2.08708 11.3096 3.38093 12.6035C4.67505 13.897 6.21561 14.5442 8.00312 14.5442C9.79065 14.5442 11.3444 13.8911 12.665 12.5837C13.9189 11.3696 14.5461 9.84291 14.5461 8.00198C14.5461 6.17495 13.9087 4.62439 12.6347 3.35028C11.361 2.07717 9.81722 1.43988 8.00312 1.43988C6.18906 1.43989 4.65469 2.08016 3.40106 3.36023ZM6.84181 7.22174C6.64201 6.78595 6.34293 6.56855 5.94408 6.56855C5.23896 6.56855 4.88651 7.04306 4.88651 7.99206C4.88651 8.94106 5.23896 9.41556 5.94408 9.41556C6.40969 9.41556 6.74228 9.18427 6.94183 8.72167L7.91923 9.24183C7.45337 10.0692 6.75444 10.4837 5.82247 10.4837C5.10368 10.4837 4.52786 10.2633 4.0955 9.82256C3.6624 9.3818 3.44647 8.77429 3.44647 7.99999C3.44647 7.23911 3.66936 6.63506 4.11537 6.18737C4.56138 5.74016 5.11685 5.51682 5.78275 5.51682C6.76785 5.51682 7.47323 5.90445 7.89963 6.68022L6.84181 7.22174ZM11.4402 7.22174C11.2401 6.78595 10.947 6.56855 10.5606 6.56855C9.84127 6.56855 9.4814 7.04306 9.4814 7.99206C9.4814 8.94106 9.84127 9.41556 10.5606 9.41556C11.0269 9.41556 11.3536 9.18427 11.5399 8.72167L12.5392 9.24183C12.0741 10.0692 11.3761 10.4837 10.4459 10.4837C9.72809 10.4837 9.15351 10.2633 8.72142 9.82256C8.29006 9.3818 8.07386 8.77429 8.07386 7.99999C8.07386 7.23911 8.29328 6.63506 8.73185 6.18737C9.17014 5.74016 9.72809 5.51682 10.4062 5.51682C11.3895 5.51682 12.0939 5.90445 12.5189 6.68022L11.4402 7.22174Z"
			/>
			<path
				class="fill-current"
				d="M30.1184 6.01613C30.1184 5.73065 29.887 5.5 29.6022 5.5H26.3346C26.0497 5.5 25.8184 5.73065 25.8184 6.01613V9.28338H26.7297V13.153H29.2063V9.28338H30.1184L30.1184 6.01613Z"
			/>
			<path
				class="fill-current"
				d="M27.9653 5.06702C28.5825 5.06702 29.0829 4.5667 29.0829 3.94953C29.0829 3.33235 28.5825 2.83203 27.9653 2.83203C27.348 2.83203 26.8477 3.33235 26.8477 3.94953C26.8477 4.5667 27.348 5.06702 27.9653 5.06702Z"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				class="fill-current"
				d="M27.9577 0C25.7452 0 23.8713 0.771515 22.3381 2.31656C20.7648 3.91375 19.9785 5.8051 19.9785 7.98795C19.9785 10.1708 20.7648 12.0488 22.3381 13.6199C23.9114 15.191 25.7849 15.9766 27.9577 15.9766C30.1575 15.9766 32.0644 15.1843 33.6772 13.5998C35.1977 12.0956 35.9572 10.225 35.9572 7.98795C35.9572 5.75095 35.1843 3.86093 33.6377 2.31656C32.0912 0.771522 30.1976 0 27.9577 0ZM27.9777 1.4374C29.7911 1.4374 31.3309 2.07654 32.5973 3.35483C33.8778 4.61908 34.5177 6.16412 34.5177 7.98795C34.5177 9.82515 33.8911 11.3501 32.6375 12.5616C31.3176 13.8659 29.7643 14.5184 27.9777 14.5184C26.1911 14.5184 24.6513 13.8726 23.3585 12.5816C22.0647 11.29 21.4184 9.75896 21.4184 7.98795C21.4184 6.21694 22.0717 4.67257 23.3782 3.35483C24.6316 2.07654 26.1651 1.4374 27.9777 1.4374Z"
			/>
		</svg>
	</div>
</div>
