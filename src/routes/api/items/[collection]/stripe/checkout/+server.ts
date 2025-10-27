// src/routes/api/stripe/checkout/+server.ts
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const { amount, name, email, dob, message } = await request.json();

	if (!amount || typeof amount !== 'number' || amount < 100) {
		return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
	}
	if (!email) {
		return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400 });
	}

	const body = new URLSearchParams({
		mode: 'payment',
		'line_items[0][price_data][currency]': 'eur',
		'line_items[0][price_data][product_data][name]': 'Spende an Klimadashboard',
		'line_items[0][price_data][unit_amount]': String(amount), // cents
		'line_items[0][quantity]': '1',
		customer_email: email,
		success_url: `${url.origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${url.origin}/donate?canceled=1`,
		'metadata[name]': String(name || ''),
		'metadata[dob]': String(dob || ''),
		'metadata[message]': String(message || '')
	});

	const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	const data = await res.json();
	if (!res.ok) {
		return new Response(JSON.stringify({ error: data?.error?.message || 'Stripe error' }), {
			status: 500
		});
	}
	return new Response(JSON.stringify({ url: data.url }), { status: 200 });
};
