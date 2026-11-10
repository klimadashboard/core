export function GET({ url }) {
	const body = `User-agent: *
Allow: /
Disallow: /embed/
Disallow: /api/
Disallow: /test-social-image/

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Anthropic-AI
Allow: /

Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain' }
	});
}
