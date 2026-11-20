// Cuenta del paciente: cargos (lo que debe) y pagos (lo que pagó).
// Se guarda en la ficha (`patient.cuenta`), separada del presupuesto, porque el
// presupuesto vence y se renueva y los pagos no deben perderse.
// Funciones puras; los montos se manejan en USD.

export const FORMAS_DE_PAGO = [
  'Efectivo USD',
  'Efectivo Bs',
  'Transferencia',
  'Pago Móvil',
  'Zelle',
  'Tarjeta de débito',
  'Tarjeta de crédito',
  'Otro',
];

// Formas de pago que se registran en bolívares (el monto en USD sale de la tasa).
export const FORMAS_EN_BS = ['Efectivo Bs', 'Transferencia', 'Pago Móvil', 'Tarjeta de débito'];

export const DIAS_PLAZO_POR_DEFECTO = 30;

const redondear = (n) => Math.round(Number(n) * 100) / 100;

export const cuentaVacia = () => ({ cargos: [], pagos: [] });

export const sumarDias = (fechaIso, dias) => {
  const d = new Date(`${fechaIso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

export const hoyIso = (ahora = new Date()) => {
  const d = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};

// ¿Este presupuesto ya se pasó a la cuenta?
export const presupuestoEnCuenta = (cuenta, presupuestoId) =>
  Boolean(presupuestoId) && (cuenta?.cargos || []).some(c => c.presupuestoId === presupuestoId);

// Convierte los ítems del presupuesto en cargos (uno por procedimiento).
export const cargosDesdePresupuesto = (presupuesto, { fecha, vence, nuevoId }) =>
  (presupuesto?.items || []).map((item, i) => ({
    id: nuevoId(i),
    fecha,
    vence: vence || null,
    descripcion: item.qty > 1 ? `${item.name} × ${item.qty}` : item.name,
    montoUSD: redondear(Number(item.priceUSD) * Number(item.qty)),
    presupuestoId: presupuesto.id,
  }));

// Monto en USD de un pago. En bolívares: montoBs / tasa.
export const montoPagoUSD = ({ moneda, monto, tasa }) => {
  const valor = Number(monto);
  if (!(valor > 0)) return 0;
  if (moneda === 'Bs') {
    const t = Number(tasa);
    return t > 0 ? redondear(valor / t) : 0;
  }
  return redondear(valor);
};

// Estado de la cuenta a una fecha. Los pagos se aplican a los cargos más antiguos primero.
export const estadoCuenta = (cuenta, hoy = hoyIso()) => {
  const cargos = [...(cuenta?.cargos || [])].sort((a, b) =>
    (a.fecha || '').localeCompare(b.fecha || '') || String(a.id).localeCompare(String(b.id)));
  const pagos = cuenta?.pagos || [];

  const totalCargos = redondear(cargos.reduce((s, c) => s + Number(c.montoUSD || 0), 0));
  const totalPagado = redondear(pagos.reduce((s, p) => s + Number(p.montoUSD || 0), 0));

  let disponible = totalPagado;
  const detalle = cargos.map(c => {
    const monto = redondear(c.montoUSD || 0);
    const pagado = redondear(Math.min(monto, Math.max(0, disponible)));
    disponible = redondear(disponible - pagado);
    const pendiente = redondear(monto - pagado);
    const vencido = pendiente > 0 && Boolean(c.vence) && c.vence < hoy;
    const estado = pendiente <= 0 ? 'pagado' : pagado > 0 ? 'parcial' : 'pendiente';
    return { ...c, montoUSD: monto, pagado, pendiente, vencido, estado };
  });

  const saldo = redondear(Math.max(0, totalCargos - totalPagado));
  const saldoAFavor = redondear(Math.max(0, totalPagado - totalCargos));
  const montoAtrasado = redondear(detalle.filter(c => c.vencido).reduce((s, c) => s + c.pendiente, 0));
  const proximoVencimiento = detalle
    .filter(c => c.pendiente > 0 && c.vence && c.vence >= hoy)
    .map(c => c.vence)
    .sort()[0] || null;

  let estado = 'sin_cargos';
  if (cargos.length > 0) estado = montoAtrasado > 0 ? 'atrasado' : saldo > 0 ? 'pendiente' : 'al_dia';

  return { cargos: detalle, totalCargos, totalPagado, saldo, saldoAFavor, montoAtrasado, proximoVencimiento, estado };
};

export const ESTADO_CUENTA = {
  sin_cargos: { etiqueta: 'Sin cargos', tono: 'neutro' },
  al_dia: { etiqueta: 'Al día', tono: 'ok' },
  pendiente: { etiqueta: 'Saldo pendiente', tono: 'aviso' },
  atrasado: { etiqueta: 'Pago atrasado', tono: 'alerta' },
};
