import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getClinicId, isSetupAccount } from './auth';

const SAVE_DELAY_MS = 500;

const readLocal = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const writeLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage lleno o no disponible: la copia en Supabase sigue siendo la principal.
  }
};

// useState guardado en Supabase (tabla clinic_data, una fila por colección y clínica).
// Además guarda una copia local para mostrar los datos al instante mientras carga.
// La primera vez que una colección no existe en la base, se sube lo que había en
// este navegador (datos de la versión anterior) o el valor inicial.
export function usePersistentState(key, initial) {
  const clinicId = getClinicId();
  const cacheKey = `clinic:${clinicId}:${key}`;

  const [value, setValue] = useState(() => {
    const cached = readLocal(cacheKey);
    if (cached !== undefined) return cached;
    // Datos de la versión anterior (solo navegador): admin usaba la clave tal cual y
    // la cuenta secundaria la clave con prefijo "setup:".
    const legacy = readLocal(isSetupAccount() ? `setup:${key}` : key);
    if (legacy !== undefined) return legacy;
    return typeof initial === 'function' ? initial() : initial;
  });

  const loadedRef = useRef(false);   // ya se leyó la base: se pueden guardar cambios
  const skipSaveRef = useRef(false); // el último cambio vino de la base: no reenviarlo
  const valueRef = useRef(value);
  // Se actualiza antes que los efectos de guardado (los de layout corren primero).
  useLayoutEffect(() => { valueRef.current = value; }, [value]);

  // Carga inicial desde Supabase.
  useEffect(() => {
    if (!clinicId) return undefined;
    let cancelled = false;
    loadedRef.current = false;

    (async () => {
      const { data, error } = await supabase
        .from('clinic_data')
        .select('value')
        .eq('clinic_id', clinicId)
        .eq('collection', key)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error(`No se pudo cargar ${key} desde Supabase:`, error);
        return; // sin cargar no se guarda, para no pisar los datos de la base
      }
      if (data) {
        skipSaveRef.current = true;
        setValue(data.value);
        writeLocal(cacheKey, data.value);
      } else {
        // Primera vez: sube los datos actuales (si otra pestaña se adelantó, gana la suya).
        const { error: insertError } = await supabase
          .from('clinic_data')
          .upsert({ clinic_id: clinicId, collection: key, value: valueRef.current },
            { onConflict: 'clinic_id,collection', ignoreDuplicates: true });
        if (insertError) console.error(`No se pudo crear ${key} en Supabase:`, insertError);
      }
      if (!cancelled) loadedRef.current = true;
    })();

    return () => { cancelled = true; };
  }, [clinicId, key, cacheKey]);

  // Guarda los cambios (con una pequeña espera para agrupar ediciones seguidas).
  useEffect(() => {
    if (!clinicId || !loadedRef.current) return undefined;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return undefined;
    }
    writeLocal(cacheKey, value);

    const save = () => supabase
      .from('clinic_data')
      .upsert({ clinic_id: clinicId, collection: key, value }, { onConflict: 'clinic_id,collection' })
      .then(({ error }) => {
        if (error) console.error(`No se pudo guardar ${key} en Supabase:`, error);
      });

    const timer = setTimeout(save, SAVE_DELAY_MS);
    // Si el componente se desmonta antes de la espera, guarda de inmediato.
    return () => {
      clearTimeout(timer);
      if (valueRef.current === value) save();
    };
  }, [clinicId, key, cacheKey, value]);

  return [value, setValue];
}
