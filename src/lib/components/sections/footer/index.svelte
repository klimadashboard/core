<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import DonationBanner from './DonationBanner.svelte';
</script>

<footer class="">
	<div class="container grid md:grid-cols-3 gap-4 py-8">
		{#if page.data.site?.content?.faq}
			<div class="md:col-span-3 border-y border-current/10 py-4">
				<h2 class="font-bold mb-1">{page.data.translations.questionsAndAnswers}</h2>
				<ul>
					{#each page.data.site.content.faq as item}
						<li class="mb-2">
							<details class="max-w-2xl">
								<summary class="hover:underline underline-offset-2">{item.question}</summary>
								{@html item.answer}
							</details>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<div class="">
			<h2 class="font-bold">{page.data.translations.footer1Title}</h2>
			<p>{page.data.translations.footer1Text}</p>
			<div class="flex items-center gap-2 flex-wrap mt-2">
				<form
					action="https://buttondown.email/api/emails/embed-subscribe/klimadashboard"
					method="post"
					target="popupwindow"
					class="flex group"
				>
					<label class="">
						<span class="hidden">E-Mail</span>
						<input
							type="email"
							name="email"
							id="bd-email"
							class="input !rounded-r-none !border-gray-100 dark:!border-gray-800 w-36 text-black dark:text-white"
							placeholder="your@email.com"
						/>
					</label>
					<input
						type="submit"
						value={page.data.translations.signUp}
						class="button !rounded-l-none !text-sm"
					/>
				</form>
				<a
					class="button"
					href="https://instagram.com/klimadashboard{PUBLIC_VERSION == 'de' ? '.de' : ''}"
					aria-label="Instagram"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-brand-instagram"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<rect x="4" y="4" width="16" height="16" rx="4" />
						<circle cx="12" cy="12" r="3" />
						<line x1="16.5" y1="7.5" x2="16.5" y2="7.501" />
					</svg>
				</a>
				<a
					class="button"
					rel="me"
					href="https://bsky.app/profile/klimadashboard.bsky.social"
					aria-label="Bluesky"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-brand-bluesky"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M6.335 5.144c-1.654 -1.199 -4.335 -2.127 -4.335 .826c0 .59 .35 4.953 .556 5.661c.713 2.463 3.13 2.75 5.444 2.369c-4.045 .665 -4.889 3.208 -2.667 5.41c1.03 1.018 1.913 1.59 2.667 1.59c2 0 3.134 -2.769 3.5 -3.5c.333 -.667 .5 -1.167 .5 -1.5c0 .333 .167 .833 .5 1.5c.366 .731 1.5 3.5 3.5 3.5c.754 0 1.637 -.571 2.667 -1.59c2.222 -2.203 1.378 -4.746 -2.667 -5.41c2.314 .38 4.73 .094 5.444 -2.369c.206 -.708 .556 -5.072 .556 -5.661c0 -2.953 -2.68 -2.025 -4.335 -.826c-2.293 1.662 -4.76 5.048 -5.665 6.856c-.905 -1.808 -3.372 -5.194 -5.665 -6.856z"
						/></svg
					>
				</a>
				<a
					class="button"
					rel="me"
					href="https://linkedin.com/company/klimadashboard"
					aria-label="LinkedIn"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-brand-linkedin"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 11v5" /><path
							d="M8 8v.01"
						/><path d="M12 16v-5" /><path d="M16 16v-3a2 2 0 1 0 -4 0" /><path
							d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z"
						/></svg
					></a
				>
			</div>
		</div>
		<div class="border-t pt-4 md:pt-0 md:pl-4 md:border-l md:border-t-0 border-current/10">
			<h2 class="font-bold">{page.data.translations.footer2Title}</h2>
			<p>{page.data.translations.footer2Text}</p>
			<div class="mt-2 flex">
				<a class="button block" href="https://klimadashboard.org/donate">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-credit-card"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<rect x="3" y="5" width="18" height="14" rx="3" />
						<line x1="3" y1="10" x2="21" y2="10" />
						<line x1="7" y1="15" x2="7.01" y2="15" />
						<line x1="11" y1="15" x2="13" y2="15" />
					</svg>
					<span>{page.data.translations.donate}</span>
				</a>
			</div>
		</div>
		<div class="border-t pt-4 md:pt-0 md:pl-4 md:border-l md:border-t-0 border-current/10">
			<h2 class="font-bold">{page.data.translations.footer3Title}</h2>
			<p>{page.data.translations.footer3Text}</p>
			<div class="flex items-center space-x-2 flex-wrap mt-2">
				<a class="button" href="mailto:team@klimadashboard.org">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-mail"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<rect x="3" y="5" width="18" height="14" rx="2" />
						<polyline points="3 7 12 13 21 7" />
					</svg>
					<span>{page.data.translations.writeEmail}</span>
				</a>
				<a class="button" href="https://github.com/klimadashboard" aria-label="GitHub">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-brand-github"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path
							d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"
						/>
					</svg>
				</a>
			</div>
		</div>
		{#if page.data.site?.content?.navigation_secondary}
			<div class="md:col-span-3 pt-4 border-t border-current/10 flex gap-x-4 flex-wrap">
				{#each page.data.site.content.navigation_secondary as item}
					<a
						href={item.link}
						class="opacity-80 hover:opacity-100 transition hover:underline underline-offset-2"
						target="_blank">{item.label}</a
					>
				{/each}
				<a
					href="https://creativecommons.org/licenses/by/4.0/"
					target="_blank"
					class="w-full sm:w-max mt-4 sm:mt-0 sm:ml-auto opacity-80 hover:opacity-100 transition"
				>
					<img
						src="https://base.klimadashboard.org/assets/aed31198-01cd-4e62-8e31-8d0a1def7b55"
						class="h-6"
						alt="Creative Commons BY Lizenz"
					/>
				</a>
			</div>
		{/if}
	</div>
</footer>
