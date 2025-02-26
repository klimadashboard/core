/**
 * @param {string} param
 * @return {boolean}
 * @satisfies {import('@sveltejs/kit').ParamMatcher}
 */
export function match(param) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
}
