<script>
	export let outline;

	let pathData = '';
	let viewBox = '0 0 100 100';

	// Convert lat/lng to Web Mercator projection
	function projectCoord(lng, lat) {
		const x = lng;
		// Mercator Y projection
		const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * (180 / Math.PI);
		return [x, y];
	}

	// Shoelace area of a projected ring (absolute value)
	function ringArea(ring) {
		let sum = 0;
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
		}
		return Math.abs(sum / 2);
	}

	$: if (outline) {
		// Only draw the outer ring of each polygon: interior rings (holes) are
		// mostly slivers left over from merging municipalities and render as dots.
		const polygons =
			outline.type === 'Polygon'
				? [outline.coordinates]
				: outline.type === 'MultiPolygon'
					? outline.coordinates
					: [];
		const projectedRings = polygons
			.filter((polygon) => polygon?.[0]?.length)
			.map((polygon) => polygon[0].map(([lng, lat]) => projectCoord(lng, lat)));

		// Drop tiny parts (< 0.05 % of the largest part) — slivers, not real exclaves
		const areas = projectedRings.map(ringArea);
		const maxArea = Math.max(0, ...areas);
		const rings = projectedRings.filter((_, i) => areas[i] >= maxArea * 0.0005);
		const projectedCoords = rings.flat();

		if (projectedCoords.length > 0) {
			// Calculate bounds from projected coordinates
			let minX = Infinity,
				maxX = -Infinity,
				minY = Infinity,
				maxY = -Infinity;

			projectedCoords.forEach(([x, y]) => {
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			});

			const width = maxX - minX;
			const height = maxY - minY;
			const padding = Math.max(width, height) * 0.1;

			viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;

			pathData = rings
				.map(
					(ring) => ring.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ') + ' Z'
				)
				.join(' ');
		} else {
			pathData = '';
		}
	}
</script>

{#if pathData}
	<div class="relative w-full h-full object-fit">
		<svg
			class="absolute inset-0 w-full h-full pointer-events-none"
			{viewBox}
			preserveAspectRatio="xMidYMid meet"
			style="transform: scaleY(-1);"
		>
			<path
				d={pathData}
				fill="none"
				stroke="#F7FFA5"
				class="drop-shadow-2xl shadow-[#F7FFA5]"
				stroke-width="0.5%"
				stroke-opacity="0.5"
			/>
		</svg>
	</div>
{/if}
