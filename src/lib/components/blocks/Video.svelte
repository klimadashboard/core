<script>
	export let block;
</script>

<div class="container px-4">
	<div class="video-container">
		<iframe
			src={block.content.url.replace('watch?v=', 'embed/')}
			title="Video player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		/>
	</div>
</div>

<style>
	.video-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio (height / width = 9/16 = 0.5625) */
		height: 0;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
