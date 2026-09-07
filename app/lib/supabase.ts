import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://xhdlsbwyrjemhkvmofyg.supabase.co';
const supabaseKey = 'sb_publishable_beuw4nkTfdYXrMnyHODXhA_g44HdanJ';
export const supabase = createClient(supabaseUrl, supabaseKey);
