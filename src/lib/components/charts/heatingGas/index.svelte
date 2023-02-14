<script>
	export let v;

	$: gasDaily = 131;
</script>

<div class="flex flex-col">
	<div class="flex space-x-4 items-end">
		<div class="-mb-1">
			<p class="text-8xl font-extralight tracking-tighter">{gasDaily}</p>
			<p class="font-medium -mt-2">{v.label}</p>
		</div>
	</div>
	<div />
</div>
