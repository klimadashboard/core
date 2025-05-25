<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	type GradientProps = SVGAttributes<SVGElement> & {
		direction?: 'top' | 'bottom' | 'left' | 'right';
		from?: string;
		to?: string;
		fromOpacity?: string | number;
		toOpacity?: string | number;
	};
	let {
		direction = 'top',
		id,
		from = 'currentColor',
		to = 'currentColor',
		fromOpacity = 1,
		toOpacity = 0.3,
		...svgAttributes
	}: GradientProps = $props();

	let directionProps = $derived.by(() => {
		switch (direction) {
			case 'right':
				return { x1: 0, y1: 0, x2: '100%', y2: 0 };
			case 'left':
				return { x1: '100%', y1: 0, x2: 0, y2: 0 };
			case 'top':
				return { x1: 0, y1: '100%', x2: 0, y2: 0 };
			default:
				return { x1: 0, y1: 0, x2: 0, y2: '100%' };
		}
	});
</script>

<linearGradient {...directionProps} {id} {...svgAttributes}>
	<stop stop-color={from} stop-opacity={fromOpacity} offset="0" />
	<stop stop-color={to} stop-opacity={toOpacity} offset="100%" />
</linearGradient>
