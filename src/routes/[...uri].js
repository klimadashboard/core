import { locale } from "$lib/stores/i18n";

/** @type {import('./[uri]').RequestHandler} */
export async function get({ params }) {
  let localeString = "de";
  locale.subscribe(value => {
     localeString = value
  });
  let url = "https://cms.klimadashboard.org/" + localeString + "/klimadashboard-at" + (params.uri !== "" ? "/" : "") + params.uri + ".json";
  let res = await fetch(url);
  let item = await res.json();

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