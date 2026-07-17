// src/hooks.ts
import type { Reroute, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const reroute: Reroute = ({ url }) => {
	if (url.host === 'klimadashboard.org' || env.PUBLIC_VERSION === 'org') {
		return `/org${url.pathname}`;
	}
	if (env.PUBLIC_VERSION === 'electrification') {
		// The tracker is the whole site, so the bare root maps onto the route — and so does each
		// bare locale root. Without the locale case, /de falls through to the [...slug] catch-all,
		// which 308s it to / and lands the reader back on English.
		const locale = /^\/(de|en)\/?$/.exec(url.pathname);
		if (locale) return `/${locale[1]}/electrification`;
		if (url.pathname === '/') return '/electrification';
	}
	return `${url.pathname}`;
};
