// Registro de una clínica nueva (público).
// Crea el usuario con su contraseña, guarda la solicitud como "pending" y envía
// un correo al administrador con el enlace para aprobarla o rechazarla.
//
// Secretos (Edge Functions → Secrets):
//   RESEND_API_KEY  obligatorio para enviar el correo (https://resend.com)
//   APP_URL         URL pública de la app, p. ej. https://mcvd.vercel.app
//   ADMIN_EMAIL     opcional, por defecto lemare.alejandro@gmail.com
//   RESEND_FROM     opcional, remitente con dominio verificado en Resend
import { createClient } from 'npm:@supabase/supabase-js@2';

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'lemare.alejandro@gmail.com';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'ClinicPlus <onboarding@resend.dev>';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const secretKey = (() => {
  try { return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '')['default']; }
  catch { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); }
})();
const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey!, { auth: { persistSession: false } });

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (text: string) => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));

// Solo se usan como base del enlace URLs de confianza (evita enlaces a sitios ajenos en el correo).
function appBaseUrl(req: Request): string | null {
  const configured = Deno.env.get('APP_URL');
  if (configured) return configured.replace(/\/$/, '');
  const origin = req.headers.get('origin') ?? '';
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return origin;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida.' }, 400); }

  const clinicName = String(body.clinicName ?? '').trim();
  const contactName = String(body.contactName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (clinicName.length < 2 || clinicName.length > 200) return json({ error: 'Escribe el nombre de la clínica.' }, 400);
  if (contactName.length < 2 || contactName.length > 200) return json({ error: 'Escribe tu nombre completo.' }, 400);
  if (phone.length > 40) return json({ error: 'El teléfono es demasiado largo.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return json({ error: 'Escribe un correo válido.' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'La contraseña debe tener entre 8 y 72 caracteres.' }, 400);

  // Freno básico contra abuso: máximo 20 solicitudes por hora en total.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from('clinic_requests').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if ((count ?? 0) >= 20) return json({ error: 'Hay muchas solicitudes en este momento. Inténtalo más tarde.' }, 429);

  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: contactName, phone },
  });
  if (userError || !created.user) {
    const taken = /already|registered|exists/i.test(userError?.message ?? '');
    return json({ error: taken
      ? 'Ese correo ya está registrado. Inicia sesión o usa otro correo.'
      : 'No se pudo crear el usuario. Inténtalo de nuevo.' }, taken ? 409 : 500);
  }

  const token = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const { data: request, error: insertError } = await admin.from('clinic_requests').insert({
    user_id: created.user.id,
    clinic_name: clinicName,
    contact_name: contactName,
    phone: phone || null,
    email,
    token_hash: await sha256(token),
  }).select('id, created_at').single();

  if (insertError || !request) {
    console.error('insert clinic_requests', insertError);
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'No se pudo registrar la solicitud. Inténtalo de nuevo.' }, 500);
  }

  // Correo al administrador
  const base = appBaseUrl(req);
  const reviewUrl = base ? `${base}/aprobar-clinica?id=${request.id}&token=${token}` : null;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;color:#13232b">
        <h2 style="margin:0 0 12px">Nueva solicitud de clínica</h2>
        <table style="border-collapse:collapse;font-size:15px">
          <tr><td style="padding:4px 12px 4px 0;color:#55666f">Clínica</td><td><b>${esc(clinicName)}</b></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#55666f">Responsable</td><td>${esc(contactName)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#55666f">Correo</td><td>${esc(email)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#55666f">Teléfono</td><td>${esc(phone || '—')}</td></tr>
        </table>
        ${reviewUrl
          ? `<p style="margin:24px 0"><a href="${reviewUrl}" style="background:#0b6f78;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Revisar solicitud</a></p>
             <p style="font-size:13px;color:#55666f">El enlace vence en 30 días. No lo reenvíes: permite aprobar la clínica.</p>`
          : `<p>Configura el secreto APP_URL para recibir el enlace de aprobación. Id de la solicitud: ${request.id}</p>`}
      </div>`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: RESEND_FROM, to: [ADMIN_EMAIL], reply_to: email, subject: `Solicitud de alta: ${clinicName}`, html }),
    });
    if (res.ok) await admin.from('clinic_requests').update({ notified_at: new Date().toISOString() }).eq('id', request.id);
    else console.error('resend', res.status, await res.text());
  } else {
    console.error('RESEND_API_KEY no configurado: no se envió el correo de la solicitud', request.id);
  }

  return json({ ok: true });
});
