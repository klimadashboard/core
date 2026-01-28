<script>
	export let id = null;
	export let value = null;
	export let placeholder = null;
</script>

<div class="flex flex-nowrap">
	<div class="relative">
		<input
			{id}
			bind:value
			on:input
			{placeholder}
			class="pl-4 pr-8 py-2 bg-white appearance-none rounded-none border border-grey-500"
		/>
	</div>
	<div class="bg-gray-200 icon">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="w-4 h-4"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
			<path d="M21 21l-6 -6" />
		</svg>
	</div>
</div>
