<script>
	let dataset = [
		{
			title: 'Wahrscheinlichkeit gesundheitsrelevanter Klimafolgen',
			options: [
				{ label: 'geringe Wahrscheinlichkeit', n: 140, percent: 22 },
				{ label: 'hohe Wahrscheinlichkeit', n: 813, percent: 55 }
			]
		},
		{
			title: 'Selbstwirksamkeit',
			options: [
				{ label: 'niedrige Selbstwirksamkeit', n: 541, percent: 40 },
				{ label: 'hohe Selbstwirksamkeit', n: 412, percent: 64 }
			]
		},
		{
			title: 'Effektivitätseinschätzung aktueller Maßnahmen',
			options: [
				{ label: 'geringe Effektivität', n: 411, percent: 18 },
				{ label: 'hohe Effektivität', n: 542, percent: 75 }
			]
		},
		{
			title: 'sozialer Norm',
			options: [
				{ label: 'schwache Norm', n: 541, percent: 40 },
				{ label: 'starke Norm', n: 412, percent: 64 }
			]
		},
		{
			title: 'Schweregrad gesundheitsrelevanter Klimafolgen',
			options: [
				{ label: 'geringer Schweregrad', n: 144, percent: 17 },
				{ label: 'hoher Schweregrad', n: 809, percent: 57 }
			]
		},
		{
			title: 'Klimawissen',
			options: [
				{ label: 'geringes Klimawissen', n: 258, percent: 41 },
				{ label: 'hohes Klimawissen', n: 695, percent: 54 }
			]
		},
		{
			title: 'Vertrauen',
			options: [
				{ label: 'geringes Vertrauen', n: 426, percent: 32 },
				{ label: 'hohes Vertrauen', n: 520, percent: 66 }
			]
		}
	];

	let willingnessIndex = 0;
</script>

<div class="relative max-w-[500px]">
	<div
		class="grid snap-x snap-mandatory overflow-x-auto pb-8"
		style="grid-auto-flow: column; grid-auto-columns: 100%;"
	>
		{#each dataset as willingness}
			<div class="w-full snap-center">
				<span class="">Handlungsbereitschaft nach <strong>{willingness.title}</strong></span>
				<div class="grid grid-cols-2">
					{#each willingness.options as option}
						{@const radius = (option.percent / 100) * 300}
						{@const percentSize = Math.min((radius * 2) / 3, 60)}
						<svg viewBox="0 0 600 700" class="w-full">
							<circle cx="300" cy="300" fill="navy" r={radius} />
							<text
								x="300"
								y={300 + (percentSize * 5) / 12}
								text-anchor="middle"
								font-size={percentSize}
								font-weight="bold"
								fill="white">{option.percent} %</text
							>
							<text x="300" y="620" text-anchor="middle" font-size="40">{option.label}</text>
							<text x="300" y="680" text-anchor="middle" font-size="40">(n = {option.n})</text>
						</svg>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div
		class="absolute right-0 bottom-0 flex items-center gap-2 transition-colors text-gray-400 hover:text-gray-800"
	>
		<small>Weiter scrollen</small> ➾
	</div>
</div>
