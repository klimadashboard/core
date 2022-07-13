<script>
    async function getCharts() {
        const res = await fetch(`https://cms.klimadashboard.org/charts.json`);
		const json = await res.json();

		if (json) {
			return json;
		} else {
			throw new Error(JSON.stringify(json));
		}
  };

  let promise = getCharts();
</script>


<section class="container relative py-16">
    <p class="uppercase tracking-wide font-semibold mb-2 text-green-600">Chart-Index &#8212;</p>
</section>

<div class="container">
{#await promise}
	<p>...waiting</p>
{:then chartData}
    
    <p class="mb-8">Data imported –</p>
    
    <div class="grid md:grid-cols-3 gap-4">
    {#each Object.values(chartData.charts) as chart}
        <div class="bg-gray-100 p-8">
            <h2 class="text-4xl">{chart.content.heading}</h2>
            <p>{chart.content.text}</p>
        </div>
    {/each}
    </div>
    

{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
</div>