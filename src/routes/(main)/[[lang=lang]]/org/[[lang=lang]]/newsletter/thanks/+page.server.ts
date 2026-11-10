import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const lang = params.lang === 'en' ? 'en' : 'de';
	return {
		content: {
			title: lang === 'en' ? 'Newsletter confirmed' : 'Newsletter bestätigt'
		}
	};
};
