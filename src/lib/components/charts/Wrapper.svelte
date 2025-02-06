<script>
	import domtoimage from 'dom-to-image';

	let item = null;

	export let chart;

	const copyToClipboard = function (copyText) {
		var dummy = document.createElement('textarea');
		document.body.appendChild(dummy);
		dummy.value = copyText;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);
	};

	$: copyEmbedCode = function () {
		var copyText =
			'<iframe src="' + window.location.origin + '/embed/' + chartId + '" width=1200 height=400>';
		copyToClipboard(copyText);
		alert('Der iFrame-Code wurde in die Zwischenablage kopiert.');
	};

	const exportImage = async () => {
		domtoimage
			.toBlob(item, {
				filter: (e) => {
					return Object.keys(e.dataset || {}).includes('shareIgnore') ? false : true;
				},
				width: item.clientWidth * 4,
				height: item.clientHeight * 4,
				style: {
					transform: 'scale(4)',
					transformOrigin: 'top left'
				}
			})
			.then(async function (blob) {
				const filesArray = [
					new File([blob], 'share.png', {
						type: blob.type,
						lastModified: new Date().getTime()
					})
				];
				const shareData = {
					files: filesArray
				};

				try {
					await navigator.share(shareData);
				} catch (err) {
					// console.log(`Cannot share data: ${err}, downloading instead.`);

					// BACKUP: download image
					await getChart().then((chart) => {
						// console.log('downloading', chart.title);
						let url = window.URL.createObjectURL(blob);
						let a = document.createElement('a');
						a.href = url;
						a.download = `${chart.title}.png`;
						a.click();
					});
				}
			});
	};

	$: showNotices = false;

	// when scroll reaches bottom, fade out the gradient
	$: showBottomFade = true;

	function observeBottomInView(element) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => (showBottomFade = !entry.isIntersecting));
		});
		observer.observe(element);
	}
</script>

<div
	class="p-3 border border-gray-200 rounded-2xl relative {chart.methods ? 'pb-16' : ''}"
	id={chart.identifier_string}
	bind:this={item}
>
	<div class="flex justify-between items-center mb-1 transition">
		<h2 class="uppercase tracking-wide font-semibold text-sm break-words w-2/3">
			{chart.content?.title}
		</h2>
		<div class="flex items-center gap-3 transition">
			<a href="/charts/{chart.id}" aria-label="Chart auf eigener Seite öffnen">
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
					class="icon icon-tabler icons-tabler-outline icon-tabler-link"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 15l6 -6" /><path
						d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"
					/><path
						d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"
					/></svg
				>
			</a>
			<button
				on:mousedown={() => exportImage()}
				class="hover:text-black"
				aria-label="Als Bild exportieren"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-photo-share"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8h.01" /><path
						d="M12 21h-6a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v7"
					/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l3 3" /><path
						d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0"
					/><path d="M16 22l5 -5" /><path d="M21 21.5v-4.5h-4.5" /></svg
				>
			</button>
			<button on:mousedown={() => copyEmbedCode()} class="hover:text-black" aria-label="Einbetten">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-code"
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
					<polyline points="7 8 3 12 7 16" />
					<polyline points="17 8 21 12 17 16" />
					<line x1="14" y1="4" x2="10" y2="20" />
				</svg>
			</button>
			<a
				href="https://klimadashboard.org"
				class="ml-2"
				target="_blank"
				aria-label="Klimadashboard.org"
			>
				<svg
					width="256"
					height="256"
					viewBox="0 0 256 256"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 rounded"
					><rect width="256" height="256" fill="url(#kd-gradient-{chart.id})" /><path
						d="M119.45 88H53C50.7909 88 49 89.7909 49 92V164C49 166.209 50.7909 168 53 168H119.45C122.998 168 124.79 163.723 122.3 161.194L92.3872 130.806C90.8547 129.249 90.8547 126.751 92.3872 125.194L122.3 94.8061C124.79 92.2773 122.998 88 119.45 88Z"
						fill="#DBF0E0"
					/><path
						opacity="0.6"
						d="M162.95 88H134.808C133.732 88 132.701 88.4337 131.948 89.203L96.7358 125.203C95.2152 126.758 95.2152 129.242 96.7358 130.797L131.948 166.797C132.701 167.566 133.732 168 134.808 168H162.95C166.498 168 168.29 163.723 165.8 161.194L135.887 130.806C134.355 129.249 134.355 126.751 135.887 125.194L165.8 94.8061C168.29 92.2773 166.498 88 162.95 88Z"
						fill="#DBF0E0"
					/><path
						opacity="0.2"
						d="M197.95 88H178.808C177.732 88 176.701 88.4337 175.948 89.203L140.736 125.203C139.215 126.758 139.215 129.242 140.736 130.797L175.948 166.797C176.701 167.566 177.732 168 178.808 168H197.95C201.498 168 203.29 163.723 200.8 161.194L170.887 130.806C169.355 129.249 169.355 126.751 170.887 125.194L200.8 94.8061C203.29 92.2773 201.498 88 197.95 88Z"
						fill="#DBF0E0"
					/><defs
						><linearGradient
							id="kd-gradient-{chart.id}"
							x1="425"
							y1="8.00003"
							x2="16"
							y2="248"
							gradientUnits="userSpaceOnUse"
							><stop stop-color="#A3D58A" /><stop offset="1" stop-color="#28A889" /></linearGradient
						></defs
					></svg
				>
			</a>
		</div>
	</div>
	{#if !showNotices}
		<h3 class="text-2xl max-w-2xl tracking-tight">{chart.content?.heading}</h3>

		<div class="my-4">
			<slot />
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#if chart.content?.text}
				<p class="text-lg text col-span-2">{@html chart.content?.text}</p>
			{/if}
			{#if chart.content?.source}
				<div class="text-sm">
					<div class="flex items-center gap-0.5 font-bold -mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-table"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<rect x="4" y="4" width="16" height="16" rx="2" />
							<line x1="4" y1="10" x2="20" y2="10" />
							<line x1="10" y1="4" x2="10" y2="20" />
						</svg>
						<h3 class="">Datenquellen</h3>
					</div>
					<p class="text">
						{@html chart.content?.source}
					</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-lg relative overflow-hidden" style="max-height: 32rem">
			<div class="overflow-scroll data-notices" style="max-height:32rem;">
				{@html chart.content?.methods}
				<div class="bottom-hint" use:observeBottomInView />
			</div>
			<div
				class="absolute left-0 right-0 bottom-0 h-16 bg-gradient-to-t from-white pointer-events-none transition-opacity {!showBottomFade
					? 'opacity-0'
					: ''}"
			/>
		</div>
	{/if}
	{#if chart.content?.methods}
		<div
			id="tab-switcher"
			class="absolute rounded-b-2xl bottom-0 left-0 right-0 grid grid-cols-2 bg-gray-100 dark:bg-gray-900 text-sm md:text-base"
		>
			<button
				on:mousedown={() => (showNotices = !showNotices)}
				class="{!showNotices ? 'bg-white dark:bg-gray-800' : 'border-t '} py-2"
			>
				Grafik
			</button>
			<button
				on:mousedown={() => (showNotices = !showNotices)}
				class="{showNotices ? 'bg-white dark:bg-gray-800 ' : 'border-t'} py-2"
			>
				Datenhinweise und -methoden
			</button>
		</div>
	{/if}
</div>
