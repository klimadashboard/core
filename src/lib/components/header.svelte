<script>
	import { error } from '@sveltejs/kit';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Loader from './Loader.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let promise = fetch('https://klimadashboard.org/get/navigation/' + PUBLIC_VERSION + '.json')
		.then((x) => x.json())
		.then((x) => Object.values(x.data).filter((d) => d.num))
		.catch(function (err) {
			throw error(500, 'Timeout when loading navigation. ' + err);
		});

	$: showNav = false;

	let region = 'Österreich';

	onMount(() => {
		setTimeout(() => {
			if (localStorage.getItem('kd_region_name')) {
				region = localStorage.getItem('kd_region_name');
			}
		}, 100);
	});
</script>

<header
	class="fixed left-1/2 top-4 -translate-x-1/2 space-x-8 flex items-center border bg-white shadow-xl rounded-full px-4 z-50"
>
	<div class="flex">
		<a href="/" class="flex gap-4 font-bold items-center text-[#11998e]">
			<div class="bg-current h-10 w-10 relative rounded">
				<svg
					width="256"
					height="256"
					viewBox="0 0 256 256"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="h-10 w-10 absolute inset-0"
				>
					<path
						d="M119.45 88H53C50.7909 88 49 89.7909 49 92V164C49 166.209 50.7909 168 53 168H119.45C122.998 168 124.79 163.723 122.3 161.194L92.3872 130.806C90.8547 129.249 90.8547 126.751 92.3872 125.194L122.3 94.8061C124.79 92.2773 122.998 88 119.45 88Z"
						fill="#DBF0E0"
					/>
					<path
						opacity="0.6"
						d="M162.95 88H134.808C133.732 88 132.701 88.4337 131.948 89.203L96.7358 125.203C95.2152 126.758 95.2152 129.242 96.7358 130.797L131.948 166.797C132.701 167.566 133.732 168 134.808 168H162.95C166.498 168 168.29 163.723 165.8 161.194L135.887 130.806C134.355 129.249 134.355 126.751 135.887 125.194L165.8 94.8061C168.29 92.2773 166.498 88 162.95 88Z"
						fill="#DBF0E0"
					/>
					<path
						opacity="0.2"
						d="M197.95 88H178.808C177.732 88 176.701 88.4337 175.948 89.203L140.736 125.203C139.215 126.758 139.215 129.242 140.736 130.797L175.948 166.797C176.701 167.566 177.732 168 178.808 168H197.95C201.498 168 203.29 163.723 200.8 161.194L170.887 130.806C169.355 129.249 169.355 126.751 170.887 125.194L200.8 94.8061C203.29 92.2773 201.498 88 197.95 88Z"
						fill="#DBF0E0"
					/>
				</svg>
			</div>
			<span>Klimadashboard</span>
		</a>
		<button
			class=" text-[#398F70] border-[#398F70] font-bold -ml-2 flex items-center gap-1 flex-shrink-0"
			on:mousedown={() => goto('/region')}
		>
			<span class="">{region}</span>
			<svg
				width="22"
				height="22"
				viewBox="0 0 22 22"
				fill="none"
				class="w-4 h-4"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M8 11C8 11.7956 8.31607 12.5587 8.87868 13.1213C9.44129 13.6839 10.2044 14 11 14C11.7956 14 12.5587 13.6839 13.1213 13.1213C13.6839 12.5587 14 11.7956 14 11C14 10.2044 13.6839 9.44129 13.1213 8.87868C12.5587 8.31607 11.7956 8 11 8C10.2044 8 9.44129 8.31607 8.87868 8.87868C8.31607 9.44129 8 10.2044 8 11Z"
					stroke="#398F70"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M3 11C3 13.1217 3.84285 15.1566 5.34315 16.6569C6.84344 18.1571 8.87827 19 11 19C13.1217 19 15.1566 18.1571 16.6569 16.6569C18.1571 15.1566 19 13.1217 19 11C19 8.87827 18.1571 6.84344 16.6569 5.34315C15.1566 3.84285 13.1217 3 11 3C8.87827 3 6.84344 3.84285 5.34315 5.34315C3.84285 6.84344 3 8.87827 3 11Z"
					stroke="#398F70"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M11 1V3"
					stroke="#398F70"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M11 19V21"
					stroke="#398F70"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M19 11H21"
					stroke="#398F70"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M1 11H3"
					stroke="#398F70"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>
	<label for="">
		<input type="search" placeholder="Thema, Region, Frage suchen..." />
	</label>
	<button
		class="flex items-center gap-1 leading-[4rem] px-2 ml-auto"
		on:mousedown={() => (showNav = !showNav)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-menu-2"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M4 6l16 0" />
			<path d="M4 12l16 0" />
			<path d="M4 18l16 0" />
		</svg>
		<span>Menü</span>
	</button>
</header>

<style>
	:global(.navigation-item:hover::before),
	:global(.navigation-item:hover::after) {
		content: '';
		position: absolute;
		z-index: 1000;
		top: 30px;
		bottom: 0;
		width: 300%;
		height: 1rem;
		animation: hoverHelpFade 2s;
	}

	:global(.navigation-item:hover::before) {
		left: -300%;
		clip-path: polygon(100% 0, 0% 100%, 100% 100%);
	}
	:global(.navigation-item:hover::after) {
		right: -300%;
		clip-path: polygon(0 0, 0% 100%, 100% 100%);
	}

	@keyframes hoverHelpFade {
		0% {
			height: 2.5rem;
		}
		99% {
			height: 2.5rem;
		}
		100% {
			height: 0;
		}
	}
</style>
