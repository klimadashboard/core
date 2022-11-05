<script>
    import Papa from "papaparse";

    $: rawData = [];

    Papa.parse(
    './data/scenarios_co2budget.csv',
    {
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          rawData = results.data;
          console.log(rawData);
        }
      }
    }
    );
</script>

<div>

</div>