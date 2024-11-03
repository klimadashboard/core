// src/routes/image/[slug]/+server.js

import svg2img from 'svg2img';
import { PUBLIC_VERSION } from '$env/static/public';
import { error } from '@sveltejs/kit';

async function getData(slug) {
	const url =
		'https://klimadashboard.org/klimadashboard-' +
		PUBLIC_VERSION +
		(slug ? '/' + slug : '') +
		'.json';

	const promise = await fetch(url)
		.then((x) => x.json())
		.catch(function (err) {
			throw error(404, 'Timeout when loading page data. ' + err);
		});

	return promise;
}

/** @type {import('./social.jpg/$types').RequestHandler} */
export async function GET(event) {
	const width = 800;
	const height = 400;

	const slug = event.params.slug || '';
	const pageData = await getData(slug.replace('/social.jpg', ''));

	// Create an SVG with gradient background and text
	const title = pageData.title !== undefined ? pageData.title : 'Klimadashboard';
	const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
    		<style type="text/css">@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600');</style>
	  </defs>
	  <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#27C264" />
          <stop offset="100%" stop-color="#11998E" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)" />
      <text x="50" y="70" font-size="20" fill="white" dominant-baseline="middle" font-family="Barlow, sans-serif" font-weight="bold">
        Klimadashboard
      </text>
      <text x="50" y="100" font-size="60" class="uppercase" fill="white" dominant-baseline="hanging" font-family="Barlow, sans-serif" font-weight="bold">
        ${title}
      </text>
    </svg>
  `;

	// Convert SVG to JPEG
	const buffer = await new Promise((resolve, reject) => {
		svg2img(
			svg,
			{
				format: 'jpeg',
				width: width,
				height: height,
				resvg: {
					font: {
						fontFiles: ['/fonts/barlow-v12-latin-regular.ttf']
					}
				}
			},
			(error, buffer) => {
				if (error) reject(error);
				else resolve(buffer);
			}
		);
	});

	// Return the image as a response
	return new Response(buffer, {
		headers: {
			'Content-Type': 'image/jpeg',
			'Content-Length': buffer.length
		}
	});
}
