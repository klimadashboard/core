import {
	BREVO_API_KEY,
	BREVO_DOI_TEMPLATE_ID,
	BREVO_DOI_REDIRECT_URL
} from '$env/static/private';
import { PUBLIC_VERSION } from '$env/static/public';

const NEWSLETTER_LIST_ID = 3;

/**
 * Newsletter opt-in via Brevo's double opt-in flow — the subscriber still has to
 * confirm from their inbox, so ticking the box on the donation form starts the
 * process rather than completing it. Shared with /api/newsletter so both entry
 * points behave identically.
 */
export async function subscribeToNewsletter(opts: {
	fetch: typeof globalThis.fetch;
	email: string;
}): Promise<void> {
	if (!BREVO_API_KEY || !BREVO_DOI_TEMPLATE_ID || !BREVO_DOI_REDIRECT_URL) {
		throw new Error('Server misconfiguration: Brevo newsletter env vars are not set');
	}
	const res = await opts.fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json',
			'api-key': BREVO_API_KEY
		},
		body: JSON.stringify({
			email: opts.email,
			includeListIds: [NEWSLETTER_LIST_ID],
			templateId: Number(BREVO_DOI_TEMPLATE_ID),
			redirectionUrl: BREVO_DOI_REDIRECT_URL,
			attributes: { LISTS: `Newsletter_${PUBLIC_VERSION.toUpperCase()}` }
		})
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		console.error('[brevo] newsletter opt-in failed', res.status, body);
		throw new Error('Brevo newsletter opt-in failed');
	}
}

/** Sends a one-off transactional email via Brevo (inline HTML, no template needed). */
export async function sendTransactionalEmail(opts: {
	fetch: typeof globalThis.fetch;
	to: string;
	subject: string;
	htmlContent: string;
}): Promise<void> {
	if (!BREVO_API_KEY) {
		throw new Error('Server misconfiguration: BREVO_API_KEY is not set');
	}
	const res = await opts.fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json',
			'api-key': BREVO_API_KEY
		},
		body: JSON.stringify({
			sender: { email: 'team@klimadashboard.org', name: 'Klimadashboard' },
			to: [{ email: opts.to }],
			subject: opts.subject,
			htmlContent: opts.htmlContent
		})
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		console.error('[brevo] send failed', res.status, body);
		throw new Error('Brevo send failed');
	}
}
