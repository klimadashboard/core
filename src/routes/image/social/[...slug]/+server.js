// src/routes/image/[slug]/+server.js

import svg2img from 'svg2img';
import { PUBLIC_VERSION } from '$env/static/public';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

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

	// Read and base64-encode the font file
	const fontPath = path.join(process.cwd(), 'static', 'fonts', 'barlow-v12-latin-regular.ttf');
	const fontBuffer = fs.readFileSync(fontPath);
	const fontBase64 = fontBuffer.toString('base64');

	// Create an SVG with gradient background and text
	const title = pageData.title !== undefined ? pageData.title : 'Klimadashboard';
	const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style type="text/css">
                @font-face {
                    font-family: 'Barlow';
                    src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
                }
                .title {
                    font-family: 'Barlow', sans-serif;
                    font-weight: bold;
                    fill: white;
                }
                .subtitle {
                    font-family: 'Barlow', sans-serif;
                    font-weight: bold;
                    fill: white;
					text-transform: uppercase;
                }
            </style>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#27C264" />
              <stop offset="100%" stop-color="#11998E" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gradient)" />
          <text x="50" y="70" font-size="20" class="subtitle" dominant-baseline="middle">
            Klimadashboard
          </text>
          <text x="50" y="100" font-size="60" class="title" dominant-baseline="hanging">
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
					// No need to specify font options here since the font is embedded in the SVG
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
