// Presupuesto de tratamiento: vigencia de 48 horas y reglas de renovación.
// Funciones puras; no leen el reloj salvo que se pase `ahora`.

export const VIGENCIA_HORAS = 48;

export const calcularVencimiento = (desdeIso) =>
  new Date(new Date(desdeIso).getTime() + VIGENCIA_HORAS * 60 * 60 * 1000).toISOString();

export const presupuestoVencido = (presupuesto, ahora = new Date()) =>
  Boolean(presupuesto) && new Date(presupuesto.vencimiento) <= ahora;

export const formatearFechaHora = (iso) => {
  const d = new Date(iso);
  return isNaN(d)
    ? '—'
    : d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const totalPresupuesto = (items = [], tasa = 1) => {
  const usd = items.reduce((s, i) => s + Number(i.priceUSD) * Number(i.qty), 0);
  return { usd, ves: usd * Number(tasa) };
};

// Al renovar, los precios vuelven a leerse del catálogo vigente.
// `catalogo` es un mapa id → { priceUSD }. Si un procedimiento ya no existe, conserva su precio.
export const revalorarItems = (items = [], catalogo = {}) =>
  items.map(i => {
    const actual = catalogo[i.catalogId || i.id];
    return actual ? { ...i, priceUSD: actual.priceUSD } : i;
  });
