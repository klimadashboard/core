<script>
    import Papa from "papaparse";
    import Chart from "./Chart.svelte";
  
    $: dataset = null;
    $: readMore = false;
  
    Papa.parse(
      "../data_archive/Emission_All_sectors_Bundeslaender_Austria_1990-2019.csv",
      {
        download: true,
        dynamicTyping: true,
        header: true,
        complete: function (results) {
          if (results) {
            dataset = results.data;
            // console.log(dataset);
          }
        },
      }
    );
  </script>
  
  {#if dataset}
  <Chart data={dataset} />
  {/if}
