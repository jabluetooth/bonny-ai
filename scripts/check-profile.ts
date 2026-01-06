
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    console.log("Checking author_profiles...");
    const { data, error } = await supabase.from('author_profiles').select('*').eq('is_active', true);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("--- PROFILE DATA ---");
        console.log(JSON.stringify(data, null, 2));
    }
}
check();
