<script>
    import Chart from "./Chart.svelte";
    import GapIndicator from "./GapIndicator.svelte";
    import Papa from "papaparse";

    $: energyTypes = [{
        "key": "Wind",
        "label": "Windenergie",
        "color": "#4C8EB3",
        "colorScale": ["#4C8EB3","#B8D2E0"],
        "icon": "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-windmill' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M12 12c2.76 0 5 -2.01 5 -4.5s-2.24 -4.5 -5 -4.5v9z'></path><path d='M12 12c0 2.76 2.01 5 4.5 5s4.5 -2.24 4.5 -5h-9z'></path><path d='M12 12c-2.76 0 -5 2.01 -5 4.5s2.24 4.5 5 4.5v-9z'></path><path d='M12 12c0 -2.76 -2.01 -5 -4.5 -5s-4.5 2.24 -4.5 5h9z'></path></svg>"
    }, {
        "key": "PV",
        "label": "Photovoltaik",
        "color": "#E0A906",
        "colorScale": ["#E0A906","#E8CD7D"],
        "icon": "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-sun' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><circle cx='12' cy='12' r='4'></circle><path d='M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7'></path></svg>"
    }, {
        "key": "Wasserkraft",
        "label": "Wasserkraft",
        "color": "#08519C",
        "colorScale": ["#08519C","#7098C2"],
        "icon": "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-ripple' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M3 7c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 17c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 12c3 -2 6 -2 9 0s6 2 9 0'></path></svg>"
    }, {
        "key": "Biomasse",
        "label": "Biomasse",
        "color": "#00441B",
        "colorScale": ["#00441B","#66997A"],
        "icon": "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-growth' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M16.5 15a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m-4 3.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m0 -7.5v6'></path></svg>"
    }];

    let expansionGoals;

    Papa.parse(
    'https://scraper.klimadashboard.at/data/energy/renewables/ausbauziele.csv',
    {
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      header: true,
      complete: function (results) {
        if (results) {
            expansionGoals = results.data;
        }
      }
    }
    );

    let electricityProduction;
    Papa.parse(
    'https://scraper.klimadashboard.at/data/energy/renewables/stromproduktion.csv',
    {
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      header: true,
      complete: function (results) {
        if (results) {
            electricityProduction = results.data;
        }
      }
    }
    );

    $: unifiedScaling = false;

    $: expansionGaps = ["PV", "Windenergie"].map((entry) => {
      return {
      "key": entry,
      "gap": "???",
      "text": "Windräder / PV-Anlagen sind bis XX notwendig",
      "icon": "<svg class='h-20 w-20' width='464' height='436' viewBox='0 0 464 436' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M315.419 192.888L195.579 155.368C191.657 154.247 187.18 154.247 182.699 156.489C182.141 157.048 181.578 157.048 181.02 157.611C179.34 154.251 176.539 150.892 173.739 148.65C173.739 148.091 174.297 148.091 174.297 147.529C176.535 143.607 177.657 139.13 177.098 135.209L155.817 11.4486C154.696 4.72978 148.536 0.249587 141.817 1.37059C135.098 1.92918 130.618 8.08939 131.176 14.8116L141.254 139.692C141.813 143.613 143.492 147.531 146.293 150.891C144.055 152.57 142.371 155.371 141.254 157.609C140.695 157.051 139.574 156.488 139.016 156.488C135.094 154.809 130.617 154.809 126.137 156.488L7.97669 199.05C1.81649 201.289 -1.54282 208.011 0.695483 214.73C1.81658 219.769 6.85568 223.133 12.4575 223.133C13.5786 223.133 14.6958 223.133 15.8169 222.574L136.777 190.094C140.699 188.973 144.058 186.735 146.296 183.375L147.417 184.496L133.976 424.736H118.296C114.937 424.736 112.695 426.975 112.695 430.338C112.695 433.697 114.933 435.94 118.296 435.94H203.976C207.336 435.94 209.578 433.701 209.578 430.338C209.578 426.978 207.34 424.736 203.976 424.736H188.296L174.855 183.936C175.414 183.378 175.414 183.378 175.977 182.815C178.777 186.175 182.137 188.417 186.618 189.534L309.258 216.979H312.058C317.66 216.979 322.699 213.057 324.378 207.46C325.496 201.299 321.578 194.576 315.418 192.897L315.419 192.888ZM172.058 166.568C172.058 172.729 167.019 177.767 160.859 177.767C154.699 177.767 149.66 172.728 149.66 166.568C149.66 160.408 154.7 155.369 160.859 155.369C167.02 155.369 172.058 160.408 172.058 166.568ZM142.941 11.4484C143.5 11.4484 144.063 12.007 144.621 12.5695L165.898 136.329C165.898 138.009 165.898 139.689 164.777 140.81C163.656 142.49 161.976 143.611 159.738 144.169C157.5 144.169 155.816 143.611 154.136 141.931C153.015 140.81 152.457 139.13 151.898 137.451L141.82 13.1306C141.82 12.5681 142.379 11.4509 142.941 11.4509L142.941 11.4484ZM137.34 176.088C136.219 177.209 135.102 178.327 133.418 178.889L12.458 211.928C11.8994 211.928 11.3369 211.928 10.7783 210.807C10.7783 210.248 10.7783 209.686 11.3369 209.127L128.937 165.447C129.495 165.447 130.617 164.889 131.175 164.889C132.296 164.889 132.855 164.889 133.976 165.447C135.656 166.006 137.335 167.686 137.898 169.928C139.015 172.17 138.456 174.408 137.335 176.088L137.34 176.088ZM145.18 424.168L158.059 190.088H163.66L176.539 424.728H145.18L145.18 424.168ZM311.5 205.768L188.86 178.889C187.18 178.331 186.059 177.768 184.938 176.089C183.817 174.409 183.258 172.167 183.817 170.487C184.375 168.249 185.496 167.128 187.739 166.006C188.86 165.448 189.418 165.448 190.539 165.448H192.219L312.059 203.53C312.618 203.53 313.18 204.651 313.18 205.21C312.622 205.768 312.059 205.768 311.501 205.768L311.5 205.768Z' fill='black'/><path d='M393.818 120.088C391.018 117.288 387.658 116.167 383.74 115.608H381.502C381.502 113.928 380.944 111.686 380.381 110.006C380.94 110.006 381.502 110.006 382.061 109.448C385.42 108.327 388.221 105.526 389.901 102.167L434.139 15.9285C436.939 10.8894 434.697 4.16651 429.658 1.36951C424.619 -1.43129 418.459 0.248409 415.099 4.72891L363.579 86.4909C361.899 89.2917 361.341 92.6511 361.341 96.5689C356.86 96.5689 352.38 98.8072 349.579 102.171C346.778 99.9322 343.977 98.8111 340.618 98.8111L244.298 97.1314C238.696 97.1314 233.657 101.612 233.099 107.209C232.54 112.811 237.021 117.85 242.618 118.971L338.938 129.612H340.618C343.419 129.612 346.22 128.491 349.016 126.812C349.575 127.933 350.696 128.491 351.255 129.612L341.177 313.292H329.978C326.618 313.292 324.376 315.531 324.376 318.894C324.376 322.253 326.614 324.496 329.978 324.496H396.056C399.415 324.496 401.657 322.257 401.657 318.894C401.657 315.535 399.419 313.292 396.056 313.292H384.857L375.337 145.292L445.337 205.772C447.576 207.452 449.818 208.573 452.619 208.573C455.419 208.573 458.22 207.452 460.458 205.214C464.38 200.733 464.38 194.573 460.458 190.093L393.818 120.088ZM373.658 93.2094L424.619 10.8894L380.939 97.1314C380.381 98.2525 379.818 98.8111 378.701 98.8111C377.021 99.3697 375.9 98.8111 375.342 98.8111C374.783 98.8111 373.662 97.69 373.104 96.0103C373.1 94.8892 373.658 93.7681 373.658 93.2095L373.658 93.2094ZM363.58 108.33C367.502 108.33 370.862 111.69 370.862 115.612C370.862 119.533 367.502 122.893 363.58 122.893C359.659 122.893 356.299 119.533 356.299 115.612C356.299 111.69 359.659 108.33 363.58 108.33ZM342.857 117.85C342.299 118.408 341.178 118.409 340.057 118.409L244.299 108.33L341.178 110.569C342.299 110.569 342.857 111.127 343.979 111.69C345.1 112.811 345.1 113.928 345.1 115.049C345.1 115.608 344.537 116.729 342.857 117.85L342.857 117.85ZM352.377 313.29L362.455 135.21H364.135L374.213 313.29H352.377ZM380.377 133.53C379.818 132.971 379.256 131.85 379.256 131.292C379.256 129.612 379.814 128.491 380.377 127.932C380.936 127.374 382.057 126.811 383.736 126.811C384.858 126.811 385.416 127.37 385.975 127.932L453.737 197.373L380.377 133.53Z' fill='black'/></svg>"
      }
    })
</script>

<label class="flex gap-2 items-center mt-8">
    <input type="checkbox" bind:checked={unifiedScaling}>
    <span class="text-gray-700 text-sm">Einheitliche Skalierung</span>
</label>
<div class="grid md:grid-cols-2 gap-4 my-4">
    {#if electricityProduction && expansionGoals}
    {#each energyTypes as type}
    <Chart 
    {type}
    {unifiedScaling}
    dataProduction={electricityProduction.filter(d => d[type.key]).map(d => {
        return {
        x: new Date(d.date),
        y: d[type.key]
        }
    })}
    dataGoals={expansionGoals.map(d => {
        return {
        x: new Date(d.date),
        y: d[type.key]
        }
    })} />
    {/each}
    {/if}
</div>


<div class="grid grid-cols-2 gap-4 mt-8 border-t-2 pt-4">
  {#each expansionGaps as gap}
    <GapIndicator {gap} />
  {/each}
</div>