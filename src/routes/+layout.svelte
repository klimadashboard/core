<script context="module">
    /** @type {import('@sveltejs/kit').Load} */
    export const load = async ({ url }) => ({ props: { url } });
</script>

<script>
    import "../app.css";
    import Header from "../lib/components/header.svelte";
    import Footer from "../lib/components/footer.svelte";
    import Glossary from "$lib/components/Glossary.svelte";

    import { onMount } from 'svelte'
    import { browser } from '$app/environment'
    import { page } from '$app/stores'
    import * as Fathom from 'fathom-client'

    onMount(() => {
      Fathom.load('RDBKIXJL', {
        url: 'https://bloc-party-absolutely.klimadashboard.at/script.js',
        includedDomains: ['klimadashboard.at', 'www.klimadashboard.at']
      })
    });

    // track a page view when the pathname changes
    $: $page.url.pathname, browser && Fathom.trackPageview()

    export let url;
</script>

<Header />

<Glossary />

<main class="min-h-screen pt-16">
    <slot />
</main>

<Footer />