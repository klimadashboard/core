<script>
	export let selectedUnit;

	$: explainers =
		selectedUnit == 'wattHours'
			? [
					{
						label: '50 Stunden Laptop',
						unit: '1 Kilowattstunde (KWh)',
						icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 icon icon-tabler icon-tabler-device-laptop' width='24' height='24' viewBox='0 0 24 24' stroke-width='1' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><line x1='3' y1='19' x2='21' y2='19'></line><rect x='5' y='6' width='14' height='10' rx='1'></rect></svg>",
						source:
							'https://www.enbw.com/blog/wohnen/energie-sparen/was-man-mit-1-kwh-so-alles-machen-kann-2/'
					},
					{
						label: '10 Tage Energiebedarf einer durchschnittlichen Person in Österreich',
						unit: '1 Megawattstunde (MWh)',
						icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 icon icon-tabler icon-tabler-user' width='24' height='24' viewBox='0 0 24 24' stroke-width='1' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><circle cx='12' cy='7' r='4'></circle><path d='M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2'></path></svg>"
					},
					{
						label: 'Energiebedarf der Wiener Linien für 12 Stunden',
						unit: '1 Gigawattstunde (GWh)',
						icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 icon icon-tabler icon-tabler-train' width='24' height='24' viewBox='0 0 24 24' stroke-width='1' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M21 13c0 -3.87 -3.37 -7 -10 -7h-8'></path><path d='M3 15h16a2 2 0 0 0 2 -2'></path><path d='M3 6v5h17.5'></path><line x1='3' y1='10' x2='3' y2='14'></line><line x1='8' y1='11' x2='8' y2='6'></line><line x1='13' y1='11' x2='13' y2='6.5'></line><line x1='3' y1='19' x2='21' y2='19'></line></svg>",
						source: ''
					},
					{
						label: 'Energiebedarf von Österreich an einem Tag',
						unit: '1 Terawattstunde (TWh)',
						icon: "<svg width='24' height='24' viewBox='0 0 24 24' class='h-10 w-10' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4.24407 12.5423C4.09121 12.4873 3.51917 12.4873 3.23 12.5423L1.50095 13.083L1.2122 14.4941C1.16125 14.7324 1.26316 14.9798 1.46698 15.0989L2.9447 15.9786L4.15505 15.6215L5.22922 16.0152C5.31415 16.0335 5.39907 16.0335 5.484 16.0061L7.5521 15.3738C7.77291 15.3005 8.54984 15.163 8.67723 15.3738L9.25473 16.3268C9.33116 16.4459 9.44156 16.5375 9.57745 16.565L15.5308 17.9853C15.7091 18.0311 15.8875 17.967 16.0149 17.8296L16.5499 17.2156C16.6348 17.124 16.7452 17.069 16.8641 17.0507L19.5223 16.6933C19.6242 16.6841 19.7092 16.6383 19.7856 16.5742L21.0085 15.5112C21.1274 15.4104 21.1954 15.2638 21.2039 15.0989L21.2463 13.8069C21.2463 13.6694 21.3058 13.532 21.3992 13.4312L23.1147 11.6352C23.2336 11.5069 23.293 11.3144 23.2591 11.1312L22.6646 7.83239C22.6306 7.62163 22.4862 7.45669 22.2994 7.40171L17.7643 6.01805C17.569 5.96307 17.3567 6.03638 17.2293 6.20132L16.3121 7.39255C16.1932 7.53916 16.0149 7.61247 15.8365 7.58498L13.9681 7.29175C13.8238 7.27342 13.6794 7.31008 13.569 7.41087L10.8259 9.82999C10.6815 9.95827 10.6135 10.1599 10.6475 10.3615L11.0637 12.7989L9.68785 11.9467C9.56046 11.8734 9.41609 11.8551 9.2802 11.9009L5.8322 13.0188C5.73028 13.0463 5.61988 13.0463 5.51797 13.0097L4.24407 12.5423Z' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round'/></svg>",
						source: ''
					}
			  ]
			: [
					{
						label: 'XX Lala',
						unit: '1 Terajoule (TJ)',
						icon: ''
					}
			  ];
</script>

{#if selectedUnit == 'wattHours'}
	<div
		class="flex xl:justify-center transition text-gray-500 dark:text-gray-400 text-sm mx-auto overflow-x-scroll pt-8"
	>
		{#each explainers as explainer, index}
			<div
				class="relative flex-1 p-2 pt-10 flex flex-col justify-between bg-gray-50 dark:bg-gray-900 text-center border dark:border-gray-700"
				style="min-width: 24ch;"
			>
				<div
					class="w-16 h-16 rounded-full bg-white dark:bg-gray-800 absolute -top-8 left-1/2 -translate-x-1/2 p-3 shadow"
				>
					{@html explainer.icon}
				</div>
				<p>{explainer.label}</p>
				<p class="font-bold">{explainer.unit}</p>
			</div>
			{#if index !== explainers.length - 1 && selectedUnit == 'wattHours'}
				<span class="text-xs text-center px-2 leading-none flex flex-col items-center my-auto">
					&#215;1000
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-arrow-right-bar"
						width="32"
						height="10"
						viewBox="0 0 32 10"
						stroke-width="1"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M28 8l3 -3l-3 -3" />
						<path d="M3 5h27" />
					</svg>
				</span>
			{/if}
		{/each}
	</div>
{/if}
