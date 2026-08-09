import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BREVO_API_KEY, BREVO_DOI_TEMPLATE_ID, BREVO_DOI_REDIRECT_URL } from '$env/static/private';
import { PUBLIC_VERSION } from '$env/static/public';

const NEWSLETTER_LIST_ID = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request, fetch }) => {
	const { email } = await request.json().catch(() => ({ email: null }));

	if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
		return json({ error: 'invalid_email' }, { status: 400 });
	}

	if (!BREVO_API_KEY || !BREVO_DOI_TEMPLATE_ID || !BREVO_DOI_REDIRECT_URL) {
		console.error('[newsletter] Brevo env vars are not fully configured');
		return json({ error: 'server_misconfigured' }, { status: 500 });
	}

	const res = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json',
			'api-key': BREVO_API_KEY
		},
		body: JSON.stringify({
			email,
			includeListIds: [NEWSLETTER_LIST_ID],
			templateId: Number(BREVO_DOI_TEMPLATE_ID),
			redirectionUrl: BREVO_DOI_REDIRECT_URL,
			attributes: {
				LISTS: `Newsletter_${PUBLIC_VERSION.toUpperCase()}`
			}
		})
	});

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		console.error('[newsletter] Brevo error', res.status, body);
		return json({ error: 'brevo_error' }, { status: 502 });
	}

	return json({ success: true });
};
