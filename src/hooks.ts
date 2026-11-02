// src/hooks.ts
import type { Reroute } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

// Routes outside the (main) group are shared by all three sites and have no
// /org counterpart. Prefixing them makes the .org build miss the endpoint and
// fall through to the catch-all page, which answers 404.
const SHARED_ROUTES = [
	'/api',
	'/embed',
	'/llms.txt',
	'/robots.txt',
	'/sitemap.xml',
	'/test-social-image'
];

function isShared(pathname: string) {
	return SHARED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export const reroute: Reroute = ({ url }) => {
	if (isShared(url.pathname)) {
		return url.pathname;
	}
	if (url.host === 'klimadashboard.org' || env.PUBLIC_VERSION === 'org') {
		return `/org${url.pathname}`;
	}
	return `${url.pathname}`;
};
