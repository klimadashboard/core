<script>
	export let showText = false;
</script>

<div class="">
	<div class="spinner bg-green-400 mx-auto" />
	{#if showText}
		<p class="text-sm mx-auto text-green-600 text-center">Daten werden geladen....</p>
	{/if}
</div>

<style>
	.spinner {
		width: 40px;
		height: 40px;

		border-radius: 100%;
		-webkit-animation: sk-scaleout 1s infinite ease-in-out;
		animation: sk-scaleout 1s infinite ease-in-out;
	}

	@-webkit-keyframes sk-scaleout {
		0% {
			-webkit-transform: scale(0);
		}
		100% {
			-webkit-transform: scale(1);
			opacity: 0;
		}
	}

	@keyframes sk-scaleout {
		0% {
			-webkit-transform: scale(0);
			transform: scale(0);
		}
		100% {
			-webkit-transform: scale(1);
			transform: scale(1);
			opacity: 0;
		}
	}
</style>
