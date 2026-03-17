import { createClient } from '@supabase/supabase-js';

// Vai buscar as chaves seguras que guardaste no ficheiro .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cria a ponte de ligação entre o teu site e a base de dados
export const supabase = createClient(supabaseUrl, supabaseKey);