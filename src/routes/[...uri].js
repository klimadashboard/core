import { locale } from "$lib/stores/i18n";

 
/** @type {import('./[uri]').RequestHandler} */
export async function get({ params }) {
  const url = "https://cms.klimadashboard.org/de/klimadashboard-at/" + params.uri + ".json";
  const res = await fetch(url);
  const item = await res.json();

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