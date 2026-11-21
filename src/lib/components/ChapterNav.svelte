<!--
	Floating chapter menu at the bottom of a CMS page, same look as on the region pages
	(routes/(main)/[[lang=lang]]/regions/[id]/Navigation.svelte).

	Opt-in from Directus: a rich-text block with a level-2 heading that has an id, e.g.
	  <h2 id="emissionen" title="Emissionen">Wo stehen wir aus Sicht der Emissionen?</h2>
	- id    = jump target and chapter key (also picks the icon below)
	- title = short label in the menu (optional, otherwise the heading text)
	The menu only appears when a page has at least two such headings, so all other pages stay unchanged.
-->
<script>
	import { afterNavigate } from '$app/navigation';
	import { onDestroy } from 'svelte';

	/** element that contains the page blocks */
	export let root = null;

	// line icons (Tabler style) for known chapter ids; other ids get no icon
	const ICONS = {
		emissionen:
			'<path d="M6.657 18c-2.572 0-4.657-2.007-4.657-4.483s2.085-4.482 4.657-4.482c.393-1.762 1.794-3.2 3.675-3.773 1.88-.572 3.956-.193 5.444 1 1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486s-1.551 3.487-3.465 3.487h-11.878"/>',
		autos:
			'<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6-6h15m-6 0v-5"/>',
		oeffis:
			'<path d="M9 2l3 3l3-3"/><rect x="5" y="5" width="14" height="13" rx="3"/><path d="M5 11h14"/><path d="M9 14.5h.01"/><path d="M15 14.5h.01"/><path d="M8 18l-2 4"/><path d="M16 18l2 4"/>',
		energie:
			'<path d="M5 21c.5-4.5 2.5-8 7-10"/><path d="M9 18c6.218 0 10.5-3.288 11-12v-2h-4.014c-9 0-11.986 4-12 9 0 1 0 3 2 5h3z"/>'
	};

	let chapters = [];
	let headings = [];
	let active = '';
	let list;

	function scan() {
		headings = root ? [...root.querySelectorAll('.text h2[id]')] : [];
		chapters = headings.map((h) => ({
			id: h.id,
			label: h.getAttribute('title') || h.textContent.trim()
		}));
		update();
	}

	// active = last chapter whose heading has passed 40 % of the viewport height
	function update() {
		if (headings.length < 2) return;
		const line = innerHeight * 0.4;
		let current = headings[0];
		for (const h of headings) if (h.getBoundingClientRect().top <= line) current = h;
		if (current.id === active) return;
		active = current.id;
		// narrow screens: keep the active chapter visible in the horizontally scrolling menu
		const link = list?.querySelector(`a[href="#${CSS.escape(active)}"]`);
		if (link) list.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
	}

	$: if (root) scan();

	afterNavigate(() => {
		active = '';
		scan();
	});

	if (typeof window !== 'undefined') {
		addEventListener('scroll', update, { passive: true });
		onDestroy(() => removeEventListener('scroll', update));
	}
</script>

{#if chapters.length >= 2}
	<nav
		aria-label="Kapitel"
		class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center text-sm font-medium md:text-base"
	>
		<ul
			bind:this={list}
			class="no-scrollbar relative flex max-w-[calc(100vw-2rem)] items-center overflow-scroll rounded-full border border-current/10 bg-white/80 px-2 py-1 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur dark:bg-black/60"
		>
			{#each chapters as c (c.id)}
				<li>
					<a
						href="#{c.id}"
						aria-current={active === c.id ? 'true' : undefined}
						class="flex items-center gap-1 rounded-full px-3 py-1 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black {active ===
						c.id
							? 'bg-black text-white dark:bg-white dark:text-black'
							: ''}"
					>
						{#if ICONS[c.id]}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-4 w-4 shrink-0"
								aria-hidden="true">{@html ICONS[c.id]}</svg
							>
						{/if}
						<span class="whitespace-nowrap">{c.label}</span></a
					>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
