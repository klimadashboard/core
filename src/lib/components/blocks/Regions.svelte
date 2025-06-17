<script>
	import Search from '../Search.svelte';
</script>

<div class="rounded-2xl p-3 border border-current/20 h-full relative flex flex-col">
	<img
		src="https://base.klimadashboard.org/assets/2e24e8b8-536a-4c3b-98c7-857e61694ce5"
		alt=""
		class="absolute inset-0 w-full h-full object-cover opacity-80"
	/>
	<div class="relative">
		<h2 class="font-bold border-b">Regionale Klimadashboards</h2>

		<p class="mt-2 mb-4 text-lg leading-snug text-balance pr-16">
			Wie läuft die Klimawende in deiner Stadt oder Gemeinde?
		</p>

		<a href="/regions" class="button w-max mt-auto !text-green-800">
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
				class="inline"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"
				/><path d="M9 4v13" /><path d="M15 7v13" /></svg
			>
			<span>Zu den Regionen</span></a
		>

		<div
			class="absolute top-3 right-2 w-16 h-16 !bg-white rounded-full grid place-items-center rotate-5"
		>
			<span class="text-green-800 font-bold m-auto uppercase text-center leading-none"
				>Jetzt<br />neu!</span
			>
		</div>
	</div>
</div>
