<script context="module">
    /** @type {import('@sveltejs/kit').Load} */
    export const load = async ({ url }) => ({ props: { url } });
</script>

<script>
    import "../app.css";
    import Header from "../lib/components/header.svelte";
    import Footer from "../lib/components/footer.svelte";
    import Transition from '$lib/components/PageTransition.svelte';
    import Glossary from "$lib/components/Glossary.svelte";

    export let url;
</script>

<Header />

<Glossary />

<main class="min-h-screen pt-16">
    <Transition {url}>
    <slot />
    </Transition>
</main>

<Footer />