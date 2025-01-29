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

        let csvContent = "x";
        const labels = [...new Set(data.flatMap(entry => entry.layers.map(layer => layer.label)))];
        csvContent += "," + labels.join(",") + "\n";

        data.forEach(entry => {
            let row = [entry.x];
            const valuesMap = new Map(entry.layers.map(layer => [layer.label, layer.y]));
            labels.forEach(label => {
                row.push(valuesMap.get(label) ?? "");
            });
            csvContent += row.join(",") + "\n";
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
    <p class="font-bold">Download data</p>
    <button on:click={downloadCSV} class="button">CSV</button>
    <button on:click={downloadJSON} class="button">JSON</button>
</div>
