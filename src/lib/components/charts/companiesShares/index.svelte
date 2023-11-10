<script>
	import companies from '$lib/stores/companies';

	console.log(companies);

	function computeWedgeCenter({ radius, angle, angleSpan } = {}) {
		const c = { x: 500, y: 500 };
		const center = add(rotate({ x: radius, y: 0 }, angle + angleSpan / 2), c);
		return center;
	}
	function computeWedgePath({ radiusInner, radiusOuter, angle, angleSpan } = {}) {
		const c = { x: 500, y: 500 };
		const v_a1 = add(rotate({ x: radiusInner, y: 0 }, angle), c);
		const v_a2 = add(rotate({ x: radiusOuter, y: 0 }, angle), c);
		const v_b1 = add(rotate({ x: radiusInner, y: 0 }, angle + angleSpan), c);
		const v_b2 = add(rotate({ x: radiusOuter, y: 0 }, angle + angleSpan), c);
		console.log(angle, '->', angle + angleSpan);
		const path = [
			['M', v_a1.x, v_a1.y],
			['L', v_a2.x, v_a2.y],
			['A', radiusOuter, radiusOuter, 0, 0, 0, v_b2.x, v_b2.y],
			['L', v_b1.x, v_b1.y],
			['A', radiusInner, radiusInner, 0, 0, 1, v_a1.x, v_a1.y]
		]
			.flat()
			.join(' ');
		return path;
	}
	function magnitude(v) {
		return Math.sqrt(v.x * v.x + v.y * v.y);
	}
	function rotate(v, angle) {
		return {
			x: magnitude(v) * Math.sin((angle * Math.PI) / 180),
			y: magnitude(v) * Math.cos((angle * Math.PI) / 180)
		};
	}
	function add(v1, v2) {
		return { x: v1.x + v2.x, y: v1.y + v2.y };
	}
</script>

<div />
<svg viewBox="0 0 1000 1000">
	{#each companies as company, c}
		{@const summedShares = companies.reduce((sum, comp, i) => {
			if (i < c) return sum + comp.weight;
			else if (i == c) {
				console.log(comp.name);
				return sum;
			} else return sum;
		}, 0)}
		{@const wedge = computeWedgePath({
			radiusInner: 600 / 2,
			radiusOuter: 800 / 2,
			angle: (summedShares / 100) * 360,
			angleSpan: (company.weight / 100) * 360
		})}
		{@const wedgeCenter = computeWedgeCenter({
			radius: 900 / 2,
			angle: (summedShares / 100) * 360,
			angleSpan: (company.weight / 100) * 360
		})}
		<path d={wedge} fill="rgba(0,0,0,{c / 20})" stroke="red" />
		<rect
			stroke="black"
			fill="none"
			x={wedgeCenter.x - 50 / 2}
			y={wedgeCenter.y - 50 / 2}
			width="50"
			height="50"
		/>
		<image
			href="../icons/atx-companies/{company.logo}.svg"
			x={wedgeCenter.x - 50 / 2}
			y={wedgeCenter.y - 50 / 2}
			width="50"
			height="50"
		/>
	{/each}
</svg>
