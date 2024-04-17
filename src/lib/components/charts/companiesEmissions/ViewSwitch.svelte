<script>
	export let isChecked = false;

	function toggleSwitch() {
		isChecked = !isChecked;
	}
</script>

<label class="flex items-center cursor-pointer">
	<span class="mr-2">Quick Switch</span>
	<div class="relative">
		<input
			type="checkbox"
			class="sr-only"
			bind:checked={isChecked}
			on:click={() => toggleSwitch()}
		/>
		<div
			class={isChecked
				? 'block bg-blue-700 w-10 h-6 rounded-full'
				: 'block bg-gray-300 w-10 h-6 rounded-full'}
		/>
		<div
			class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"
			class:dot-checked={isChecked}
		/>
	</div>
</label>

<style>
	.dot-checked {
		transform: translateX(100%);
	}
</style>
