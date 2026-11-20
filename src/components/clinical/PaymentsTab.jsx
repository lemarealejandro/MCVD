import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, Plus, Trash2, Wallet } from 'lucide-react';
import {
  DIAS_PLAZO_POR_DEFECTO, ESTADO_CUENTA, FORMAS_DE_PAGO, FORMAS_EN_BS,
  cargosDesdePresupuesto, cuentaVacia, estadoCuenta, hoyIso, montoPagoUSD, presupuestoEnCuenta, sumarDias,
} from '../../utils/cuenta';
import { formatearFechaHora, presupuestoVencido, totalPresupuesto } from '../../utils/presupuesto';
import { getUserEmail } from '../../utils/auth';

const usd = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const bs = (n) => `Bs ${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const nuevoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ESTADO_CARGO = { pagado: 'Pagado', parcial: 'Abonado', pendiente: 'Pendiente' };

// Banner de estado de la cuenta (también lo usa la cabecera del paciente).
export const EstadoCuentaAviso = ({ resumen, compacto = false }) => {
  const info = ESTADO_CUENTA[resumen.estado];
  const Icono = resumen.estado === 'al_dia' ? CheckCircle2 : resumen.estado === 'atrasado' ? AlertTriangle : resumen.estado === 'pendiente' ? Clock : Wallet;
  if (compacto) {
    return <span className={`pay-chip ${info.tono}`}><Icono size={14} /> {info.etiqueta}{resumen.saldo > 0 ? ` · ${usd(resumen.saldo)}` : ''}</span>;
  }
  let detalle = 'Todavía no hay cargos registrados para este paciente.';
  if (resumen.estado === 'al_dia') detalle = resumen.saldoAFavor > 0 ? `Pagó todo. Tiene ${usd(resumen.saldoAFavor)} a favor.` : 'No debe nada.';
  if (resumen.estado === 'pendiente') detalle = `Debe ${usd(resumen.saldo)}${resumen.proximoVencimiento ? `. Próximo vencimiento: ${fecha(resumen.proximoVencimiento)}` : ''}.`;
  if (resumen.estado === 'atrasado') detalle = `Tiene ${usd(resumen.montoAtrasado)} vencido sin pagar. Saldo total: ${usd(resumen.saldo)}.`;
  return (
    <div className={`pay-banner ${info.tono}`} role="status">
      <Icono size={22} />
      <div><strong>{info.etiqueta}</strong><span>{detalle}</span></div>
    </div>
  );
};

const PaymentsTab = ({ patient, patientId, patients, setPatients }) => {
  const cuenta = patient.cuenta || cuentaVacia();
  const resumen = useMemo(() => estadoCuenta(cuenta), [cuenta]);
  const presupuesto = patient.presupuesto || null;
  const tasaSugerida = presupuesto?.tasa ?? 40;

  const [vencePresupuesto, setVencePresupuesto] = useState(() => sumarDias(hoyIso(), DIAS_PLAZO_POR_DEFECTO));
  const [mostrarCargo, setMostrarCargo] = useState(false);
  const [cargo, setCargo] = useState({ descripcion: '', montoUSD: '', vence: '' });
  const [mostrarPago, setMostrarPago] = useState(false);
  const [pago, setPago] = useState({ fecha: hoyIso(), forma: FORMAS_DE_PAGO[0], moneda: 'USD', monto: '', tasa: String(tasaSugerida), referencia: '', nota: '' });
  const [confirmarBorrado, setConfirmarBorrado] = useState(null); // { tipo, id }
  const [error, setError] = useState('');

  const guardar = (siguiente) => setPatients({ ...patients, [patientId]: { ...patient, cuenta: siguiente } });

  const yaEnCuenta = presupuestoEnCuenta(cuenta, presupuesto?.id);
  const presupuestoVencidoAhora = presupuestoVencido(presupuesto);

  const pasarPresupuesto = () => {
    if (!presupuesto || yaEnCuenta) return;
    const hoy = hoyIso();
    const nuevos = cargosDesdePresupuesto(presupuesto, { fecha: hoy, vence: vencePresupuesto, nuevoId: () => nuevoId() });
    guardar({ ...cuenta, cargos: [...cuenta.cargos, ...nuevos] });
  };

  const agregarCargo = (e) => {
    e.preventDefault();
    const monto = Number(cargo.montoUSD);
    if (!cargo.descripcion.trim() || !(monto > 0)) { setError('Escribe una descripción y un monto mayor que cero.'); return; }
    setError('');
    guardar({ ...cuenta, cargos: [...cuenta.cargos, { id: nuevoId(), fecha: hoyIso(), vence: cargo.vence || null, descripcion: cargo.descripcion.trim(), montoUSD: Math.round(monto * 100) / 100 }] });
    setCargo({ descripcion: '', montoUSD: '', vence: '' });
    setMostrarCargo(false);
  };

  const cambiarForma = (forma) => setPago(p => ({ ...p, forma, moneda: FORMAS_EN_BS.includes(forma) ? 'Bs' : 'USD' }));
  const montoUSDPago = montoPagoUSD(pago);

  const registrarPago = (e) => {
    e.preventDefault();
    if (!(montoUSDPago > 0)) { setError(pago.moneda === 'Bs' ? 'Escribe el monto en Bs y la tasa del día.' : 'Escribe un monto mayor que cero.'); return; }
    setError('');
    const registro = {
      id: nuevoId(),
      fecha: pago.fecha || hoyIso(),
      forma: pago.forma,
      moneda: pago.moneda,
      montoUSD: montoUSDPago,
      ...(pago.moneda === 'Bs' ? { montoBs: Number(pago.monto), tasa: Number(pago.tasa) } : {}),
      referencia: pago.referencia.trim(),
      nota: pago.nota.trim(),
      registradoPor: getUserEmail() || '',
      registradoEn: new Date().toISOString(),
    };
    guardar({ ...cuenta, pagos: [...cuenta.pagos, registro] });
    setPago(p => ({ ...p, monto: '', referencia: '', nota: '', fecha: hoyIso() }));
    setMostrarPago(false);
  };

  const borrar = () => {
    if (!confirmarBorrado) return;
    const { tipo, id } = confirmarBorrado;
    guardar({ ...cuenta, [tipo]: cuenta[tipo].filter(x => x.id !== id) });
    setConfirmarBorrado(null);
  };

  const pagosOrdenados = [...cuenta.pagos].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const totalPresupuestoUSD = presupuesto ? totalPresupuesto(presupuesto.items, presupuesto.tasa).usd : 0;

  return (
    <div className="pay-layout">
      <EstadoCuentaAviso resumen={resumen} />

      <div className="pay-totals">
        <div><span>Total cargado</span><strong>{usd(resumen.totalCargos)}</strong></div>
        <div><span>Pagado</span><strong className="ok-text">{usd(resumen.totalPagado)}</strong></div>
        <div><span>Saldo pendiente</span><strong className={resumen.saldo > 0 ? 'warn-text' : ''}>{usd(resumen.saldo)}</strong></div>
      </div>

      {error && <p className="pay-error" role="alert">{error}</p>}

      {/* Presupuesto → cuenta */}
      {presupuesto && !yaEnCuenta && (
        <div className="pay-card pay-presupuesto">
          <div>
            <h4><FileText size={18} /> Presupuesto sin pasar a la cuenta</h4>
            <p>{presupuesto.items.length} procedimiento(s) por <strong>{usd(totalPresupuestoUSD)}</strong>, creado el {formatearFechaHora(presupuesto.creadoEn)}.
              {presupuestoVencidoAhora && ' Está vencido: renuévalo en Tratamientos si los precios cambiaron.'}</p>
          </div>
          <div className="pay-presupuesto-actions">
            <label htmlFor="vence-presupuesto">Fecha límite de pago</label>
            <input id="vence-presupuesto" type="date" className="form-input" value={vencePresupuesto} onChange={e => setVencePresupuesto(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={pasarPresupuesto}>Pasar a la cuenta</button>
          </div>
        </div>
      )}

      {/* Lo que debe */}
      <section className="pay-card">
        <div className="pay-card-head">
          <h3>Lo que debe</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarCargo(v => !v)}><Plus size={16} /> Agregar cargo</button>
        </div>

        {mostrarCargo && (
          <form className="pay-form" onSubmit={agregarCargo}>
            <div className="pay-field grow"><label htmlFor="cargo-desc">Descripción</label><input id="cargo-desc" className="form-input" value={cargo.descripcion} onChange={e => setCargo({ ...cargo, descripcion: e.target.value })} placeholder="Ej: Consulta de control" /></div>
            <div className="pay-field"><label htmlFor="cargo-monto">Monto (USD)</label><input id="cargo-monto" type="number" min="0" step="0.01" className="form-input" value={cargo.montoUSD} onChange={e => setCargo({ ...cargo, montoUSD: e.target.value })} /></div>
            <div className="pay-field"><label htmlFor="cargo-vence">Fecha límite (opcional)</label><input id="cargo-vence" type="date" className="form-input" value={cargo.vence} onChange={e => setCargo({ ...cargo, vence: e.target.value })} /></div>
            <div className="pay-form-actions"><button type="submit" className="btn btn-primary btn-sm">Guardar cargo</button><button type="button" className="btn btn-sm" onClick={() => setMostrarCargo(false)}>Cancelar</button></div>
          </form>
        )}

        {resumen.cargos.length === 0 ? (
          <p className="pay-empty">Sin cargos. Pasa el presupuesto a la cuenta o agrega un cargo.</p>
        ) : (
          <div className="pay-table-wrap">
            <table className="pay-table">
              <thead><tr><th>Concepto</th><th>Fecha límite</th><th className="num">Monto</th><th className="num">Pagado</th><th className="num">Debe</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
              <tbody>
                {resumen.cargos.map(c => (
                  <tr key={c.id} className={c.vencido ? 'row-late' : ''}>
                    <td>{c.descripcion}<div className="pay-sub">Cargado el {fecha(c.fecha)}</div></td>
                    <td className={c.vencido ? 'warn-text' : ''}>{fecha(c.vence)}{c.vencido && <div className="pay-sub">Vencido</div>}</td>
                    <td className="num">{usd(c.montoUSD)}</td>
                    <td className="num">{usd(c.pagado)}</td>
                    <td className="num"><strong>{usd(c.pendiente)}</strong></td>
                    <td><span className={`pay-pill ${c.vencido ? 'late' : c.estado}`}>{c.vencido ? 'Atrasado' : ESTADO_CARGO[c.estado]}</span></td>
                    <td><button type="button" className="pay-icon" aria-label={`Eliminar cargo ${c.descripcion}`} onClick={() => setConfirmarBorrado({ tipo: 'cargos', id: c.id, texto: c.descripcion })}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="pay-note">Los pagos se descuentan de los cargos más antiguos primero.</p>
      </section>

      {/* Lo que ha pagado */}
      <section className="pay-card">
        <div className="pay-card-head">
          <h3>Pagos recibidos</h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setMostrarPago(v => !v)}><Plus size={16} /> Registrar pago</button>
        </div>

        {mostrarPago && (
          <form className="pay-form" onSubmit={registrarPago}>
            <div className="pay-field"><label htmlFor="pago-fecha">Fecha</label><input id="pago-fecha" type="date" className="form-input" value={pago.fecha} onChange={e => setPago({ ...pago, fecha: e.target.value })} /></div>
            <div className="pay-field"><label htmlFor="pago-forma">Forma de pago</label>
              <select id="pago-forma" className="form-input" value={pago.forma} onChange={e => cambiarForma(e.target.value)}>
                {FORMAS_DE_PAGO.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="pay-field"><label htmlFor="pago-moneda">Moneda</label>
              <select id="pago-moneda" className="form-input" value={pago.moneda} onChange={e => setPago({ ...pago, moneda: e.target.value })}>
                <option value="USD">USD</option><option value="Bs">Bs</option>
              </select>
            </div>
            <div className="pay-field"><label htmlFor="pago-monto">Monto ({pago.moneda})</label><input id="pago-monto" type="number" min="0" step="0.01" className="form-input" value={pago.monto} onChange={e => setPago({ ...pago, monto: e.target.value })} /></div>
            {pago.moneda === 'Bs' && (
              <div className="pay-field"><label htmlFor="pago-tasa">Tasa (Bs por USD)</label><input id="pago-tasa" type="number" min="0" step="0.01" className="form-input" value={pago.tasa} onChange={e => setPago({ ...pago, tasa: e.target.value })} /></div>
            )}
            <div className="pay-field"><label htmlFor="pago-ref">Referencia (opcional)</label><input id="pago-ref" className="form-input" value={pago.referencia} onChange={e => setPago({ ...pago, referencia: e.target.value })} placeholder="N.º de operación" /></div>
            <div className="pay-field grow"><label htmlFor="pago-nota">Nota (opcional)</label><input id="pago-nota" className="form-input" value={pago.nota} onChange={e => setPago({ ...pago, nota: e.target.value })} /></div>
            <div className="pay-form-actions">
              {pago.moneda === 'Bs' && montoUSDPago > 0 && <span className="pay-sub">Equivale a {usd(montoUSDPago)}</span>}
              <button type="submit" className="btn btn-primary btn-sm">Guardar pago</button>
              <button type="button" className="btn btn-sm" onClick={() => setMostrarPago(false)}>Cancelar</button>
            </div>
          </form>
        )}

        {pagosOrdenados.length === 0 ? (
          <p className="pay-empty">Todavía no hay pagos registrados.</p>
        ) : (
          <div className="pay-table-wrap">
            <table className="pay-table">
              <thead><tr><th>Fecha</th><th>Forma de pago</th><th>Referencia</th><th className="num">Monto</th><th aria-label="Acciones" /></tr></thead>
              <tbody>
                {pagosOrdenados.map(p => (
                  <tr key={p.id}>
                    <td>{fecha(p.fecha)}{p.registradoPor && <div className="pay-sub">por {p.registradoPor}</div>}</td>
                    <td>{p.forma}{p.nota && <div className="pay-sub">{p.nota}</div>}</td>
                    <td>{p.referencia || '—'}</td>
                    <td className="num"><strong>{usd(p.montoUSD)}</strong>{p.moneda === 'Bs' && <div className="pay-sub">{bs(p.montoBs)} a {p.tasa}</div>}</td>
                    <td><button type="button" className="pay-icon" aria-label="Eliminar pago" onClick={() => setConfirmarBorrado({ tipo: 'pagos', id: p.id, texto: `pago de ${usd(p.montoUSD)}` })}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmarBorrado && (
        <div className="pay-confirm" role="alertdialog" aria-label="Confirmar eliminación">
          <span>¿Eliminar {confirmarBorrado.tipo === 'cargos' ? `el cargo "${confirmarBorrado.texto}"` : `el ${confirmarBorrado.texto}`}? El saldo se recalcula.</span>
          <div><button type="button" className="btn btn-sm pay-danger" onClick={borrar}>Eliminar</button><button type="button" className="btn btn-sm" onClick={() => setConfirmarBorrado(null)}>Cancelar</button></div>
        </div>
      )}

      <style>{`
        .pay-layout { display: flex; flex-direction: column; gap: 1.25rem; }
        .pay-banner { display: flex; gap: 0.85rem; align-items: center; padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid; }
        .pay-banner div { display: flex; flex-direction: column; gap: 0.15rem; }
        .pay-banner strong { font-size: 1.05rem; }
        .pay-banner.ok, .pay-chip.ok { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .pay-banner.aviso, .pay-chip.aviso { background: #fffbeb; border-color: #fde68a; color: #92400e; }
        .pay-banner.alerta, .pay-chip.alerta { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        .pay-banner.neutro, .pay-chip.neutro { background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-secondary); }
        .pay-chip { display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid; border-radius: 999px; padding: 0.2rem 0.65rem; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }

        .pay-totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
        .pay-totals div { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .pay-totals span { color: var(--text-secondary); font-size: 0.85rem; }
        .pay-totals strong { font-size: 1.35rem; font-variant-numeric: tabular-nums; }
        .ok-text { color: #166534; }
        .warn-text { color: #b45309; }
        .row-late .warn-text { color: #b91c1c; }

        .pay-card { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; min-width: 0; }
        .pay-card-head { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .pay-card-head h3 { font-size: 1.1rem; margin: 0; }
        .pay-presupuesto { flex-direction: row; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; background: #eff6ff; border-color: #bfdbfe; }
        .pay-presupuesto h4 { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.3rem; color: #1e40af; }
        .pay-presupuesto p { margin: 0; color: #1e3a8a; font-size: 0.92rem; max-width: 60ch; }
        .pay-presupuesto-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .pay-presupuesto-actions label { font-size: 0.85rem; color: #1e3a8a; }
        .pay-presupuesto-actions .form-input { width: auto; }

        .pay-form { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; padding: 0.9rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); }
        .pay-field { display: flex; flex-direction: column; gap: 0.3rem; flex: 0 1 170px; min-width: 0; }
        .pay-field.grow { flex: 1 1 240px; }
        .pay-field label { font-size: 0.82rem; color: var(--text-secondary); font-weight: 500; }
        .pay-form-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-left: auto; }

        .pay-table-wrap { overflow-x: auto; }
        .pay-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
        .pay-table th { text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); font-weight: 600; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
        .pay-table td { padding: 0.65rem 0.6rem; border-bottom: 1px solid var(--border-color); vertical-align: top; }
        .pay-table tr:last-child td { border-bottom: 0; }
        .pay-table .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .pay-sub { font-size: 0.78rem; color: var(--text-tertiary); margin-top: 0.1rem; }
        .row-late { background: #fef2f2; }

        .pay-pill { display: inline-block; padding: 0.1rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
        .pay-pill.pagado { background: #dcfce7; color: #166534; }
        .pay-pill.parcial { background: #e0f2fe; color: #075985; }
        .pay-pill.pendiente { background: #fef3c7; color: #92400e; }
        .pay-pill.late { background: #fee2e2; color: #991b1b; }

        .pay-icon { border: 0; background: transparent; color: var(--text-tertiary); cursor: pointer; padding: 0.25rem; border-radius: 6px; }
        .pay-icon:hover { color: #dc2626; background: #fef2f2; }
        .pay-empty { color: var(--text-secondary); margin: 0; }
        .pay-note { color: var(--text-tertiary); font-size: 0.8rem; margin: 0; }
        .pay-error { margin: 0; padding: 0.65rem 0.9rem; border-radius: var(--radius-md); background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .pay-confirm { position: sticky; bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; border-radius: var(--radius-md); background: var(--bg-primary); border: 1px solid #fecaca; box-shadow: var(--shadow-md); }
        .pay-confirm div { display: flex; gap: 0.5rem; }
        .pay-danger { background: #dc2626; color: #fff; border-color: #dc2626; }
        @media (max-width: 600px) { .pay-form-actions { margin-left: 0; } .pay-presupuesto-actions .form-input { width: 100%; } }
      `}</style>
    </div>
  );
};

export default PaymentsTab;
