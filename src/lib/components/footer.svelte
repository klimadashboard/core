<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import FAQs from '$lib/components/FAQs.svelte';
</script>

<FAQs />
<footer class="text-white bg-gray-800">
	<div class="container grid md:grid-cols-3 gap-4 py-8">
		<div class="">
			<h2 class="font-bold">Bleib informiert</h2>
			<p>In unserem Newsletter und auf Social Media gibt es Updates zu neuen Visualisierungen.</p>
			<div class="flex items-center space-x-2 flex-wrap">
				<form
					action="https://buttondown.email/api/emails/embed-subscribe/klimadashboard"
					method="post"
					target="popupwindow"
					class="flex mt-2 group"
				>
					<label class="">
						<span class="hidden">E-Mail</span>
						<input
							type="email"
							name="email"
							id="bd-email"
							class="appearance-none border-gray-700 group-hover:border-gray-900 border-2 bg-gray-800 text-white transition py-0.5 px-2 rounded-l w-32"
							placeholder="your@email.com"
						/>
					</label>
					<input
						type="submit"
						value="Anmelden"
						class="appearance-none rounded-r bg-gray-700 group-hover:bg-gray-900 text-white py-0 px-2 cursor-pointer transition"
					/>
				</form>
				<a
					class="inline-flex items-center space-x-2 mt-2 bg-gray-700 hover:bg-gray-900 transition py-1 px-2 rounded"
					href="https://instagram.com/klimadashboard{PUBLIC_VERSION == 'de' ? '_de' : ''}"
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
					class="inline-flex items-center space-x-2 mt-2 bg-gray-700 hover:bg-gray-900 transition py-1 px-2 rounded"
					href="https://twitter.com/klimadashboard"
					aria-label="Twitter"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-brand-twitter"
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
							d="M22 4.01c-1 .49 -1.98 .689 -3 .99c-1.121 -1.265 -2.783 -1.335 -4.38 -.737s-2.643 2.06 -2.62 3.737v1c-3.245 .083 -6.135 -1.395 -8 -4c0 0 -4.182 7.433 4 11c-1.872 1.247 -3.739 2.088 -6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58 -1.04 6.522 -3.723 7.651 -7.742a13.84 13.84 0 0 0 .497 -3.753c-.002 -.249 1.51 -2.772 1.818 -4.013z"
						/>
					</svg>
				</a>
				<a
					class="inline-flex items-center space-x-2 mt-2 bg-gray-700 hover:bg-gray-900 transition py-1 px-2 rounded"
					rel="me"
					href="https://mastodon.social/@klimadashboard"
					aria-label="Mastodon"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-brand-mastodon"
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
							d="M18.648 15.254c-1.816 1.763 -6.648 1.626 -6.648 1.626a18.262 18.262 0 0 1 -3.288 -.256c1.127 1.985 4.12 2.81 8.982 2.475c-1.945 2.013 -13.598 5.257 -13.668 -7.636l-.026 -1.154c0 -3.036 .023 -4.115 1.352 -5.633c1.671 -1.91 6.648 -1.666 6.648 -1.666s4.977 -.243 6.648 1.667c1.329 1.518 1.352 2.597 1.352 5.633s-.456 4.074 -1.352 4.944z"
						/>
						<path
							d="M12 11.204v-2.926c0 -1.258 -.895 -2.278 -2 -2.278s-2 1.02 -2 2.278v4.722m4 -4.722c0 -1.258 .895 -2.278 2 -2.278s2 1.02 2 2.278v4.722"
						/>
					</svg>
				</a>
			</div>
			<p class="opacity-50 text-sm leading-tight mt-2">
				Du erhältst nicht mehr als 12 Newsletter pro Jahr.<br />Wir verwenden Buttondown als
				Newsletter-Tool. <br />Mehr in unserer
				<a href="https://klimadashboard.org/impressum" class="underline">Datenschutzvereinbarung</a
				>.
			</p>
		</div>
		<div class="border-t pt-4 md:pt-0 md:pl-4 md:border-l md:border-t-0 border-gray-700">
			<h2 class="font-bold">Unterstütze unseren Verein</h2>
			<p>
				Das Klimadashboard ist unabhängig und frei zugänglich für alle. Dank deiner Spende können
				wir laufend neue Visualisierungen bauen.
			</p>
			<a
				class="inline-flex items-center space-x-2 mt-2 bg-gray-700 hover:bg-gray-900 transition py-1 px-2 rounded"
				href="https://donate.stripe.com/8wM03o9ZS0OX28U4gg"
			>
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
				<span>Spenden</span>
			</a>
		</div>
		<div class="border-t pt-4 md:pt-0 md:pl-4 md:border-l md:border-t-0 border-gray-700">
			<h2 class="font-bold">Feedback</h2>
			<p>Hast du Ideen, Wünsche, Anregungen zu dieser Seite? Wir freuen uns, von dir zu hören.</p>
			<div class="flex items-center space-x-2 flex-wrap">
				<a
					class="inline-flex items-center space-x-2 mt-2 bg-gray-700 hover:bg-gray-900 transition py-1 px-2 rounded"
					href="mailto:team@klimadashboard.org"
				>
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
					<span>E-Mail schreiben</span>
				</a>
				<a
					class="inline-flex items-center space-x-2 mt-2 bg-gray-700 hover:bg-gray-900 transition py-1 px-2 rounded"
					href="https://github.com/klimadashboard"
					aria-label="GitHub"
				>
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
	</div>
	<div class="bg-gray-900 py-4 flex">
		<div class="mx-auto flex items-center space-x-8 opacity-50 hover:opacity-80 transition">
			<svg
				width="159"
				height="80"
				viewBox="0 0 159 80"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class="h-10 w-10"
			>
				<path
					d="M70.4497 0H4C1.79086 0 0 1.79086 0 4V76C0 78.2091 1.79086 80 4 80H70.4497C73.9981 80 75.7896 75.7227 73.3003 73.1939L43.3872 42.8061C41.8547 41.2492 41.8547 38.7508 43.3872 37.1939L73.3003 6.80607C75.7896 4.27726 73.9981 0 70.4497 0Z"
					fill="#F5F5F5"
				/>
				<path
					opacity="0.6"
					d="M113.95 0H85.8078C84.7316 0 83.7008 0.433664 82.9483 1.20302L47.7358 37.203C46.2152 38.7577 46.2152 41.2423 47.7358 42.797L82.9483 78.797C83.7008 79.5663 84.7316 80 85.8078 80H113.95C117.498 80 119.29 75.7227 116.8 73.1939L86.8872 42.8061C85.3547 41.2492 85.3547 38.7508 86.8872 37.1939L116.8 6.80607C119.29 4.27726 117.498 0 113.95 0Z"
					fill="#F5F5F5"
				/>
				<path
					opacity="0.2"
					d="M148.95 0H129.808C128.732 0 127.701 0.433664 126.948 1.20302L91.7358 37.203C90.2152 38.7577 90.2152 41.2423 91.7358 42.797L126.948 78.797C127.701 79.5663 128.732 80 129.808 80H148.95C152.498 80 154.29 75.7227 151.8 73.1939L121.887 42.8061C120.355 41.2492 120.355 38.7508 121.887 37.1939L151.8 6.80607C154.29 4.27726 152.498 0 148.95 0Z"
					fill="#F5F5F5"
				/>
			</svg>
			<a href="https://klimadashboard.org" class="ml-2" target="_blank">Über uns</a>

			<a href="https://klimadashboard.org/impressum" target="_blank">Impressum</a>
			<a href="https://klimadashboard.org/datenschutz" target="_blank">Datenschutz</a>
		</div>
	</div>
</footer>
