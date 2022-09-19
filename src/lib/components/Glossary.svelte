<script>
    import { clickOutside } from "$lib/utils/clickOutside";
    import { glossaryItem } from "$lib/stores/glossary";
    import { fade } from "svelte/transition";
    import Loader from "$lib/components/Loader.svelte";
    import { locale } from "$lib/stores/i18n";
    import Blocks from "$lib/components/blocks/index.svelte";

    async function getGlossary() {
      const res = await fetch("https://cms.klimadashboard.org/" + $locale + "/glossary.json");
      const json = await res.json();

      if (json) {
        return Object.values(json.glossary);
      } else {
        throw new Error(JSON.stringify(json));
      }
    };

    $: promise = getGlossary();
</script>

{#if $glossaryItem}
<div class="popup fixed inset-0 grid bg-black bg-opacity-50 p-4 z-50"
transition:fade="{{ duration: 200 }}">
  <div class="bg-white  m-auto shadow-lg p-4 max-w-md lg:max-w-lg relative overflow-scroll" style="max-height: 70vh;"
  use:clickOutside
  on:click_outside={() => glossaryItem.set(false)}>
    <button on:mousedown={() => glossaryItem.set(false)} class="absolute top-4 right-4" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
     </svg>
    </button>
    {#await promise}
    <Loader />
    {:then glossaryData}
    {@const item = glossaryData.find(d => d.slug == $glossaryItem.toString())}
    <h3 class="text-gradient-green text-xl border-b border-b-green-600 pb-2 mb-4">{item.content.title}</h3>
    <Blocks content={JSON.parse(item.content.text)} />
    {:catch error}
    {error}
    {/await}
  </div>
</div>
{/if}