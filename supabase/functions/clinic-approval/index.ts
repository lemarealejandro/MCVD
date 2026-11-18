// Revisión de una solicitud de clínica desde el enlace del correo del administrador.
// POST { action: 'view' | 'approve' | 'reject', id, token }
// El token es secreto (solo viaja en el correo); en la base se guarda su sha256.
import { createClient } from 'npm:@supabase/supabase-js@2';

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

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (text: string) => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// Aviso al solicitante: solo si hay un remitente con dominio verificado en Resend.
async function notifyRequester(email: string, clinicName: string, approved: boolean) {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM');
  if (!key || !from) return;
  const appUrl = Deno.env.get('APP_URL');
  const html = approved
    ? `<p>Tu clínica <b>${esc(clinicName)}</b> fue aprobada.</p><p>Ya puedes entrar con tu correo y la contraseña que creaste${appUrl ? `: <a href="${appUrl}/login">${appUrl}/login</a>` : '.'}</p>`
    : `<p>Tu solicitud para <b>${esc(clinicName)}</b> no fue aprobada. Si crees que es un error, responde a este correo.</p>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [email], subject: approved ? 'Tu clínica fue aprobada' : 'Tu solicitud de clínica', html }),
  });
  if (!res.ok) console.error('resend requester', res.status, await res.text());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida.' }, 400); }
  const action = String(body.action ?? 'view');
  const id = String(body.id ?? '');
  const token = String(body.token ?? '');
  if (!['view', 'approve', 'reject'].includes(action)) return json({ error: 'Acción no válida.' }, 400);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/i.test(token)) return json({ error: 'Enlace no válido.' }, 400);

  const { data: request, error } = await admin.from('clinic_requests')
    .select('id, clinic_name, contact_name, phone, email, status, token_hash, token_expires_at, created_at, reviewed_at')
    .eq('id', id).maybeSingle();
  if (error) { console.error(error); return json({ error: 'No se pudo leer la solicitud.' }, 500); }
  if (!request || !safeEqual(request.token_hash, await sha256(token))) return json({ error: 'Enlace no válido.' }, 404);
  if (new Date(request.token_expires_at) < new Date()) return json({ error: 'El enlace venció. Revisa la solicitud en Supabase.' }, 410);

  const view = {
    id: request.id,
    clinicName: request.clinic_name,
    contactName: request.contact_name,
    phone: request.phone,
    email: request.email,
    status: request.status,
    createdAt: request.created_at,
    reviewedAt: request.reviewed_at,
  };
  if (action === 'view') return json({ request: view });
  if (request.status !== 'pending') return json({ error: `Esta solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 'rechazada'}.`, request: view }, 409);

  if (action === 'approve') {
    const { error: rpcError } = await admin.rpc('approve_clinic_request', { req_id: id });
    if (rpcError) { console.error(rpcError); return json({ error: 'No se pudo aprobar la solicitud.' }, 500); }
    await notifyRequester(request.email, request.clinic_name, true);
    return json({ request: { ...view, status: 'approved', reviewedAt: new Date().toISOString() } });
  }

  const { error: rejectError } = await admin.from('clinic_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'pending');
  if (rejectError) { console.error(rejectError); return json({ error: 'No se pudo rechazar la solicitud.' }, 500); }
  await notifyRequester(request.email, request.clinic_name, false);
  return json({ request: { ...view, status: 'rejected', reviewedAt: new Date().toISOString() } });
});
