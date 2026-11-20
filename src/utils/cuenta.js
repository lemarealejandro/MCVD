// Cuenta del paciente: cargos (lo que debe) y pagos (lo que pagó).
// Se guarda en la ficha (`patient.cuenta`), separada del presupuesto, porque el
// presupuesto vence y se renueva y los pagos no deben perderse.
// Funciones puras; los montos se manejan en USD.
//
// Cargo: { id, fecha, vence, descripcion, montoUSD, presupuestoId?, itemRef?, unidad?,
//          realizado?, realizadoEn?, tratamientoId? }
// Pago:  { id, fecha, forma, moneda, montoUSD, montoBs?, tasa?, referencia, nota,
//          aplicaciones?: [{ cargoId, montoUSD }], registradoPor, registradoEn }

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

export const redondear = (n) => Math.round(Number(n) * 100) / 100;

export const cuentaVacia = () => ({ cargos: [], pagos: [] });

export const sumarDias = (fechaIso, dias) => {
  const d = new Date(`${fechaIso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const hoyIso = (ahora = new Date()) => {
  const d = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};

// --- Presupuesto → cargos -------------------------------------------------
// Cada unidad de cada procedimiento es un cargo propio ("Resina × 2" → 2 cargos),
// porque pueden realizarse y pagarse en momentos distintos. Se numeran "#1", "#2"…
// (no "1/2"), para que la etiqueta no cambie si después sube la cantidad.

const refItem = (presupuestoId, item) => `${presupuestoId}:${item.id}`;

// Unidades del presupuesto que todavía no están en la cuenta.
export const unidadesSinPasar = (presupuesto, cuenta) => {
  if (!presupuesto) return [];
  const cargos = cuenta?.cargos || [];
  const faltan = [];
  (presupuesto.items || []).forEach(item => {
    const ref = refItem(presupuesto.id, item);
    const yaPasadas = new Set(cargos.filter(c => c.itemRef === ref).map(c => c.unidad));
    const qty = Math.max(1, Number(item.qty) || 1);
    for (let unidad = 1; unidad <= qty; unidad++) {
      if (!yaPasadas.has(unidad)) faltan.push({ item, unidad, qty });
    }
  });
  return faltan;
};

export const presupuestoEnCuenta = (cuenta, presupuesto) =>
  Boolean(presupuesto) && unidadesSinPasar(presupuesto, cuenta).length === 0;

// Cargos nuevos para las unidades que faltan pasar.
export const cargosDesdePresupuesto = (presupuesto, cuenta, { fecha, vence, nuevoId }) =>
  unidadesSinPasar(presupuesto, cuenta).map(({ item, unidad, qty }, i) => ({
    id: nuevoId(i),
    fecha,
    vence: vence || null,
    descripcion: qty > 1 || unidad > 1 ? `${item.name} #${unidad}` : item.name,
    montoUSD: redondear(item.priceUSD),
    presupuestoId: presupuesto.id,
    itemRef: refItem(presupuesto.id, item),
    unidad,
    realizado: false,
  }));

// --- Pagos ------------------------------------------------------------------

// Monto en USD de un pago. En bolívares: monto / tasa.
export const montoPagoUSD = ({ moneda, monto, tasa }) => {
  const valor = Number(monto);
  if (!(valor > 0)) return 0;
  if (moneda === 'Bs') {
    const t = Number(tasa);
    return t > 0 ? redondear(valor / t) : 0;
  }
  return redondear(valor);
};

// Reparte un pago entre los cargos elegidos (del más antiguo al más nuevo).
// `pendientes` es un mapa cargoId → monto que falta. Lo que sobra queda sin asignar.
export const asignarPago = (cargosElegidos, pendientes, montoUSD) => {
  let resto = redondear(montoUSD);
  const aplicaciones = [];
  [...cargosElegidos]
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
    .forEach(c => {
      const falta = redondear(pendientes[c.id] ?? 0);
      const monto = redondear(Math.min(falta, resto));
      if (monto > 0) {
        aplicaciones.push({ cargoId: c.id, montoUSD: monto });
        resto = redondear(resto - monto);
      }
    });
  return aplicaciones;
};

