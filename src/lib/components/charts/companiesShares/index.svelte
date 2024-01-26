<script>
	import Chart from '$lib/components/blocks/Chart.svelte';
	import atxCompanies, { companyId } from '$lib/stores/companies';

	import * as d3 from 'd3';

	const radius_main_circle = 500;
	const margin_main_circle = 70;

	const radius_inner_circle = 400;
	const margin_inner_circle = 10;

	const weight_threshold = 3.3;
	const c = { x: 400, y: 400 }; // center of the circle

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

	const stroke_color = 'white'; //'#393B4B';
	const text_color = 'black'; //'white';
	const highlight_color = '#F5AF4B';
	const wedge_fill_color = '#4A81A9';
	const sector_colors = d3.scaleOrdinal().domain(sectors.keys()).range(d3.schemeSet3);
	// const sector_colors = () => wedge_fill_color;
	// console.log(myColor("Banken"))

	let hover_company_idx = -1;
	let hover_sector = '';

	function computeWedgeCenter({ radius, angle, angleSpan } = {}) {
		const center = add(rotate({ x: radius, y: 0 }, angle + angleSpan / 2), c);
		return center;
	}
	function computeWedgePath({ radiusInner, radiusOuter, angle, angleSpan } = {}) {
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
<svg viewBox="0 0 {c.x * 2} {c.y * 2}" style="max-width: 700px;">
	{#each sectors as sector}
		<!-- plot sectors if they comprise of more than 1 company -->
		<!-- TODO: do we want to plot all sectors, or just with more than 1 company? -->
		{#if grouped_companies[sector.sector].length > 0}
			{@const angle = 100 + (sector.cummulated_weight / 100) * 360}
			{@const angle_span = (sector.weight / 100) * 360}
			{@const wedge = computeWedgePath({
				radiusInner: (radius_inner_circle - margin_inner_circle) / 2,
				radiusOuter: (radius_inner_circle + margin_inner_circle) / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const textCenter = computeWedgeCenter({
				radius: (radius_inner_circle - 1.1 * margin_main_circle) / 2,
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
					fill={hover_sector == sector.sector ? highlight_color : sector_colors(sector.sector)}
					stroke={stroke_color}
				/>
				<text
					font-size={font_size}
					x={textCenter.x}
					y={textCenter.y}
					fill="black"
					text-anchor="middle">{Math.round(sector.weight * 100) / 100}%</text
				>
				{#if hover_sector == sector.sector}
					<text
						font-size={font_size}
						x={textCenter.x}
						y={textCenter.y + font_size}
						fill="black"
						text-anchor="middle">{sector.sector}</text
					>
				{/if}
			</g>
		{/if}

		<!-- plot companies -->
		{#each grouped_companies[sector.sector] as company}
			{@const compute_logo_dimensions = () => {
				// give all logos the same area and calculate height and width based on the area and aspect ratio of the logo
				const area = hover_company_idx == company.idx ? 3000 : 2000;
				const aspect_ratio = company.aspectRatio ? company.aspectRatio : 1;
				const width = Math.sqrt(area * aspect_ratio);
				const height = width / aspect_ratio;
				return { width: width, height: height };
			}}
			{@const logo_dimensions = compute_logo_dimensions()}
			{@const angle = 100 + (company.cummulated_weight / 100) * 360}
			{@const angle_span = (company.weight / 100) * 360}
			{@const compute_logo_circle_aspect_ratio = () => {
				const width_weight = Math.abs(Math.sin(((angle + angle_span / 2) * Math.PI) / 180));
				const height_weight = Math.abs(Math.cos(((angle + angle_span / 2) * Math.PI) / 180));
				return width_weight / (height_weight + width_weight);
			}}
			{@const logo_circle_aspect_ratio = compute_logo_circle_aspect_ratio()}
			{@const wedge = computeWedgePath({
				radiusInner: (radius_main_circle - margin_main_circle) / 2,
				radiusOuter: (radius_main_circle + margin_main_circle) / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const logoCenter = computeWedgeCenter({
				radius:
					(radius_main_circle +
						margin_main_circle *
							(company.weight > weight_threshold
								? 1.5
								: 2.0 + (logo_circle_aspect_ratio * logo_dimensions.width) / 200) +
						(logo_dimensions.width * logo_circle_aspect_ratio +
							logo_dimensions.height * (1 - logo_circle_aspect_ratio))) /
					2,
				angle: angle,
				angleSpan: angle_span
			})}
			{@const textCenter = computeWedgeCenter({
				radius: radius_main_circle / 2,
				angle: angle,
				angleSpan: angle_span
			})}
			<g
				on:mouseenter={() => {
					hover_company_idx = company.idx;
					companyId.set(company.id);
				}}
				on:mouseleave={() => {
					hover_company_idx = -1;
				}}
			>
				<path
					d={wedge}
					fill={hover_company_idx == company.idx || hover_sector == company.sector
						? highlight_color
						: sector_colors(company.sector)}
					stroke={stroke_color}
				/>
				<!-- only show logo, if the share is big enough or if the company is hovered -->
				{#if company.weight > weight_threshold || hover_company_idx == company.idx}
					<text x={textCenter.x} y={textCenter.y} fill={text_color} text-anchor="middle"
						>{Math.round(company.weight * 100) / 100}%</text
					>
					<!-- <circle stroke={stroke_color} fill="none" cx={wedgeCenter.x} cy={wedgeCenter.y} r={40} /> -->
					<image
						href="../icons/atx-companies/{company.logo}.svg"
						x={logoCenter.x - logo_dimensions.width / 2}
						y={logoCenter.y - logo_dimensions.height / 2}
						width={logo_dimensions.width}
						height={logo_dimensions.height}
					/>
				{/if}
			</g>
		{/each}
	{/each}
</svg>
