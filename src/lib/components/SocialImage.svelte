<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	export let eyebrow;
	export let title;
	export let imageUrl;
	export let imageCenter = false;
</script>

<div class="social-wrapper social-background">
	<div class="social-container">
		{#if eyebrow}
			<p class="social-eyebrow">{eyebrow}</p>
		{/if}
		{#if title}
			<h2 class="social-heading">{title}</h2>
		{/if}

		{#if imageUrl}
			{#if imageCenter}
				<div class="social-image-grid">
					<img class="social-image-center" src={imageUrl} alt="" />
				</div>
			{:else}
				<img
					class="social-image {imageCenter ? 'social-image-center' : ''}"
					src={imageUrl}
					alt=""
				/>
			{/if}
		{/if}
	</div>
</div>

<style>
	/* no global styles available here, so everything coded by hand */
	html,
	body,
	div,
	span,
	applet,
	object,
	iframe,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	p,
	blockquote,
	pre,
	a,
	abbr,
	acronym,
	address,
	big,
	cite,
	code,
	del,
	dfn,
	em,
	img,
	ins,
	kbd,
	q,
	s,
	samp,
	small,
	strike,
	strong,
	sub,
	sup,
	tt,
	var,
	b,
	u,
	i,
	center,
	dl,
	dt,
	dd,
	ol,
	ul,
	li,
	fieldset,
	form,
	label,
	legend,
	table,
	caption,
	tbody,
	tfoot,
	thead,
	tr,
	th,
	td,
	article,
	aside,
	canvas,
	details,
	embed,
	figure,
	figcaption,
	footer,
	header,
	hgroup,
	menu,
	nav,
	output,
	ruby,
	section,
	summary,
	time,
	mark,
	audio,
	video {
		margin: 0;
		padding: 0;
		border: 0;
		font-size: 100%;
		font: inherit;
		vertical-align: baseline;
	}
	/* HTML5 display-role reset for older browsers */
	article,
	aside,
	details,
	figcaption,
	figure,
	footer,
	header,
	hgroup,
	menu,
	nav,
	section {
		display: block;
	}

	body {
		line-height: 1;
	}

	.social-wrapper {
		width: 1200px;
		height: 627px;
		display: grid;
		padding: 2em;
		font-family: 'Barlow', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	.social-background {
		background-color: #f5f5f5;
	}

	.social-container {
		width: 800px;
		height: 500px;
		margin: auto;
		background-color: #fff;
		box-shadow: 10px 10px 50px -22px rgba(0, 0, 0, 0.4);
		padding: 2em;
		position: relative;
	}

	.social-eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 600;
	}

	.social-heading {
		margin-top: 0.1em;
		font-size: 3em;
		font-weight: 600;
	}

	.social-image {
		max-width: 100%;
		max-height: 300px;
		position: absolute;
		bottom: 0;
		left: 2em;
	}

	.social-image-grid {
		display: grid;
		height: 100%;
	}

	.social-image-center {
		margin: auto;
		max-width: 90%;
		min-width: 50%;
		max-height: 80%;
		height: auto;
	}
</style>
