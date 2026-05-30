<!--
	Button / Link primitive — WCAG 2.1 AA compliant, dark-mode ready.
	Renders as <a> when `href` is provided, otherwise <button>.

	The `default` variant matches the global .button style used in header/footer:
	gray pill, font-bold, px-3 py-1.5.

	Variants:  default | primary | secondary | accent | ghost
	Sizes:     sm | md | lg | xl

	Usage:
		<Button href="/donate">Spenden</Button>
		<Button variant="primary" size="lg" href="#projekte">Unsere Projekte</Button>
		<Button variant="secondary" size="sm" on:click={handler}>Abbrechen</Button>
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let variant: 'default' | 'primary' | 'secondary' | 'accent' | 'ghost' = 'default';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let href: string | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;
	export let target: string | undefined = undefined;
	export let rel: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	const variantClasses: Record<string, string> = {
		default:
			'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
		primary:
			'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200',
		secondary:
			'border border-current/30 hover:border-current/60 hover:bg-current/5',
		accent: 'bg-amber-400 text-black hover:bg-amber-300',
		ghost: 'hover:bg-current/10'
	};

	// md matches the global .button class (px-3 py-1.5, used in header/footer).
	// lg/xl keep the same vertical rhythm — only horizontal padding grows.
	const sizeClasses: Record<string, string> = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-3 py-1.5',
		lg: 'px-5 py-1.5',
		xl: 'px-7 py-2'
	};

	$: classes = [
		'inline-flex items-center gap-1 font-bold rounded-full transition',
		'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
		variantClasses[variant],
		sizeClasses[size],
		disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
		$$props.class ?? ''
	]
		.filter(Boolean)
		.join(' ');

	// Exclude `class` from the spread so it doesn't overwrite our computed `classes`.
	$: restProps = Object.fromEntries(Object.entries($$restProps).filter(([k]) => k !== 'class'));
</script>

{#if href}
	<a {href} {target} {rel} class={classes} on:click on:mousedown on:mouseenter on:mouseleave on:focus on:blur {...restProps}>
		<slot />
	</a>
{:else}
	<button {type} {disabled} class={classes} on:click on:mousedown on:mouseenter on:mouseleave on:focus on:blur {...restProps}>
		<slot />
	</button>
{/if}
