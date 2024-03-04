<script>
	export let isChecked = false;

	function toggleSwitch() {
		isChecked = !isChecked;
	}
</script>

<label class="flex items-center cursor-pointer">
	<div class="relative">
		<input
			type="checkbox"
			class="sr-only"
			bind:checked={isChecked}
			on:click={() => toggleSwitch()}
		/>
		<div
			class={isChecked
				? 'block bg-blue-700 w-14 h-8 rounded-full'
				: 'block bg-gray-300 w-14 h-8 rounded-full'}
		/>
		<div
			class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"
			class:dot-checked={isChecked}
		/>
	</div>
	<span class="ml-3">{isChecked ? 'Ein Unternehmen im Fokus' : 'Mehrere Unternehmen im Vergleich'}</span>
</label>

<style>
	.dot-checked {
		transform: translateX(100%);
	}
</style>
