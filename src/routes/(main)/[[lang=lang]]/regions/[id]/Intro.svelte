<script>
    import Panel from "$lib/components/blocks/Panel.svelte";

    let panels = [{
        title: "Eine erste Statistik, live aus der Region",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        colorBackground: "#FEB904",
        colorText: "#0C485E",
        number: 10,
        unit: "%"
    }, {
        title: "Eine zweite Statistik, live aus der Region",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        colorBackground: "#28292B",
        colorText: "#EED974"
    },
    {
        title: "Eine dritte Statistik, live aus der Region",
        colorBackground: "#28292B",
        colorText: "#EED974"
    },
    {
        title: "Eine vierte Statistik, live aus der Region",
        colorBackground: "#FEB904",
        colorText: "#0C485E",
    }]
</script>

<div class="grid md:grid-cols-2 container my-8 gap-4">
    <div class="grid">
        <p class="font-bold my-auto text-xl">In Wien gab es XXX Hitzetage dieses Jahr, das sind 10% mehr als im Durchschnitt. Als Stadt hat Wien vielfältige Herausforderungen in der Anpassung an die Klimakrise zu bewältigen. Die Emissionen in der Region Wien sind im letzten Jahr um 10% gesunken.</p>
    </div>
    <div class="grid grid-cols-2 gap-1">
        {#each panels as panel}
        <div class="rounded-2xl overflow-hidden">
        <Panel block={panel} />
        </div>
        {/each}
    </div>
</div>