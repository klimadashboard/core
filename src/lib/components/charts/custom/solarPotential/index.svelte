<script context="module" lang="ts">
	// Directive to handle clicks outside of an element
	function clickOutside(node: HTMLElement, handler: (event: MouseEvent) => void) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				handler(event);
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<script>
	import { onMount } from 'svelte';

	import {
		AsyncGetSolarPotentialDe,
		type GetSolarPotentialDeQuery
	} from './__generated__/getData.generated';

	onMount(async () => {
		const { data, loading, error } = await AsyncGetSolarPotentialDe({});
		console.log('🚀 ~ error:', error);
		console.log('🚀 ~ loading:', loading);
		console.log('🚀 ~ data:', data);
	});
</script>
