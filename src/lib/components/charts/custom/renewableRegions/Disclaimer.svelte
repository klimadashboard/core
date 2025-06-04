<script>
	import formatNumber from '$lib/stores/formatNumber';
	export let region;
	export let ratio;
	export let colors;
</script>

<div class="p-3 rounded-2xl mt-4 text-white leading-snug" style="background: {colors[1]}">
	<p>
		{formatNumber(100 - ratio)}% aller im Marktstammdatenregister registrierten Solaranlagen in {region.name}
		(ausgenommen Balkonkraftwerke) wurden noch nicht abschließend durch den Netzbetreiber geprüft. Die
		tatsächlich installierte Leistung kann demnach variieren.
	</p>
</div>
