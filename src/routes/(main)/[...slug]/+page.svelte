<script>
	import { onMount } from 'svelte';
	import Blocks from '$lib/components/blocks/index.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';

	export let data;
</script>

<div class="">
	<Blocks data={data.content.blocks} />
</div>
