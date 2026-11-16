// Control de acceso solo en el navegador: evita la entrada casual, pero no es
// seguridad real. Proteger datos de pacientes requiere validar en un backend.

import { COACH_SEEN_KEY } from '../data/sectionHelp';

const SESSION_KEY = 'clinicplus_session';
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
// Cuenta secundaria: entra con datos vacíos (primer uso) y aislados de la cuenta admin.
const SETUP_USER = import.meta.env.VITE_SETUP_USER;
const SETUP_PASSWORD_HASH = import.meta.env.VITE_SETUP_PASSWORD_HASH;

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// '1' es el valor antiguo de la sesión admin; se acepta para no cerrar sesiones abiertas.
export const getSessionRole = () => {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    if (value === '1' || value === 'admin') return 'admin';
    if (value === 'setup') return 'setup';
  } catch {
    // sessionStorage no disponible
  }
  return null;
};

export const isAuthenticated = () => getSessionRole() !== null;

export const isSetupAccount = () => getSessionRole() === 'setup';

export async function login(username, password) {
  const adminConfigured = Boolean(ADMIN_USER && ADMIN_PASSWORD_HASH);
  const setupConfigured = Boolean(SETUP_USER && SETUP_PASSWORD_HASH);
  if (!adminConfigured && !setupConfigured) {
    return { success: false, error: 'Acceso sin configurar: faltan VITE_ADMIN_USER y VITE_ADMIN_PASSWORD_HASH.' };
  }
  if (!crypto.subtle) {
    return { success: false, error: 'El inicio de sesión requiere HTTPS o localhost.' };
  }
  const hash = await sha256(password);
  const user = username.trim();

  let role = null;
  if (adminConfigured && user === ADMIN_USER && hash === ADMIN_PASSWORD_HASH) role = 'admin';
  else if (setupConfigured && user === SETUP_USER && hash === SETUP_PASSWORD_HASH) role = 'setup';

  if (!role) {
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  }
  sessionStorage.setItem(SESSION_KEY, role);
  // Sesión nueva: los coachmarks de las secciones vuelven a mostrarse.
  sessionStorage.removeItem(COACH_SEEN_KEY);
  return { success: true };
}

export const logout = () => sessionStorage.removeItem(SESSION_KEY);
