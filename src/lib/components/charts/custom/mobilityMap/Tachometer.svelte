<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let popPercent: number;
	export let ptPercent: number;

	const CX = 100;
	const CY = 100;
	const RADIUS = 80;
	const START = 180;
	const TOTAL = 180;

	// Animated percent values
	const popTween = tweened(popPercent, { duration: 400, easing: cubicOut });
	const ptTween = tweened(ptPercent, { duration: 400, easing: cubicOut });

	$: popTween.set(popPercent);
	$: ptTween.set(ptPercent);

	// Geometry helpers
	function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
		const rad = (angleDeg * Math.PI) / 180;
		return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
	}

	function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
		const start = polarToCartesian(cx, cy, r, startAngle);
		const end = polarToCartesian(cx, cy, r, endAngle);
		const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
		return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
	}

	function pctToAngle(pct: number) {
		return START + (TOTAL * Math.min(Math.max(pct, 0), 100)) / 100;
	}

	// Visual geometry
	$: anglePop = pctToAngle($popTween);
	$: anglePT = pctToAngle($ptTween);
	$: mismatchAngleStart = Math.min(anglePop, anglePT);
	$: mismatchAngleEnd = Math.max(anglePop, anglePT);
	$: mismatchArc = describeArc(CX, CY, RADIUS, mismatchAngleStart, mismatchAngleEnd);

	$: popLine = polarToCartesian(CX, CY, RADIUS, anglePop);
	$: ptLine = polarToCartesian(CX, CY, RADIUS, anglePT);

	// Mismatch color
	$: mismatchColor = $ptTween > $popTween ? '#4caf50' : '#e74c3c'; // green or red

	// Tick marks
	$: ticks = Array.from({ length: 11 }, (_, i) => {
		const angle = START + (TOTAL * i) / 10;
		const isMajor = i % 5 === 0;
		const rOut = 85;
		const rIn = isMajor ? 75 : 80;
		const p1 = polarToCartesian(CX, CY, rOut, angle);
		const p2 = polarToCartesian(CX, CY, rIn, angle);
		let label = null;
		if (isMajor) {
			const pr = polarToCartesian(CX, CY, 68, angle);
			label = { x: pr.x, y: pr.y, text: `${i * 10}%` };
		}
		return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, label };
	});
</script>

<svg width="200" height="120" viewBox="0 0 200 120" class="mx-auto">
	<!-- Base arc -->
	<path
		d={describeArc(CX, CY, RADIUS, START, START + TOTAL)}
		fill="none"
		stroke="#eee"
		stroke-width="20"
	/>

	<!-- Mismatch arc -->
	<path d={mismatchArc} fill="none" stroke={mismatchColor} stroke-width="10" />

	<!-- PT and Pop lines -->
	<line x1={CX} y1={CY} x2={ptLine.x} y2={ptLine.y} stroke="#7e57c2" stroke-width="3" />
	<line x1={CX} y1={CY} x2={popLine.x} y2={popLine.y} stroke="#3498db" stroke-width="3" />

	<!-- Ticks -->
	<g>
		{#each ticks as t}
			<line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#333" stroke-width={t.label ? 2 : 1} />
			{#if t.label}
				<text
					x={t.label.x}
					y={t.label.y}
					font-size="10"
					fill="#333"
					text-anchor="middle"
					dominant-baseline="middle"
				>
					{t.label.text}
				</text>
			{/if}
		{/each}
	</g>

	<circle cx={CX} cy={CY} r="4" fill="#000" />
</svg>

<div class="flex gap-4 text-sm mt-2 px-4 w-max mx-auto">
	<div>
		<span class="font-bold text-[#7e57c2]">{Math.round($ptTween)}/100</span> Öffentliche Anbindung
	</div>
	<div>
		<span class="font-bold text-[#3498db]">{Math.round($popTween)}/100</span> Bevölkerungsdichte
	</div>
	<div>
		<span class="font-bold" style="color: {mismatchColor}">
			{Math.round(Math.abs($ptTween - $popTween))}
		</span>
		Mismatch
	</div>
</div>
