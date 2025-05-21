<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	type RoundedRectProps = SVGAttributes<SVGPathElement> & {
		corners: [number, number, number, number];
		x: number;
		y: number;
		width: number;
		height: number;
	};

	let {
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		corners,
		...svgAttributes
	}: RoundedRectProps = $props();

	let limitedCorners = $derived(corners.map((corner) => Math.min(width / 2, height / 2, corner)));

	const p0 = $derived([
		[x, y + limitedCorners[0], limitedCorners[0]],
		[x + limitedCorners[0], y, limitedCorners[0]]
	]);
	const p1 = $derived([
		[x + width - limitedCorners[1], y, limitedCorners[1]],
		[x + width, y + limitedCorners[1], limitedCorners[1]]
	]);
	const p2 = $derived([
		[x + width, y + height - limitedCorners[2], limitedCorners[2]],
		[x + width - limitedCorners[2], y + height, limitedCorners[2]]
	]);
	const p3 = $derived([
		[x + limitedCorners[3], y + height, limitedCorners[3]],
		[x, y + height - limitedCorners[3], limitedCorners[3]]
	]);

	let path = $derived(
		[...p0, ...p1, ...p2, ...p3]
			.map(([x, y, r], i) => (i % 2 === 0 ? `L${x} ${y}` : `A ${r} ${r} 0 0 1 ${x},${y}`))
			.join('')
			.replace(/^L/, 'M')
	);
</script>

<path d={path} {...svgAttributes} />

<style>
</style>
