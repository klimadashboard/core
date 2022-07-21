<script>
  import { locale } from "$lib/stores/i18n";
  import Blocks from "$lib/components/blocks/index.svelte";
  
  async function getGlossary() {
      const res = await fetch("https://cms.klimadashboard.org/" + $locale + "/glossary.json");
      const json = await res.json();

  if (json) {
    return json;
  } else {
    throw new Error(JSON.stringify(json));
  }
};

$: promise = getGlossary();

$: if($locale) {
  // reload when language changes
  promise = getGlossary();
}
</script>

<section class="container relative py-16">
  <p class="uppercase tracking-wide font-semibold mb-2 text-green-600">Glossary-Index &#8212;</p>
</section>

<div class="container">
{#await promise}
Loading...
{:then glossaryData}
<div class="space-y-8 mb-24">
  {#each Object.values(glossaryData.glossary) as item}
      <div class="bg-gray-100 p-8 max-w-2xl">
          <h2 class="text-3xl">{item.content.title}</h2>
          <Blocks content={JSON.parse(item.content.text)} />
      </div>
  {/each}
</div>
{/await}
</div>