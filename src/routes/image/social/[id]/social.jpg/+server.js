import renderSocialImage from 'puppeteer-social-image';
import { PUBLIC_VERSION } from '$env/static/public';
import { locale } from '$lib/stores/i18n';

let localeString = 'de';
locale.subscribe((value) => {
	localeString = value;
});

export async function GET({ params }) {
	const url =
		'https://cms.klimadashboard.org/' +
		localeString +
		'/klimadashboard-' +
		PUBLIC_VERSION +
		(params.id !== 'home' ? '/' + params.id : '') +
		'.json';

	const promise = await fetch(url)
		.then((x) => x.json())
		.catch(function (err) {
			throw error(404, 'Timeout when loading page data. ' + err);
		});

	const image = await renderSocialImage({
		template: 'article',
		templateParams: {
			imageUrl: 'https://klimadashboard.at/social_background.jpg',
			title: promise.heading,
			eyebrow: promise.eyebrow,
			watermark: 'klimadashboard.' + PUBLIC_VERSION,
			googleFont: 'Barlow',
			backgroundImageOverlay: false
		},
		size: 'facebook'
	});

	return new Response(image);
}
