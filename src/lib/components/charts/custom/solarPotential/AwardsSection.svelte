<script lang="ts">
	import type { Award } from './config';
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';

	export let awards: Award[];
	export let gemeineName: string = '';

	$: unlocked = awards.filter((a) => a.unlocked).length;

	const GRADIENTS: Record<Award['color'], string> = {
		gold: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
		green: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
		blue: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
		purple: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)'
	};
	const SHADOWS: Record<Award['color'], string> = {
		gold: '0 4px 16px rgba(251,191,36,0.25)',
		green: '0 4px 16px rgba(52,211,153,0.25)',
		blue: '0 4px 16px rgba(96,165,250,0.25)',
		purple: '0 4px 16px rgba(167,139,250,0.25)'
	};
	const SHARE_COLORS: Record<Award['color'], string> = {
		gold: 'bg-amber-500 hover:bg-amber-600',
		green: 'bg-green-600 hover:bg-green-700',
		blue: 'bg-blue-600 hover:bg-blue-700',
		purple: 'bg-purple-600 hover:bg-purple-700'
	};

	let copiedAward: string | null = null;

	async function share(award: Award) {
		const title = `${award.icon} ${award.name}`;
		const text = `${gemeineName ? gemeineName + ' hat den Award erreicht: ' : ''}${award.desc}`;
		const url = typeof window !== 'undefined' ? window.location.href : '';

		if (typeof navigator !== 'undefined' && navigator.share) {
			await navigator.share({ title, text, url });
		} else {
			await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
			copiedAward = award.name;
			setTimeout(() => (copiedAward = null), 2000);
		}
	}
</script>

<div class="mb-4 flex items-center justify-between">
	<h2 class="text-base font-bold text-gray-900 dark:text-gray-100">🏆 Awards</h2>
	<span class="text-sm text-gray-500">{unlocked} von {awards.length} freigeschaltet</span>
</div>

<Splide
	options={{
		autoWidth: true,
		gap: '0.75rem',
		pagination: false,
		arrows: false,
		trimSpace: true
	}}
	aria-label="Awards"
>
	{#each awards as award (award.name)}
		<SplideSlide>
			<article
				aria-label="{award.name}{award.unlocked ? ', freigeschaltet' : ', gesperrt'}"
				class="flex w-44 flex-col rounded-2xl border border-gray-200 bg-white p-4 text-center
						dark:border-gray-700 dark:bg-gray-800
						{award.unlocked ? '' : 'opacity-50 grayscale-[0.5]'}"
			>
				<div
					class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
					style="background: {award.unlocked ? GRADIENTS[award.color] : '#EDEBE6'};
							   box-shadow: {award.unlocked ? SHADOWS[award.color] : 'none'};"
				>
					{award.unlocked ? award.icon : '🔒'}
				</div>

				<p
					class="mb-1 text-sm font-bold {award.unlocked
						? 'text-gray-900 dark:text-gray-100'
						: 'text-gray-400'}"
				>
					{award.name}
				</p>

				<p class="mb-3 flex-1 text-xs leading-snug text-gray-500 dark:text-gray-400">
					{award.desc}
				</p>

				<div class="flex h-8 items-center justify-center">
					{#if award.unlocked}
						<button
							on:click={() => share(award)}
							class="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors {SHARE_COLORS[
								award.color
							]}"
						>
							{copiedAward === award.name ? '✓ Kopiert' : 'Teilen'}
						</button>
					{:else if award.remaining}
						<p class="text-xs text-gray-400">{award.remaining}</p>
					{/if}
				</div>
			</article>
		</SplideSlide>
	{/each}
</Splide>
