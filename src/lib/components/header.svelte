<script>
	import { theme } from '../stores/theme';
	import { locale } from '../stores/i18n';
	import { error } from '@sveltejs/kit';
	import { PUBLIC_VERSION } from '$env/static/public';

	let promise = fetch('https://klimadashboard.org/get/navigation/' + PUBLIC_VERSION + '.json')
		.then((x) => x.json())
		.then((x) => Object.values(x.data).filter((d) => d.num))
		.catch(function (err) {
			throw error(500, 'Timeout when loading navigation. ' + err);
		});

	$: showNav = false;

	const structure = [
		{
			label: 'Regionen',
			children: [
				{
					label: 'Vor Ort',
					comingSoon: true
				},
				{
					label: 'Niederösterreich'
				},
				{
					label: 'Wien'
				},
				{
					label: 'Salzburg'
				},
				{
					label: 'Oberösterreich'
				}
			]
		},
		{
			label: 'Sektoren',
			children: [
				{
					label: 'Energie'
				},
				{
					label: 'Mobilität'
				},
				{
					label: 'Landwirtschaft',
					comingSoon: true
				},
				{
					label: 'Industrie',
					comingSoon: true
				},
				{
					label: 'Gebäude',
					comingSoon: true
				}
			]
		},
		{
			label: 'Auswirkungen',
			children: [
				{
					label: 'Temperatur'
				},
				{
					label: 'Gletscher'
				}
			]
		},
		{
			label: 'Themen',
			children: [
				{
					label: 'Treibhausgasbudget'
				},
				{
					label: 'Emissionen'
				}
			]
		}
	];
</script>

<header class="fixed w-full z-10">
	<div class="bg-white">
		<div class="container flex gap-8 items-center text-xl">
			<a href="/" class="bg-gray-600 w-16 h-16 block" />
			<button class="md:hidden flex">
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
				class="absolute top-8 h-screen left-0 right-0 bg-white md:relative md:block md:w-auto md:h-auto z-50"
			>
				<ul class="flex flex-col md:flex-row space-x-4">
					{#each structure as item}
						<li>
							<h3>{item.label}</h3>
							{#if item.children}
								<ul class="absolute top-8 flex gap-4">
									{#each item.children as child}
										<li>{child.label}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</nav>
			<nav class="ml-auto">
				<ul class="flex gap-2 text-sm font-bold uppercase tracking-wide">
					<li class="flex flex-col items-center opacity-70 hover:opacity-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-info-circle"
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
							<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
							<path d="M12 9h.01" />
							<path d="M11 12h1v4h1" />
						</svg>
						<span>Info</span>
					</li>
					<li class="flex flex-col items-center opacity-70 hover:opacity-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-chart-area-line"
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
							<path d="M4 19l4 -6l4 2l4 -5l4 4l0 5l-16 0" />
							<path d="M4 12l3 -4l4 2l5 -6l4 4" />
						</svg>
						<span>Charts</span>
					</li>
					<li>Glossar</li>
				</ul>
			</nav>
		</div>
	</div>
	<div class="bg-gray-100 py-4">
		<div class="container flex gap-8">
			<nav>
				<ul class="flex text-lg gap-4">
					<li>Gesellschaft</li>
					<li>Unternehmen</li>
					<li>Emissionen</li>
				</ul>
			</nav>
		</div>
	</div>
</header>
