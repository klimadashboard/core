<!--
	A public transport vehicle in side view whose body is the bar: it stretches over `length` px.
	Rear and front keep their shape, the middle repeats cars/sections with windows, doors and wheels.
	Origin: rear end on top of the rails/road (y = 0); the vehicle extends right and upwards.
-->
<script lang="ts">
	import type { Vehicle } from './config';

	export let vehicle: Vehicle;
	export let length: number;
	export let color: string;

	const DARK = '#1f2937';
	const LIGHT = '#ffffff';

	type Spec = {
		height: number; // body height
		lift: number; // gap between body and rails (wheels)
		car: number; // preferred length of one car/section
		nose: number; // length of the front
		joint: 'gap' | 'bellows';
		windows: 'band' | 'single';
		wheel: number; // wheel radius
		roof?: 'pantograph' | 'unit';
	};

	const SPECS: Record<Vehicle, Spec> = {
		train: { height: 26, lift: 4.5, car: 84, nose: 17, joint: 'gap', windows: 'band', wheel: 2.3, roof: 'pantograph' },
		suburban_train: { height: 24, lift: 4.5, car: 66, nose: 15, joint: 'gap', windows: 'single', wheel: 2.1 },
		metro: { height: 22, lift: 4.5, car: 52, nose: 7, joint: 'gap', windows: 'single', wheel: 2 },
		tram: { height: 21, lift: 3, car: 44, nose: 10, joint: 'bellows', windows: 'band', wheel: 1.6, roof: 'pantograph' },
		bus: { height: 21, lift: 5.5, car: 56, nose: 3, joint: 'bellows', windows: 'band', wheel: 3.6, roof: 'unit' }
	};

	$: s = SPECS[vehicle] ?? SPECS.train;
	$: L = Math.max(0, length);
	// short bars: shrink the nose so rear and front still fit
	$: nose = Math.min(s.nose, L * 0.35);
	$: top = -(s.lift + s.height);
	$: bottom = -s.lift;
	$: cars = Math.max(1, Math.round(L / s.car));
	$: carLen = L / cars;
	$: joints = Array.from({ length: cars - 1 }, (_, i) => (i + 1) * carLen);
	$: jointW = s.joint === 'bellows' ? 2.5 : 1;

	// body outline: rounded rear, straight roof, vehicle-specific front
	$: body = (() => {
		const r = Math.min(2, L / 4);
		const f = L - nose;
		const h = s.height;
		const rear = `M0,${bottom} V${top + r} Q0,${top} ${r},${top}`;
		if (vehicle === 'bus') {
			return `${rear} H${L - 1.5} Q${L},${top} ${L},${top + 1.5} V${bottom - 1.5} Q${L},${bottom} ${L - 1.5},${bottom} Z`;
		}
		if (vehicle === 'metro') {
			return `${rear} H${f} C${f + nose * 0.8},${top} ${L},${top + h * 0.3} ${L},${top + h * 0.6} V${bottom} Z`;
		}
		// trains and trams: long rounded/sloped nose
		return `${rear} H${f} C${f + nose * 0.55},${top} ${L},${top + h * 0.35} ${L},${top + h * 0.75} Q${L},${bottom} ${L - 1},${bottom} Z`;
	})();

	// windows per car: evenly spread between the joints, leaving the cab free
	$: windowRow = (() => {
		const out: { x: number; w: number }[] = [];
		const w = s.windows === 'single' ? 5 : 7;
		const gap = s.windows === 'single' ? 2 : 1.2;
		for (let c = 0; c < cars; c++) {
			const start = c * carLen + (c === 0 ? 2.5 : jointW + 1.5);
			const end = c === cars - 1 ? L - nose - 1 : (c + 1) * carLen - 1.5;
			const n = Math.floor((end - start + gap) / (w + gap));
			if (n < 1) continue;
			const ww = (end - start - gap * (n - 1)) / n;
			for (let i = 0; i < n; i++) out.push({ x: start + i * (ww + gap), w: ww });
		}
		return out;
	})();

	// one door per car, in its middle
	$: doors = Array.from({ length: cars }, (_, c) => c * carLen + carLen / 2).filter(
		(x) => x < L - nose - 4
	);

	// wheels: bogies at both ends of each rail car, two axles per bus section
	$: wheels = (() => {
		const out: number[] = [];
		for (let c = 0; c < cars; c++) {
			const a = c * carLen;
			const b = c === cars - 1 ? L - nose * 0.5 : (c + 1) * carLen;
			if (b - a < 12) {
				out.push(a + (b - a) / 2);
				continue;
			}
			if (vehicle === 'bus') out.push(a + 7, b - 7);
			else {
				const d = s.wheel * 2 + 0.6;
				out.push(a + 4, a + 4 + d, b - 4 - d, b - 4);
			}
		}
		return out;
	})();

	$: windowY = top + s.height * 0.2;
	$: windowH = s.height * (s.windows === 'single' ? 0.38 : 0.42);
