<script>
  import { theme } from "../stores/theme";
  import { locale } from "../stores/i18n";
  import { error } from '@sveltejs/kit';

  let promise = fetch('https://klimadashboard.org/get/navigation/at.json')
  .then((x) => x.json())
  .then((x) => Object.values(x.data).filter(d => d.num))
  .catch(function(err){
        throw error(500, 'Timeout when loading navigation. ' + err);
  });

  $: showNav = false;
</script>

<header class="fixed py-3 w-full z-50 bg-white ">
    <div class="container flex justify-between items-center">
        <nav class="flex gap-4">            
            <button on:mousedown={() => showNav = !showNav} class="sm:hidden" aria-label="Navigation">
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
              <a href="{child.uri.replace("klimadashboard-at","")}" class="navigation-link" on:mouseup={() => showNav = false}>{child.content.title}</a>
              {#if children.filter(c => child.id == c.parent && c !== child)}
              <ul class="sm:opacity-0 sm:pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition sm:absolute top-full -left-2 p-2 bg-white w-64">
              {#each children.filter(c => child.id == c.parent && c !== child) as grandchild}
                  <li>
                    <a href="{grandchild.id.replace("klimadashboard-at/","/")}" class="navigation-link font-bold" on:mouseup={() => showNav = false}>{grandchild.content.title}</a>
                      <ul>
                        {#each children.filter(c => c.id.includes(grandchild.uri) && c !== grandchild) as greatgrandchild}
                          <li>
                            <a href="{greatgrandchild.id.replace("klimadashboard-at/","/")}" on:mouseup={() => showNav = false} class="navigation-link">{greatgrandchild.content.title}</a>
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
            {:catch error}
            {error}
            {/await}

            <div class="{showNav ? "absolute top-96 left-4 md:left-0 md:top-14 " : "hidden  sm:block"} group sm:relative text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="hidden sm:inline-block" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <circle cx="5" cy="12" r="1"></circle>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
             </svg>
            <ul class="sm:opacity-0 sm:pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition absolute top-full -left-2 p-2 bg-white ">
            </ul>
            </div>
            
            <!--
            <button class="flex items-center" on:mousedown={() => changeLocale()} aria-label="Language Switch">
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
          </nav>
    </div>
</header>

<style>
  .navigation-link:hover {
    @apply border-b;
  }
</style>