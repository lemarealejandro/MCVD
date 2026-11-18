import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase (proyecto CliniPlus). La URL y la clave publicable
// se leen de las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
