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

	$: if (outline) {
		const projectedCoords = [];

		function collectAndProject(coords) {
			if (typeof coords[0] === 'number') {
				const [lng, lat] = coords;
				projectedCoords.push(projectCoord(lng, lat));
			} else {
				coords.forEach(collectAndProject);
			}
		}

		if (outline.type === 'Polygon') {
			outline.coordinates.forEach(collectAndProject);
		} else if (outline.type === 'MultiPolygon') {
			outline.coordinates.forEach((polygon) => polygon.forEach(collectAndProject));
		}

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

			// Generate path data with projected coordinates
			function generatePath(rings) {
				return rings
					.map((ring) => {
						return (
							ring
								.map((coord, i) => {
									const [lng, lat] = coord;
									const [x, y] = projectCoord(lng, lat);
									return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
								})
								.join(' ') + ' Z'
						);
					})
					.join(' ');
			}

			if (outline.type === 'Polygon') {
				pathData = generatePath(outline.coordinates);
			} else if (outline.type === 'MultiPolygon') {
				pathData = outline.coordinates.map((polygon) => generatePath(polygon)).join(' ');
			}
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
			<path d={pathData} fill="none" stroke="#fff" stroke-width="0.5%" stroke-opacity="0.5" />
		</svg>
	</div>
{/if}
