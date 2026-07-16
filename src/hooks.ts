// src/hooks.ts
import type { Reroute, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const reroute: Reroute = ({ url }) => {
	if (url.host === 'klimadashboard.org' || env.PUBLIC_VERSION === 'org') {
		return `/org${url.pathname}`;
	}
	if (env.PUBLIC_VERSION === 'electrification' && url.pathname === '/') {
		return '/electrification';
	}
	return `${url.pathname}`;
};
