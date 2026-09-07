import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { findCustomerByEmail, createPortalSession } from '$lib/server/stripe';
import { sendTransactionalEmail } from '$lib/server/brevo';

const GENERIC_MESSAGE =
	'Falls wir eine Spende mit dieser Email-Adresse finden, bekommst du in Kürze einen Link zur Verwaltung deiner Spende zugeschickt.';

export const actions: Actions = {
	default: async ({ request, fetch, url }) => {
		const fd = await request.formData();
		const email = String(fd.get('email') ?? '').trim();
		if (!email) return fail(400, { error: 'Bitte Email angeben.' });

		try {
			const customer = await findCustomerByEmail(email);
			if (customer) {
				const session = await createPortalSession(customer.id, `${url.origin}/donate`);
				await sendTransactionalEmail({
					fetch,
					to: email,
					subject: 'Deine Spende verwalten – Klimadashboard',
					htmlContent: `
						<div style="font-family:sans-serif;max-width:480px">
							<p>Hallo,</p>
							<p>über den folgenden Link kannst du deine Spende beim Klimadashboard verwalten
							(Zahlungsmethode ändern, kündigen):</p>
							<p><a href="${session.url}" style="display:inline-block;padding:10px 18px;background:#15803d;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Spende verwalten</a></p>
							<p style="font-size:12px;color:#888">Dieser Link ist nur für kurze Zeit gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
						</div>`
				});
			}
			// Always the same response, whether or not a customer was found — avoids
			// leaking which email addresses have donations on file.
			return { success: true, message: GENERIC_MESSAGE };
		} catch (e) {
			console.error('[donate/manage] failed', e);
			return { success: true, message: GENERIC_MESSAGE };
		}
	}
};
