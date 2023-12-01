<script>
	import Chart from '$lib/components/blocks/Chart.svelte';
	import atxCompanies from '$lib/stores/companies';

	const wedge_fill_color = "#4A81A9";
	const stroke_color = "#393B4B";
	const highlight_color = "#F5AF4B";

	const temp = {"weight": 0};
	const companies = atxCompanies
		.sort((a, b) => (a.sector < b.sector ? -1 : +1))
		.map((value, i) => {
			const cum_sum = temp["weight"];
			temp["weight"] += value.weight;
			return {...value, idx: i, cummulated_weight: cum_sum}
		});
	console.log([...new Set(companies.map((value) => value.sector))], companies.length); // 20 companies; 15 different sectors -> too many categorical values for color scale
	
	const grouped_companies = Object.groupBy(companies, (company) => company.sector);
	const sectors = Object.keys(grouped_companies).map((key) => {
		return {sector: key, weight: grouped_companies[key].reduce((sum, company) => sum + company.weight, 0), cummulated_weight: grouped_companies[key][0].cummulated_weight};
	});

	let hover_company = -1;

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
<svg viewBox="0 0 1000 1000" style="max-width: 900px;">
	{#each sectors as sector}

		{#if grouped_companies[sector.sector].length > 1}
			{@const wedge = computeWedgePath({
				radiusInner: 550 / 2,
				radiusOuter: 570 / 2,
				angle: 100 + (sector.cummulated_weight / 100) * 360,
				angleSpan: (sector.weight / 100) * 360
			})}
			{@const wedgeCenter = computeWedgeCenter({
				radius: 900 / 2,
				angle: 100 + (sector.cummulated_weight / 100) * 360,
				angleSpan: (sector.weight / 100) * 360
			})}
			{@const textCenter = computeWedgeCenter({
				radius: 420 / 2,
				angle: 100 + (sector.cummulated_weight / 100) * 360,
				angleSpan: (sector.weight / 100) * 360
			})}
			<!-- <path d={wedge} fill="rgba(0,0,0,{company.idx / 20})" stroke="red" /> -->
			<path d={wedge} fill={wedge_fill_color} stroke={stroke_color} />
			<text x={textCenter.x} y={textCenter.y} fill="black" text-anchor="middle">{Math.round(sector.weight*100)/100}%</text>
			<text x={textCenter.x} y={textCenter.y+15} fill="black" text-anchor="middle">{sector.sector}</text>
		{/if}
		{#each grouped_companies[sector.sector] as company}
			{#if company.weight > 3}
				{@const wedge = computeWedgePath({
					radiusInner: 600 / 2,
					radiusOuter: 800 / 2,
					angle: 100 + (company.cummulated_weight / 100) * 360,
					angleSpan: (company.weight / 100) * 360
				})}
				{@const wedgeCenter = computeWedgeCenter({
					radius: 900 / 2,
					angle: 100 + (company.cummulated_weight / 100) * 360,
					angleSpan: (company.weight / 100) * 360
				})}
				{@const textCenter = computeWedgeCenter({
					radius: 700 / 2,
					angle: 100 + (company.cummulated_weight / 100) * 360,
					angleSpan: (company.weight / 100) * 360
				})}
				<g 
					on:mouseenter={() => {
						hover_company = company.idx;
					}}
					on:mouseleave={() => {
						hover_company = -1;
					}} >
					<!-- <path d={wedge} fill="rgba(0,0,0,{company.idx / 20})" stroke="red" /> -->
					<path d={wedge} fill={hover_company == company.idx ? highlight_color : wedge_fill_color} stroke={stroke_color} />
					<text x={textCenter.x} y={textCenter.y} fill="white" text-anchor="middle"
						>{Math.round(company.weight*100)/100}%</text
					>
					<!-- <circle stroke={stroke_color} fill="none" cx={wedgeCenter.x} cy={wedgeCenter.y} r={40} /> -->
					<image
						href="../icons/atx-companies/{company.logo}.svg"
						x={wedgeCenter.x - 50 / 2}
						y={wedgeCenter.y - 50 / 2}
						width="50"
						height="50"
					/>
				</g>
			{:else}
				{@const wedge = computeWedgePath({
					radiusInner: 600 / 2,
					radiusOuter: 800 / 2,
					angle: 100 + (company.cummulated_weight / 100) * 360,
					angleSpan: (company.weight / 100) * 360
				})}
				{@const wedgeCenter = computeWedgeCenter({
					radius: 900/2, //(company.idx)%2==1 ? 1000 / 2 : 1150/2,
					angle: 100 + (company.cummulated_weight / 100) * 360,
					angleSpan: (company.weight / 100) * 360
				})}
				{@const textCenter = computeWedgeCenter({
					radius: 700 / 2,
					angle: 100 + (company.cummulated_weight / 100) * 360,
					angleSpan: (company.weight / 100) * 360
				})}
				<g 
					on:mouseenter={() => {
						hover_company = company.idx;
					}}
					on:mouseleave={() => {
						hover_company = -1;
					}} >
					<!-- <path d={wedge} fill="rgba(0,0,0,{company.idx / 20})" stroke="red" /> -->
					<path d={wedge} fill={hover_company == company.idx ? highlight_color : wedge_fill_color} stroke={stroke_color} />
					{#if hover_company == company.idx}
						<text x={textCenter.x} y={textCenter.y} fill="white" text-anchor="middle"
							>{Math.round(company.weight*100)/100}%</text
						>
						<!-- <circle stroke={stroke_color} fill="none" cx={wedgeCenter.x} cy={wedgeCenter.y} r={40} /> -->
						<image
							href="../icons/atx-companies/{company.logo}.svg"
							x={wedgeCenter.x - 50 / 2}
							y={wedgeCenter.y - 50 / 2}
							width="50"
							height="50"
						/>
					{/if}
				</g>
			{/if}
		{/each}
	{/each}
</svg>
