<script>
    import "../app.css";
    import Header from "../lib/components/header.svelte";
    import Footer from "../lib/components/footer.svelte";
</script>

<Header />

<main class="min-h-screen pt-16">
<slot />
</main>

<Footer />