// --- Estado de la cuenta ----------------------------------------------------
// 1) Cada pago cubre primero los cargos que se eligieron al registrarlo.
// 2) Lo que sobra de cada pago (o los pagos sin elección) se aplica a los cargos
//    más antiguos que sigan pendientes.
export const estadoCuenta = (cuenta, hoy = hoyIso()) => {
  // Orden estable: por fecha y, el mismo día, en el orden en que se agregaron.
  const cargos = [...(cuenta?.cargos || [])].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const pagos = [...(cuenta?.pagos || [])].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

  const pendiente = Object.fromEntries(cargos.map(c => [c.id, redondear(c.montoUSD || 0)]));
  const cubiertoPor = Object.fromEntries(cargos.map(c => [c.id, []]));
  const anotar = (cargoId, pago, monto) => {
    pendiente[cargoId] = redondear(pendiente[cargoId] - monto);
    const previo = cubiertoPor[cargoId].find(x => x.pagoId === pago.id);
    if (previo) previo.montoUSD = redondear(previo.montoUSD + monto);
    else cubiertoPor[cargoId].push({ pagoId: pago.id, fecha: pago.fecha, forma: pago.forma, montoUSD: monto });
  };

  // 1) Asignaciones elegidas.
  const sobrantes = pagos.map(p => {
    let resto = redondear(p.montoUSD || 0);
    (p.aplicaciones || []).forEach(a => {
      if (!(a.cargoId in pendiente)) return; // cargo eliminado: vuelve al sobrante
      const monto = redondear(Math.min(a.montoUSD, pendiente[a.cargoId], resto));
      if (monto > 0) { anotar(a.cargoId, p, monto); resto = redondear(resto - monto); }
    });
    return { pago: p, resto };
  });

  // 2) Sobrantes a lo más antiguo.
  sobrantes.forEach(({ pago, resto }) => {
    let disponible = resto;
    for (const c of cargos) {
      if (disponible <= 0) break;
      const monto = redondear(Math.min(pendiente[c.id], disponible));
      if (monto > 0) { anotar(c.id, pago, monto); disponible = redondear(disponible - monto); }
    }
  });

  const detalle = cargos.map(c => {
    const monto = redondear(c.montoUSD || 0);
    const falta = redondear(Math.max(0, pendiente[c.id]));
    const pagado = redondear(monto - falta);
    const vencido = falta > 0 && Boolean(c.vence) && c.vence < hoy;
    const estado = falta <= 0 ? 'pagado' : pagado > 0 ? 'parcial' : 'pendiente';
    return { ...c, montoUSD: monto, pagado, pendiente: falta, vencido, estado, cubiertoPor: cubiertoPor[c.id] };
  });

  const totalCargos = redondear(detalle.reduce((s, c) => s + c.montoUSD, 0));
  const totalPagado = redondear(pagos.reduce((s, p) => s + Number(p.montoUSD || 0), 0));
  const saldo = redondear(detalle.reduce((s, c) => s + c.pendiente, 0));
  const saldoAFavor = redondear(Math.max(0, totalPagado - (totalCargos - saldo)));
  const montoAtrasado = redondear(detalle.filter(c => c.vencido).reduce((s, c) => s + c.pendiente, 0));
  const proximoVencimiento = detalle
    .filter(c => c.pendiente > 0 && c.vence && c.vence >= hoy)
    .map(c => c.vence)
    .sort()[0] || null;
  const realizados = detalle.filter(c => c.realizado).length;
  const realizadosSinPagar = detalle.filter(c => c.realizado && c.pendiente > 0).length;

  let estado = 'sin_cargos';
  if (detalle.length > 0) estado = montoAtrasado > 0 ? 'atrasado' : saldo > 0 ? 'pendiente' : 'al_dia';

  return {
    cargos: detalle, totalCargos, totalPagado, saldo, saldoAFavor, montoAtrasado,
    proximoVencimiento, realizados, realizadosSinPagar, estado,
  };
};

export const ESTADO_CUENTA = {
  sin_cargos: { etiqueta: 'Sin cargos', tono: 'neutro' },
  al_dia: { etiqueta: 'Al día', tono: 'ok' },
  pendiente: { etiqueta: 'Saldo pendiente', tono: 'aviso' },
  atrasado: { etiqueta: 'Pago atrasado', tono: 'alerta' },
};

// --- Realizado ↔ historial de tratamientos -----------------------------------
// Marca o desmarca un cargo como realizado y mantiene sincronizado el historial
// (`patient.treatments`). Devuelve el paciente actualizado.
export const marcarRealizado = (patient, cargoId, realizado, { fecha, doctor, nuevoId }) => {
  const cuenta = patient.cuenta || cuentaVacia();
  const cargo = cuenta.cargos.find(c => c.id === cargoId);
  if (!cargo) return patient;
  let treatments = patient.treatments || [];
  let cambios;

  if (realizado) {
    const tratamientoId = cargo.tratamientoId && treatments.some(t => t.id === cargo.tratamientoId)
      ? cargo.tratamientoId
      : nuevoId();
    if (!treatments.some(t => t.id === tratamientoId)) {
      treatments = [...treatments, {
        id: tratamientoId,
        date: fecha,
        procedure: cargo.descripcion,
        tooth: '-',
        doctor: doctor || '',
        notes: 'Registrado desde Pagos',
        priceUSD: cargo.montoUSD,
        cargoId: cargo.id,
      }];
    }
    cambios = { realizado: true, realizadoEn: fecha, tratamientoId };
  } else {
    treatments = treatments.filter(t => t.id !== cargo.tratamientoId);
    cambios = { realizado: false, realizadoEn: null, tratamientoId: null };
  }

  return {
    ...patient,
    treatments,
    cuenta: { ...cuenta, cargos: cuenta.cargos.map(c => (c.id === cargoId ? { ...c, ...cambios } : c)) },
  };
};

// Si se borra del historial un tratamiento enlazado a un cargo, el cargo deja de estar realizado.
export const quitarTratamiento = (patient, tratamientoId) => {
  const treatments = (patient.treatments || []).filter(t => t.id !== tratamientoId);
  const cuenta = patient.cuenta;
  if (!cuenta) return { ...patient, treatments };
  return {
    ...patient,
    treatments,
    cuenta: {
      ...cuenta,
      cargos: cuenta.cargos.map(c => (c.tratamientoId === tratamientoId
        ? { ...c, realizado: false, realizadoEn: null, tratamientoId: null }
        : c)),
    },
  };
};
