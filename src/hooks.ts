// src/hooks.ts
import type { Reroute, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const reroute: Reroute = ({ url }) => {
	if (url.pathname.startsWith('/api')) {
		return url.pathname;
	}
	if (url.host === 'klimadashboard.org' || env.PUBLIC_VERSION === 'org') {
		return `/org${url.pathname}`;
	}
	return `${url.pathname}`;
};
