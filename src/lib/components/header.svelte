<script>
	import { theme } from '../stores/theme';
	import { locale } from '../stores/i18n';
	import { error } from '@sveltejs/kit';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Loader from './Loader.svelte';
	import { page } from '$app/stores';

	let promise = fetch('https://klimadashboard.org/get/navigation/' + PUBLIC_VERSION + '.json')
		.then((x) => x.json())
		.then((x) => Object.values(x.data).filter((d) => d.num))
		.catch(function (err) {
			throw error(500, 'Timeout when loading navigation. ' + err);
		});

	$: showNav = false;

	$: console.log($page);
</script>

<header class="fixed w-full z-50">
	<div class="bg-white md:shadow-sm">
		<div class="container flex gap-4 items-center text-lg">
			<a href="/" class="flex gap-4 font-bold items-center text-green-500">
				<svg
					width="256"
					height="256"
					viewBox="0 0 256 256"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="h-12 w-12 rounded"
				>
					<rect width="256" height="256" fill="url(#kd-gradient-header)" />
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
					<defs>
						<linearGradient
							id="kd-gradient-header"
							x1="425"
							y1="8.00003"
							x2="16"
							y2="248"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#A3D58A" />
							<stop offset="1" stop-color="#28A889" />
						</linearGradient>
					</defs>
				</svg>
				<span>Klimadashboard.{PUBLIC_VERSION}</span>
			</a>
			<button
				class="md:hidden flex items-center gap-1 leading-[5rem] px-2 ml-auto"
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
			<nav
				class="{showNav
					? ''
					: 'hidden'} absolute bg-white top-20 w-screen left-0 p-4 md:p-0 h-screen md:h-auto md:top-0 md:relative md:flex items-center"
			>
				<ul class="flex flex-col space-y-4 pt-8 md:pt-0 md:space-y-0 md:flex-row w-full">
					{#await promise}
						<div class="translate-y-5">
							<Loader />
						</div>
					{:then navigation}
						{#each navigation.filter((d) => d.num > 0 && d.parent == 'klimadashboard-' + PUBLIC_VERSION) as item}
							<li
								class="group md:px-2 lg:px-3 relative navigation-item border-b pb-4 md:pb-0 md:border-b-0"
							>
								<a
									href={item.uri.replace('klimadashboard-' + PUBLIC_VERSION, '')}
									class="md:leading-[5rem] font-bold {$page.params.slug.includes(item.slug)
										? ''
										: 'md:font-normal'} hover:underline underline-offset-2"
									on:mouseup={() => (showNav = false)}>{item.content.title}</a
								>

								{#if navigation.filter((c) => item.id == c.parent && c !== item).length > 0}
									<div
										class="md:fixed left-0 md:top-18 w-screen md:bg-gray-100 md:shadow-sm transition"
									>
										<ul
											class="md:container flex gap-6 md:py-3 {!$page.params.slug.includes(item.slug)
												? 'md:hidden'
												: ''} group-hover:flex"
										>
											{#each navigation.filter((c) => item.id == c.parent && c !== item) as child}
												<li>
													<a
														href={child.id.replace('klimadashboard-' + PUBLIC_VERSION + '/', '/')}
														on:mouseup={() => (showNav = false)}
														class="hover:underline underline-offset-2 {$page.params.slug.includes(
															child.slug
														)
															? 'font-bold'
															: ''}">{child.content.title}</a
													>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</li>
						{/each}
					{:catch error}
						{error}
					{/await}
					<li class="opacity-70 hover:opacity-100 transition md:ml-auto">
						<a
							href="https://klimadashboard.org"
							class="leading-[5rem] text-sm font-bold uppercase tracking-wide">Über uns</a
						>
					</li>
				</ul>
			</nav>
		</div>
	</div>
</header>

<style>
	:global(.navigation-item:hover::before),
	:global(.navigation-item:hover::after) {
		content: '';
		position: absolute;
		z-index: 1000;
		bottom: 0;
		width: 300%;
		height: 2.5rem;
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
