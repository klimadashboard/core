<script>
    import { locale } from "$lib/stores/i18n";
    import Blocks from "$lib/components/blocks/index.svelte";
    import { page } from '$app/stores';
    export let item;

    const shareData = {
      title: item.heading,
      text: item.intro,
      url: $page.url
    }
  </script>
  
  <svelte:head>
  <title>{item.title} – Klimadashboard</title>
  <meta name="description" content="{item.meta_description}">
  </svelte:head>

  <main class="mb-24">

    <section id="page-header" class="bg-gradient-green shadow-inner text-white pt-24 pb-10 mb-10">
        <div class="container">
        <div class="max-w-2xl mx-auto break-words">
        <div class="flex gap-2 items-center">
        <span class="uppercase font-semibold tracking-wider">{item.eyebrow}</span>
        <button id="share" on:mousedown={() => navigator.share(shareData)} aria-label="Seite teilen">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-share" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="18" cy="18" r="3"></circle>
                <line x1="8.7" y1="10.7" x2="15.3" y2="7.3"></line>
                <line x1="8.7" y1="13.3" x2="15.3" y2="16.7"></line>
             </svg>
        </button>
        </div>
        <h1 class="text-5xl tracking-tight my-2">{item.heading}</h1>
        <p class="text-xl mt-4">{item.intro}</p>
        </div>
        </div>
    </section>

    {#if item.pagelayout}
    {#each JSON.parse(item.pagelayout) as layout}
        <section id="{layout.id}" class="">
        {#each layout.columns as column}
            <Blocks content={column.blocks} />
        {/each}
        </section>
    {/each}
    {:else}
    Content not found.
    {/if}
  </main>