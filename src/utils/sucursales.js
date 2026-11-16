export const SUCURSALES_KEY = 'clinicplus_sucursales';

export const sucursalNombre = (sucursales, id) =>
  sucursales.find(s => String(s.id) === String(id))?.nombre || '—';
