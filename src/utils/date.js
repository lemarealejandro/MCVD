// Fecha local en formato YYYY-MM-DD. No usar toISOString(): convierte a UTC y,
// en zonas como UTC-4, cambia al día siguiente a partir de las 8 p. m.
export const localDateStr = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
