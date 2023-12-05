<script>
	import Chart from '$lib/components/blocks/Chart.svelte';
	import atxCompanies from '$lib/stores/companies';

	const wedge_fill_color = '#4A81A9';
	const stroke_color = '#393B4B';
	const highlight_color = '#F5AF4B';

	const temp = { weight: 0 };
	const companies = atxCompanies
		.sort((a, b) => (a.sector < b.sector ? -1 : +1))
		.map((value, i) => {
			const cum_sum = temp['weight'];
			temp['weight'] += value.weight;
			return { ...value, idx: i, cummulated_weight: cum_sum };
		});
	console.log([...new Set(companies.map((value) => value.sector))], companies.length); // 20 companies; 15 different sectors -> too many categorical values for color scale

	const grouped_companies = Object.groupBy(companies, (company) => company.sector);
	const sectors = Object.keys(grouped_companies).map((key) => {
		return {
			sector: key,
			weight: grouped_companies[key].reduce((sum, company) => sum + company.weight, 0),
			cummulated_weight: grouped_companies[key][0].cummulated_weight
		};
	});

	let hover_company_idx = -1;
	let hover_sector = '';

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
		<!-- plot sectors if they comprise of more than 1 company -->
		{#if grouped_companies[sector.sector].length > 1}
			{@const angle = 100 + (sector.cummulated_weight / 100) * 360}
			{@const angle_span = (sector.weight / 100) * 360}
			{@const wedge = computeWedgePath({
				radiusInner: 550 / 2,
				radiusOuter: 570 / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const textCenter = computeWedgeCenter({
				radius: 400 / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const font_size = hover_sector == sector.sector ? 20 : 16}
			<g
				on:mouseenter={() => {
					hover_sector = sector.sector;
				}}
				on:mouseleave={() => {
					hover_sector = '';
				}}
			>
				<path
					d={wedge}
					fill={hover_sector == sector.sector ? highlight_color : wedge_fill_color}
					stroke={stroke_color}
				/>
				<text
					font-size={font_size}
					x={textCenter.x}
					y={textCenter.y}
					fill="black"
					text-anchor="middle">{Math.round(sector.weight * 100) / 100}%</text
				>
				<text
					font-size={font_size}
					x={textCenter.x}
					y={textCenter.y + font_size}
					fill="black"
					text-anchor="middle">{sector.sector}</text
				>
			</g>
		{/if}

		<!-- plot companies -->
		{#each grouped_companies[sector.sector] as company}
			{@const logo_width =
				Math.max(50, company.minLogoWidth ? company.minLogoWidth : 0) +
				(hover_company_idx == company.idx ? 20 : 0)}
			{@const logo_aspect_ratio = company.aspectRatio ? company.aspectRatio : 1}
			{@const logo_height = logo_width * logo_aspect_ratio}
			{@const angle = 100 + (company.cummulated_weight / 100) * 360}
			{@const angle_span = (company.weight / 100) * 360}
			{@const wedge = computeWedgePath({
				radiusInner: 600 / 2,
				radiusOuter: 800 / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const wedgeCenter = computeWedgeCenter({
				radius: 900 / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const textCenter = computeWedgeCenter({
				radius: 700 / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			<g
				on:mouseenter={() => {
					hover_company_idx = company.idx;
				}}
				on:mouseleave={() => {
					hover_company_idx = -1;
				}}
			>
				<path
					d={wedge}
					fill={hover_company_idx == company.idx ? highlight_color : wedge_fill_color}
					stroke={stroke_color}
				/>
				<!-- only show logo, if the share is big enough or if the company is hovered -->
				{#if company.weight > 3 || hover_company_idx == company.idx}
					<text x={textCenter.x} y={textCenter.y} fill="white" text-anchor="middle"
						>{Math.round(company.weight * 100) / 100}%</text
					>
					<!-- <circle stroke={stroke_color} fill="none" cx={wedgeCenter.x} cy={wedgeCenter.y} r={40} /> -->
					<image
						href="../icons/atx-companies/{company.logo}.svg"
						x={wedgeCenter.x - logo_width / 2}
						y={wedgeCenter.y - logo_height / 2}
						width={logo_width}
						height={logo_height}
					/>
				{/if}
			</g>
		{/each}
	{/each}
</svg>
