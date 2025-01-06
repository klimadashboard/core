<script>
	import { fade } from 'svelte/transition';

	export let showNavigation;
</script>

{#if showNavigation}
	<div
		class="fixed w-screen h-screen z-40 bg-white bg-opacity-90 backdrop-blur-lg pt-64 p-4"
		transition:fade
	>
		<div class="max-w-4xl mx-auto">
			<div>
				<h2 class="font-bold">Seiten</h2>
				<ul>
					<li>1</li>
					<li>2</li>
				</ul>
			</div>

			<div>
				<h2 class="font-bold">Diagramme</h2>
				<ul>
					<li>1</li>
					<li>2</li>
				</ul>
			</div>
		</div>
	</div>
{/if}
