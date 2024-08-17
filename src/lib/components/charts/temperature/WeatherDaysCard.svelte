<script>
	export let type;
	export let current;
	export let comparison;
	export let compareLastYear;
	export let compareFirstYear;
	export let selectedYear;
</script>

<div class="rounded overflow-hidden bg-gray-100" style="border: 2px solid {type.color}">
	<div
		class="text-white px-3 py-2 leading-none flex items-end gap-1 flex-wrap w-full"
		style="background: {type.color}"
	>
		<h3 class="text-2xl font-medium">{type.label}</h3>
		<p class="text-lg">{type.description}</p>
		<div class="ml-auto -translate-y-0.5">
			{@html type.icon}
		</div>
	</div>
	<div class="p-3 pt-1 grid grid-cols-2 gap-2" style="color: {type.color}">
		<div class="flex items-end space-x-1">
			<p class="text-6xl font-extralight tracking-tight">
				{current}
			</p>
			<p class="leading-none font-semibold">{type.label} im Jahr {selectedYear}</p>
		</div>
		<div class="flex items-end space-x-1">
			<p class="text-6xl font-extralight">
				{comparison}
			</p>
			<p class="leading-none font-semibold">
				{type.label} im Durchschnitt {compareFirstYear}-{compareLastYear}
			</p>
		</div>
	</div>
</div>
