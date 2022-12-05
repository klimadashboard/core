<script>
    import { locale } from "$lib/stores/i18n";
    import domtoimage from 'dom-to-image';
    import Loader from "$lib/components/Loader.svelte";
    const charts = import.meta.glob('./*/index.svelte', { import: 'default', eager: true });

    console.log(charts);

    export let id;
    export let hideWrapper;
    
    let Chart;
    let chartId;
    let item = null;

    async function getCharts() {
      const res = await fetch("https://cms.klimadashboard.org/" + $locale + "/charts.json");
      const json = await res.json();

    if (json) {
      const chartData = Object.values(json.charts).find(entry => entry.id == id);
      Chart = await charts['./' + chartData.content.identifier_string + '/index.svelte'];
      console.log(Chart);
      chartId = chartData.id;
      return chartData;
    } else {
      throw new Error(JSON.stringify(json));
    }
    };

    $: promise = getCharts();

    $: if($locale) {
      // reload when language changes
      promise = getCharts();
    }

    const copyToClipboard = function(copyText) {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = copyText;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }
    
    $: copyEmbedCode = function() {
        var copyText = '<iframe src="' + window.location.origin + '/embed/' + chartId + '" width=1200 height=400>';
        copyToClipboard(copyText);
	  	alert('Der iFrame-Code wurde in die Zwischenablage kopiert.')
    }

    const exportImage = async () => {
    domtoimage
      .toBlob(item, {
        filter: (e) => {
          return Object.keys(e.dataset || {}).includes('shareIgnore')
            ? false
            : true;
        },
        width: item.clientWidth * 4,
        height: item.clientHeight * 4,
        style: {
          transform: 'scale(4)',
          transformOrigin: 'top left'
        }
      })
      .then(async function (blob) {
        const filesArray = [
          new File([blob], 'share.png', {
            type: blob.type,
            lastModified: new Date().getTime()
          })
        ];
        const shareData = {
          files: filesArray
        };

        try {
          await navigator.share(shareData);
        } catch (err) {
          console.log('Cannot share data: ' + err);
        }
      });
  };

  const createVariables = function(json) {
    if(json) {
    const input = JSON.parse(json);
    const variable = {};
    for(var i = 0; i < input.length; i++) {
        variable[input[i].content.label] = input[i].content.text;
    }
    return variable;
  } else {
    return "";
  }
  };

  $: showNotices = false;
</script>

{#await promise}
<Loader />
{:then chart}
{#if hideWrapper}
    <svelte:component this={Chart} v={createVariables(chart.content.variables)} />
{:else}
<div class="bg-white p-4 border border-gray-100 rounded relative {chart.content.methods ? "pb-16" : ""}" id="{chart.content.identifier_string}" bind:this={item}>
  
  <div class="flex justify-between items-center mb-1">
        <h2 class="uppercase tracking-wide font-semibold text-sm">{chart.content.title}</h2>
        <div class="flex items-center gap-3 text-gray-400 transition">
            <button on:mousedown={() => exportImage()} class="hover:text-black" aria-label="Als Bild exportieren">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-photo" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <line x1="15" y1="8" x2="15.01" y2="8"></line>
                    <rect x="4" y="4" width="16" height="16" rx="3"></rect>
                    <path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5"></path>
                    <path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2"></path>
                 </svg>
            </button>
            <button on:mousedown={() => copyEmbedCode()} class="hover:text-black" aria-label="Einbetten">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-code" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <polyline points="7 8 3 12 7 16"></polyline>
                    <polyline points="17 8 21 12 17 16"></polyline>
                    <line x1="14" y1="4" x2="10" y2="20"></line>
                 </svg>
            </button>
            <a href="https://klimadashboard.at" class="ml-2" aria-label="Klimadashboard.at">
            <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 rounded"><rect width="256" height="256" fill="url(#kd-gradient-{chart.id})"></rect><path d="M119.45 88H53C50.7909 88 49 89.7909 49 92V164C49 166.209 50.7909 168 53 168H119.45C122.998 168 124.79 163.723 122.3 161.194L92.3872 130.806C90.8547 129.249 90.8547 126.751 92.3872 125.194L122.3 94.8061C124.79 92.2773 122.998 88 119.45 88Z" fill="#DBF0E0"></path><path opacity="0.6" d="M162.95 88H134.808C133.732 88 132.701 88.4337 131.948 89.203L96.7358 125.203C95.2152 126.758 95.2152 129.242 96.7358 130.797L131.948 166.797C132.701 167.566 133.732 168 134.808 168H162.95C166.498 168 168.29 163.723 165.8 161.194L135.887 130.806C134.355 129.249 134.355 126.751 135.887 125.194L165.8 94.8061C168.29 92.2773 166.498 88 162.95 88Z" fill="#DBF0E0"></path><path opacity="0.2" d="M197.95 88H178.808C177.732 88 176.701 88.4337 175.948 89.203L140.736 125.203C139.215 126.758 139.215 129.242 140.736 130.797L175.948 166.797C176.701 167.566 177.732 168 178.808 168H197.95C201.498 168 203.29 163.723 200.8 161.194L170.887 130.806C169.355 129.249 169.355 126.751 170.887 125.194L200.8 94.8061C203.29 92.2773 201.498 88 197.95 88Z" fill="#DBF0E0"></path><defs><linearGradient id="kd-gradient-{chart.id}" x1="425" y1="8.00003" x2="16" y2="248" gradientUnits="userSpaceOnUse"><stop stop-color="#A3D58A"></stop><stop offset="1" stop-color="#28A889"></stop></linearGradient></defs></svg>
            </a>
        </div>
    </div>

    {#if !showNotices}
    <h3 class="text-2xl max-w-2xl tracking-tight">{chart.content.heading}</h3>
    
    <div class="my-4">
      <svelte:component this={Chart} v={createVariables(chart.content.variables)} /> 
    </div>

    <div class="max-w-4xl">
    <p class="text-gray-700 mb-2 text-sm max-w-xl text">{@html chart.content.source}</p>

    <p class="text-lg text">{@html chart.content.text}</p>
    </div>
    {:else}

    <div class="text-lg relative overflow-hidden" style="max-height: 32rem">
      <div class="overflow-scroll data-notices" style="max-height:32rem;">
      {@html chart.content.methods}
      </div>
      <div class="absolute left-0 right-0 bottom-0 h-16 bg-gradient-to-t from-white pointer-events-none"></div>
    </div>

    {/if}

    {#if chart.content.methods}
    <div id="tab-switcher" class="absolute rounded-b bottom-0 left-0 right-0 grid grid-cols-2 bg-gray-100  text-sm md:text-base">
      <button on:mousedown={() => showNotices = !showNotices} class="{!showNotices ? "bg-white" : "border-t "} py-2">
          Grafik
      </button>
      <button on:mousedown={() => showNotices = !showNotices} class="{showNotices ? "bg-white " : "border-t"} py-2">
          Datenhinweise und -methoden
      </button>
    </div>
    {/if}
</div>
{/if}
{:catch error}
{error}
{/await}

<style>
  :global(.data-notices h3, .data-notices h4) {
    @apply mt-4;
  }

  :global(.data-notices h3) {
    @apply text-2xl;
  }
</style>