</script>

{#if L > 0}
	<g aria-hidden="true">
		<!-- roof equipment on the first car -->
		{#if s.roof === 'pantograph' && L > 30}
			{@const px = Math.min(carLen, L - nose) * 0.45}
			<path
				d="M{px},{top} L{px + 4},{top - 4.5} L{px + 1},{top - 7} M{px - 1},{top - 7} H{px + 3}"
				fill="none"
				stroke={DARK}
				stroke-width="0.9"
				stroke-linejoin="round"
			/>
		{:else if s.roof === 'unit' && L > 24}
			<rect x={Math.max(2, L - nose - 16)} y={top - 1.6} width="10" height="1.8" rx="0.6" fill="#9ca3af" />
		{/if}

		<path d={body} fill={color} />

		<!-- light stripe along the bottom -->
		<rect x="0.5" y={bottom - s.height * 0.22} width={Math.max(0, L - nose)} height="1.4" fill={LIGHT} opacity="0.85" />

		{#each windowRow as win}
			{#if s.windows === 'single'}
				<rect x={win.x} y={windowY} width={win.w} height={windowH} rx="0.8" fill={LIGHT} stroke={DARK} stroke-width="0.6" />
			{:else}
				<rect x={win.x} y={windowY} width={win.w} height={windowH} rx="0.6" fill={DARK} opacity="0.85" />
			{/if}
		{/each}

		{#each doors as x}
			<rect x={x - 1.8} y={windowY - 0.5} width="3.6" height={bottom - windowY - 0.5} rx="0.4" fill={DARK} opacity="0.75" />
		{/each}

		<!-- couplings between cars, bellows between sections -->
		{#each joints as x}
			{#if s.joint === 'bellows'}
				<rect x={x - jointW / 2} y={top + 1} width={jointW} height={s.height - 1} fill="#9ca3af" />
			{:else}
				<rect x={x - 0.5} y={top} width="1" height={s.height} fill={DARK} opacity="0.45" />
			{/if}
		{/each}

		<!-- windscreen + headlight -->
		{#if nose >= 3}
			<path
				d="M{L - nose + 0.5},{windowY} H{L - nose * 0.45} Q{L - 0.6},{windowY + windowH * 0.3} {L - 0.4},{windowY + windowH} H{L - nose + 0.5} Z"
				fill={DARK}
				opacity="0.9"
			/>
			<circle cx={L - 1.4} cy={bottom - 2.6} r="0.8" fill={LIGHT} />
		{/if}

		{#each wheels as x}
			<circle cx={x} cy={-s.wheel} r={s.wheel} fill={DARK} />
			{#if vehicle === 'bus'}
				<circle cx={x} cy={-s.wheel} r={s.wheel * 0.4} fill="#d1d5db" />
			{/if}
		{/each}
	</g>
{/if}
