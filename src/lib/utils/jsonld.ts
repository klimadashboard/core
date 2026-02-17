/**
 * Safely serialize a JSON-LD object for embedding in HTML via {@html}.
 * Escapes </script> sequences to prevent XSS.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/<\//g, '<\\/')}</script>`;
}
