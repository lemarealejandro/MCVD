// Inicio de sesión con Supabase Auth. El acceso real a los datos lo controlan
// las políticas RLS de la base: solo los miembros de una clínica ven sus datos.

import { supabase } from '../lib/supabase';
import { COACH_SEEN_KEY } from '../data/sectionHelp';

// Estado en memoria: sesión de Supabase + clínica del usuario.
let session = null;
let membership = null; // { clinicId, clinicName, demoData, role }
let platformAdmin = false; // administrador de la plataforma (tabla platform_admins)

async function loadPlatformAdmin() {
  const { data, error } = await supabase.from('platform_admins').select('user_id').maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function loadMembership() {
  const { data, error } = await supabase
    .from('clinic_members')
    .select('clinic_id, role, clinics (name, demo_data)')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    clinicId: data.clinic_id,
    clinicName: data.clinics?.name ?? '',
    demoData: Boolean(data.clinics?.demo_data),
    role: data.role,
  };
}

// Se llama una vez antes de mostrar la app: recupera la sesión guardada.
export async function initAuth() {
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
    membership = session ? await loadMembership() : null;
    platformAdmin = session ? await loadPlatformAdmin() : false;
  } catch (error) {
    console.error('No se pudo recuperar la sesión:', error);
    session = null;
    membership = null;
    platformAdmin = false;
  }

  supabase.auth.onAuthStateChange((event, newSession) => {
    session = newSession;
    // Sesión expirada o cerrada en otra pestaña (logout() ya limpió el estado antes).
    if (event === 'SIGNED_OUT' && (membership || platformAdmin)) {
      membership = null;
      platformAdmin = false;
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/plataforma')) window.location.assign('/login');
    }
  });
}

export const isAuthenticated = () => Boolean(session && membership);
export const isPlatformAdmin = () => Boolean(session && platformAdmin);

// Clínicas sin datos de ejemplo arrancan con todo en cero (antes: "cuenta secundaria").
export const isSetupAccount = () => Boolean(membership && !membership.demoData);

export const getClinicId = () => membership?.clinicId ?? null;
export const getClinicName = () => membership?.clinicName ?? '';
export const getUserEmail = () => session?.user?.email ?? '';

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    const message = error.message === 'Invalid login credentials'
      ? 'Correo o contraseña incorrectos.'
      : `No se pudo iniciar sesión: ${error.message}`;
    return { success: false, error: message };
  }
  session = data.session;
  try {
    membership = await loadMembership();
  } catch (loadError) {
    await supabase.auth.signOut();
    return { success: false, error: `No se pudo cargar tu clínica: ${loadError.message}` };
  }
  try {
    platformAdmin = await loadPlatformAdmin();
  } catch {
    platformAdmin = false;
  }
  if (!membership && platformAdmin) {
    sessionStorage.removeItem(COACH_SEEN_KEY);
    return { success: true, destination: '/plataforma' };
  }
  if (!membership) {
    const { data: request } = await supabase
      .from('clinic_requests')
      .select('status, clinic_name')
      .maybeSingle();
    await supabase.auth.signOut();
    session = null;
    if (request?.status === 'pending') {
      return { success: false, error: `La solicitud de ${request.clinic_name} está pendiente de aprobación. Podrás entrar cuando sea aprobada.` };
    }
    if (request?.status === 'rejected') {
      return { success: false, error: 'Tu solicitud de registro no fue aprobada. Contacta al administrador.' };
    }
    return { success: false, error: 'Tu usuario no tiene una clínica asignada. Pide acceso al administrador.' };
  }
  // Sesión nueva: los coachmarks de las secciones vuelven a mostrarse.
  sessionStorage.removeItem(COACH_SEEN_KEY);
  return { success: true };
}

export async function logout() {
  membership = null;
  platformAdmin = false;
  session = null;
  await supabase.auth.signOut();
}
