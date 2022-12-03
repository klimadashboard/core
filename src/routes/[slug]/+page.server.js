import { locale } from "$lib/stores/i18n";
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

let version = "at";
 
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const url = "https://cms.klimadashboard.org/" + 'de' + "/klimadashboard-" + 'at' + (params.slug !== "" ? "/" : "") + params.slug + ".json";
  const res = await fetch(url);
  const item = await res.json();
 
  if (item) {
    return {
      status: 200,
      headers: {},
      body: { item }
    };
  }
 
  throw error(404, 'Not found');
}

/*
export async function get({ params }) {
  let localeString = "de";
  locale.subscribe(value => {
     localeString = value
  });
  let url = "https://cms.klimadashboard.org/" + localeString + "/klimadashboard-" + version + (params.uri !== "" ? "/" : "") + params.uri + ".json";
  let res = await fetch(url);
  let item = await res.json();

  console.log(item);

  if (item) {
    return {
      status: 200,
      headers: {},
      body: { item }
    };
  }
 
  return {
    status: 404
  };
}
*/