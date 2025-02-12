<script>
	export let data;

	function downloadJSON() {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'data.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function downloadCSV() {
		if (!data || !Array.isArray(data)) return;

		let csvContent = 'x';
		const labels = [...new Set(data.flatMap((entry) => entry.layers.map((layer) => layer.label)))];
		csvContent += ',' + labels.join(',') + '\n';

		data.forEach((entry) => {
			let row = [entry.x];
			const valuesMap = new Map(entry.layers.map((layer) => [layer.label, layer.y]));
			labels.forEach((label) => {
				row.push(valuesMap.get(label) ?? '');
			});
			csvContent += row.join(',') + '\n';
		});

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'data.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="text-sm flex items-center gap-2">
	<button on:click={downloadCSV} class="button">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="w-4 h-4"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"
			/><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg
		>
		<span>CSV</span></button
	>
	<button on:click={downloadJSON} class="button">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="w-4 h-4"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"
			/><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg
		>
		<span>JSON</span></button
	>
</div>
