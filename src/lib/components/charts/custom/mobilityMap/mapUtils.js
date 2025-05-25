export function buildTileOutlines(selectedTiles) {
	const edgeMap = new Map();

	for (const tile of selectedTiles) {
		const coords = tile.geometry.coordinates?.[0];
		if (!coords) continue;
		for (let i = 0; i < coords.length - 1; i++) {
			const a = coords[i];
			const b = coords[i + 1];
			const key = `${a[0]},${a[1]}|${b[0]},${b[1]}`;
			const revKey = `${b[0]},${b[1]}|${a[0]},${a[1]}`;

			if (edgeMap.has(revKey)) {
				edgeMap.delete(revKey);
			} else {
				edgeMap.set(key, [a, b]);
			}
		}
	}

	const remainingEdges = Array.from(edgeMap.values());
	const outlines = [];

	while (remainingEdges.length > 0) {
		const path = [remainingEdges[0][0], remainingEdges[0][1]];
		remainingEdges.splice(0, 1);

		while (true) {
			const last = path[path.length - 1];
			const idx = remainingEdges.findIndex(
				([a, b]) => (a[0] === last[0] && a[1] === last[1]) || (b[0] === last[0] && b[1] === last[1])
			);
			if (idx === -1) break;
			const [a, b] = remainingEdges.splice(idx, 1)[0];
			const next = a[0] === last[0] && a[1] === last[1] ? b : a;
			path.push(next);
		}

		if (
			path.length > 2 &&
			(path[0][0] !== path[path.length - 1][0] || path[0][1] !== path[path.length - 1][1])
		) {
			path.push(path[0]);
		}

		if (path.length > 3) {
			outlines.push({
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [path]
				},
				properties: {}
			});
		}
	}

	return {
		type: 'FeatureCollection',
		features: outlines
	};
}
