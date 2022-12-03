import { locale } from "$lib/stores/i18n";
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

let localeString = "de";
locale.subscribe(value => {
   localeString = value
});
 
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const url = "https://cms.klimadashboard.org/" + localeString + "/klimadashboard-" + "at" + (params.slug !== "" ? "/" : "") + params.slug + ".json";
  const res = await fetch(url);
  const item = await res.json();
 
  if (item) {
    return item;
  }
 
  throw error(404, 'Not found');
}