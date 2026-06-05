import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xacdflsilhckhemcaref.supabase.co';
const supabaseAnonKey = 'sb_publishable_XN9L1fCCU5bowo6BknsKpQ_ww1VKkeh';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    const { data: tickets, error: tError } = await supabase.from('tickets').select('*').limit(1);
    
    if (pError) console.error('Error fetching profiles:', pError.message);
    else console.log('Successfully connected to profiles table. Count:', profiles.length);

    if (tError) console.error('Error fetching tickets:', tError.message);
    else console.log('Successfully connected to tickets table. Count:', tickets.length);

    if (!pError && !tError) {
        console.log('Database connection is fully operational!');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

testConnection();
