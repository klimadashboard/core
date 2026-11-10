<!--
	Accepted payment methods, shown desaturated so the badges read as a quiet trust
	signal rather than competing with the page's own colours.

	Logos live in static/payment/ (self-hosted — never hotlinked, per our DSGVO
	stance on third-party endpoints). They come from github.com/datatrans/payment-logos
	(CC BY-SA 4.0) and are used unmodified: the greyscale is a CSS filter applied at
	render time, so the files themselves stay pristine.

	Every asset shares a 120×80 viewBox, so a fixed height lines them all up without
	per-logo tweaking. Each badge carries its own light background plate, which is why
	they stay legible on the white donation card and the amber banner alike.
-->
<script lang="ts">
	/** Rendered height in px; width follows the shared 3:2 aspect ratio. */
	export let size: number = 26;

	const methods = [
		{ src: '/payment/apple-pay.svg', label: 'Apple Pay' },
		{ src: '/payment/google-pay.svg', label: 'Google Pay' },
		{ src: '/payment/visa.svg', label: 'Visa' },
		{ src: '/payment/mastercard.svg', label: 'Mastercard' },
		{ src: '/payment/eps.svg', label: 'EPS' },
		{ src: '/payment/klarna.svg', label: 'Klarna' }
	];
</script>

<ul class="flex flex-wrap items-center gap-1.5" aria-label="Akzeptierte Zahlungsarten">
	{#each methods as method}
		<li>
			<img
				src={method.src}
				alt={method.label}
				loading="lazy"
				class="w-auto opacity-80"
				style="height: {size}px"
			/>
		</li>
	{/each}
</ul>
