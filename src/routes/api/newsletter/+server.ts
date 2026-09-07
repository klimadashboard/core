import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscribeToNewsletter } from '$lib/server/brevo';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request, fetch }) => {
	const { email } = await request.json().catch(() => ({ email: null }));

	if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
		return json({ error: 'invalid_email' }, { status: 400 });
	}

	try {
		await subscribeToNewsletter({ fetch, email });
	} catch (e) {
		console.error('[newsletter] subscribe failed', e);
		return json({ error: 'brevo_error' }, { status: 502 });
	}

	return json({ success: true });
};
