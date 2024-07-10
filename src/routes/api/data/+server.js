import { supabase } from '$lib/utils/supabaseClient';
import { json } from '@sveltejs/kit';

export async function GET(request) {
	const { data, error } = await supabase.from('test').select();
	console.log(data);
	if (!error) {
		return json({
			data: data ?? []
		});
	} else {
		return json({
			error: error.message
		});
	}
}
