<script>
	export let data;

	let currentImage = {};
	function toggleImage(id) {
		currentImage[id] = !currentImage[id];
	}

	let expanded = {};
	function toggleText(id) {
		expanded[id] = !expanded[id];
		currentImage[id] = !currentImage[id];
	}
</script>

<div class="reg-card flex flex-col relative bg-black" on:click={() => toggleImage(data.id)}>
	<div class="relative flex-1 w-full h-full">
		<img
			src="https://base.klimadashboard.org/assets/{data.files[0].directus_files_id}?key=medium"
			class="absolute object-cover w-full h-full transition-opacity duration-700"
			class:opacity-0={currentImage[data.id]}
		/>
		<img
			src="https://base.klimadashboard.org/assets/{data.files[1].directus_files_id}?key=medium"
			class="absolute object-cover w-full h-full transition-opacity duration-700"
			class:opacity-0={!currentImage[data.id]}
		/>
	</div>

	<h3
		class="font-bold absolute left-4 top-4 right-16 leading-tight text-white uppercase text-shadow"
	>
		{data.translations[0].title}
	</h3>

	<button
		class="cursor-pointer absolute top-2 right-2 w-16 h-16 shadow-2xl rounded-full bg-amber-200 rotate-3 hover:-rotate-2 transition flex items-center justify-center"
		aria-label="Wie wär’s besser?"
	>
		<svg viewBox="0 0 120 120" class="absolute w-8/10 h-8/10 overflow-visible -rotate-[130deg]">
			<defs>
				<path
					id="circlePath"
					d="M60,10
				   a50,50 0 1,1 -0.01,0"
					fill="none"
				/>
			</defs>
			<text fill="black" font-size="28" class="font-bold font-sans tracking-tighter">
				<textPath href="#circlePath" startOffset="0"> Wie wär’s besser? </textPath>
			</text>
		</svg>

		<!-- Center icon: a basic pointer icon (you can replace with any SVG or emoji) -->
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
			class="w-8 h-8"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5"
			/><path d="M11 11.5v-2a1.5 1.5 0 0 1 3 0v2.5" /><path
				d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5"
			/><path
				d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47"
			/><path d="M5 3l-1 -1" /><path d="M4 7h-1" /><path d="M14 3l1 -1" /><path d="M15 6h1" /></svg
		>
	</button>

	<div
		class="absolute bottom-0 left-0 right-0 text-white cursor-pointer"
		on:click={() => toggleText(data.id)}
	>
		<div class="bg-gradient-to-b from-transparent to-black/70 h-16"></div>
		<div
			class="bg-black/70 px-4 py-4 transition-all duration-300 max-h-32 overflow-hidden"
			class:max-h-96={expanded[data.id]}
		>
			<p
				class="whitespace-pre-line overflow-hidden w-5/6 leading-snug text-ellipsis text-lg"
				class:line-clamp-2={!expanded[data.id]}
			>
				{@html data.translations[0].text}
			</p>
		</div>
	</div>
</div>
