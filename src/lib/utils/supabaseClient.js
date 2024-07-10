import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
	'https://api.klimadashboard.org',
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE5ODcxMjAwLAogICJleHAiOiAxODc3NjM3NjAwCn0.pkHQFbwqaT8rEqlxI63-oF-ou6Q-VkzCzX82kgb4N_E'
);

console.log(supabase);
