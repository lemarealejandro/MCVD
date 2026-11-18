import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase (proyecto CliniPlus). La URL y la clave publicable
// se leen de las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Si faltan las variables (por ejemplo, no se configuraron en Vercel), la app
// muestra un aviso en lugar de quedar en blanco (ver main.jsx).
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
if (!supabaseConfigured) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://config-pendiente.invalid',
  supabaseKey || 'config-pendiente',
);

// Llama a una Edge Function pública de Supabase. Devuelve { data, error }.
export async function callFunction(name, body) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { data, error: data.error || `Error ${res.status}` };
    return { data, error: null };
  } catch {
    return { data: null, error: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.' };
  }
}
