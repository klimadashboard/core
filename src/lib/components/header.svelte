<script>
    import { theme } from "../stores/theme";
    import { locale } from "../stores/i18n";

    async function getNav() {
        const res = await fetch('https://cms.klimadashboard.org/' + $locale + '/index.json');
		    const json = await res.json();

		if (json) {
      let array = Object.values(json).filter(entry => entry.id.includes("klimadashboard-at"));
			return array;
		} else {
			throw new Error(JSON.stringify(json));
		}
  };

  let promise = getNav();

  $: if($locale) {
  // reload when language changes
  promise = getNav();
  }

  $: showNav = false;

  $: changeLocale = function() {
    locale.set($locale == "de" ? "en" : "de");
    location.reload();
  }
</script>

<header class="fixed py-3 w-full z-50 bg-white dark:bg-gray-900">
    <div class="container flex justify-between items-center">
        <a href="/" aria-label="Startseite">
            <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 rounded">
                <rect width="256" height="256" fill="url(#kd-gradient-header)"/>
                <path d="M119.45 88H53C50.7909 88 49 89.7909 49 92V164C49 166.209 50.7909 168 53 168H119.45C122.998 168 124.79 163.723 122.3 161.194L92.3872 130.806C90.8547 129.249 90.8547 126.751 92.3872 125.194L122.3 94.8061C124.79 92.2773 122.998 88 119.45 88Z" fill="#DBF0E0"/>
                <path opacity="0.6" d="M162.95 88H134.808C133.732 88 132.701 88.4337 131.948 89.203L96.7358 125.203C95.2152 126.758 95.2152 129.242 96.7358 130.797L131.948 166.797C132.701 167.566 133.732 168 134.808 168H162.95C166.498 168 168.29 163.723 165.8 161.194L135.887 130.806C134.355 129.249 134.355 126.751 135.887 125.194L165.8 94.8061C168.29 92.2773 166.498 88 162.95 88Z" fill="#DBF0E0"/>
                <path opacity="0.2" d="M197.95 88H178.808C177.732 88 176.701 88.4337 175.948 89.203L140.736 125.203C139.215 126.758 139.215 129.242 140.736 130.797L175.948 166.797C176.701 167.566 177.732 168 178.808 168H197.95C201.498 168 203.29 163.723 200.8 161.194L170.887 130.806C169.355 129.249 169.355 126.751 170.887 125.194L200.8 94.8061C203.29 92.2773 201.498 88 197.95 88Z" fill="#DBF0E0"/>
                <defs>
                <linearGradient id="kd-gradient-header" x1="425" y1="8.00003" x2="16" y2="248" gradientUnits="userSpaceOnUse">
                <stop stop-color="#A3D58A"/>
                <stop offset="1" stop-color="#28A889"/>
                </linearGradient>
                </defs>
            </svg>                
        </a>

        <nav class="flex gap-4">            
            <button on:mousedown={() => showNav = !showNav} class="sm:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-menu-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
             </svg>
            </button>
            {#await promise then children}
            <ul class="bg-white gap-2 sm:gap-4 {showNav ? "flex flex-col absolute inset-0 h-screen top-14 p-4" : "hidden"} sm:flex">
            {#each children.filter(d => d.num > 0 && d.parent == "klimadashboard-at") as child}
              <li class="group relative">
              <a href="{child.uri.replace("klimadashboard-at","")}" class="navigation-link">{child.content.title}</a>
              {#if children.filter(c => child.id == c.parent && c !== child)}
              <ul class="sm:opacity-0 sm:pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition sm:absolute top-full -left-2 p-2 bg-white dark:bg-gray-800 w-64">
              {#each children.filter(c => child.id == c.parent && c !== child) as grandchild}
                  <li>
                    <a href="{grandchild.id.replace("klimadashboard-at/","/")}" class="navigation-link font-bold">{grandchild.content.title}</a>
                      <ul>
                        {#each children.filter(c => c.id.includes(grandchild.uri) && c !== grandchild) as greatgrandchild}
                          <li>
                            <a href="{greatgrandchild.id.replace("klimadashboard-at/","/")}" class="navigation-link">{greatgrandchild.content.title}</a>
                          </li>
                        {/each}
                      </ul>
                  </li>
              {/each}
              </ul>
              {/if}
              </li>
            {/each}
            </ul>
            {/await}

            <div class="{showNav ? "absolute top-14" : "hidden  sm:block"} group sm:relative text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="hidden sm:inline-block" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <circle cx="5" cy="12" r="1"></circle>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
             </svg>
            <ul class="sm:opacity-0 sm:pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition sm:absolute top-full -left-2 p-2 bg-white dark:bg-gray-800">
            <li><a href="/charts" class="navigation-link">Charts</a></li>
            <li><a href="/glossary" class="navigation-link">Glossary</a></li>
            </ul>
            </div>
            
            <!--
            <button class="flex items-center" on:mousedown={() => changeLocale()}>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-language" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M4 5h7"></path>
                <path d="M9 3v2c0 4.418 -2.239 8 -5 8"></path>
                <path d="M5 9c-.003 2.144 2.952 3.908 6.7 4"></path>
                <path d="M12 20l4 -9l4 9"></path>
                <path d="M19.1 18h-6.2"></path>
             </svg>
             <span class="uppercase font-semibold">{["de","en"].find(d => d !== $locale)}</span>
            </button>
            -->
            <!--
          <button aria-label="Dark Mode">
          {#if $theme == "dark"}
          <svg xmlns="http://www.w3.org/2000/svg" on:mousedown={() => $theme = "light"} class="icon icon-tabler icon-tabler-sun" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"></path>
          </svg>
          {:else}
          <svg xmlns="http://www.w3.org/2000/svg" on:mousedown={() => $theme = "dark"} class="icon icon-tabler icon-tabler-moon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"></path>
         </svg>
          {/if}
          </button>
          -->
          </nav>
    </div>
</header>

<style>
  .navigation-link:hover {
    @apply border-b;
  }
</style>