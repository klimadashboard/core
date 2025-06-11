<script>
	export let text = 'Diese Visualisierung wird in Kürze veröffentlicht.';
</script>

<div class="relative w-full h-[50vh] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
	<!-- Blurred chart-like shapes -->
	<style>
		@keyframes float {
			0% {
				transform: translateY(0) rotate(0deg);
			}
			50% {
				transform: translateY(-15px) rotate(1.5deg);
			}
			100% {
				transform: translateY(0) rotate(0deg);
			}
		}

		@keyframes floatX {
			0% {
				transform: translateX(0);
			}
			50% {
				transform: translateX(12px);
			}
			100% {
				transform: translateX(0);
			}
		}

		@keyframes drift {
			0% {
				transform: translate(0, 0);
			}
			50% {
				transform: translate(-10px, -10px);
			}
			100% {
				transform: translate(0, 0);
			}
		}

		.animate-float {
			animation: float 6s ease-in-out infinite;
		}

		.animate-float-slow {
			animation: float 12s ease-in-out infinite;
		}

		.animate-floatX {
			animation: floatX 10s ease-in-out infinite;
		}

		.animate-drift {
			animation: drift 14s ease-in-out infinite;
		}
	</style>

	<div class="absolute inset-0 z-0 overflow-hidden bg-amber-50/20 dark:bg-amber-900/30">
		<!-- Colorful animated bars -->
		{#each [5, 25, 45, 65, 85, 105, 125, 145, 165, 185] as x, i}
			<div
				class="absolute bottom-0"
				style="
				left: ${x}px;
				width: 6px;
				height: ${30 + (i % 5) * 10}%;
				background-color: hsl(${i * 36}, 80%, 70%, 0.2);
				border-radius: 6px;
				filter: blur(6px);
				animation: float ${6 + (i % 4)}s ease-in-out infinite;
			"
			></div>
		{/each}

		<!-- Large floating circles -->
		{#each [['25%', '20%', 'bg-pink-400/30', 'w-40 h-40', 'animate-float'], ['60%', '10%', 'bg-green-300/30', 'w-48 h-48', 'animate-drift'], ['20%', '70%', 'bg-blue-300/30', 'w-36 h-36', 'animate-floatX'], ['75%', '50%', 'bg-cyan-400/20', 'w-32 h-32', 'animate-float-slow']] as [top, left, color, size, animation]}
			<div
				class={`absolute top-[${top}] left-[${left}] ${size} ${color} blur-2xl rounded-full ${animation}`}
			></div>
		{/each}

		<!-- Abstract blob-like map shapes -->
		{#each [['10%', '80%', 'bg-purple-400/20', 'w-64 h-44', 'rotate-[25deg]'], ['55%', '15%', 'bg-orange-300/30', 'w-60 h-40', 'rotate-[12deg]'], ['40%', '45%', 'bg-yellow-400/20', 'w-72 h-48', 'rotate-[18deg]'], ['75%', '60%', 'bg-red-300/30', 'w-56 h-36', 'rotate-[8deg]']] as [top, left, color, size, rotate], i}
			<div
				class={`absolute top-[${top}] left-[${left}] ${size} ${color} blur-xl rounded-[45%] ${rotate} animate-float-slow`}
				style="animation-delay: ${i}s"
			></div>
		{/each}
	</div>

	<!-- Stronger glass overlay -->
	<div
		class="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md backdrop-saturate-150 z-10 rounded-md"
	></div>

	<!-- Centered text -->
	<div
		class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20"
	>
		<h3 class="text-4xl font-light text-black dark:text-white">Coming soon</h3>
		<p class="text-black/80 dark:text-white/80 mt-2 leading-tight">{text}</p>
	</div>
</div>
