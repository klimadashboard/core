<script>
	export let v;

	$: oilDaily = 119;
</script>

<div class="flex flex-col">
	<div class="flex space-x-4 items-end">
		<div class="-mb-1">
			<p class="text-8xl font-extralight tracking-tighter">{oilDaily}</p>
			<p class="font-medium -mt-2">{v.label}</p>
		</div>
	</div>
	<div />
</div>
