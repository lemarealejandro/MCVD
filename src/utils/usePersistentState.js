import { useEffect, useState } from 'react';
import { isSetupAccount } from './auth';

// useState guardado en localStorage. Los datos quedan solo en este navegador.
// La cuenta secundaria (setup) usa claves con prefijo propio para no mezclarse con el admin.
export function usePersistentState(key, initial) {
  const storageKey = isSetupAccount() ? `setup:${key}` : key;

  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) return JSON.parse(raw);
    } catch (error) {
      console.error(`No se pudo leer ${storageKey}:`, error);
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`No se pudo guardar ${storageKey}:`, error);
    }
  }, [storageKey, value]);

  return [value, setValue];
}
