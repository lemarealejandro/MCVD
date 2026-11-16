import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Calendar, Users, Receipt, Wallet, FlaskConical, AlertTriangle } from 'lucide-react';
import { usePersistentState } from '../../utils/usePersistentState';
import { localDateStr } from '../../utils/date';
import { downloadCsv } from '../../utils/csv';
import { money } from '../../utils/format';
import { SUCURSALES_KEY, sucursalNombre } from '../../utils/sucursales';
import { LIQUIDACIONES_KEY, ESTADOS_LAB } from '../../data/proConfig';

const primerDiaDelMes = () => {
  const hoy = new Date();
  return localDateStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
};

const Reportes = () => {
  const { appointments, patients, inventory } = useOutletContext();
  const [sucursales] = usePersistentState(SUCURSALES_KEY, []);
  const [gastos] = usePersistentState('clinicplus_gastos', []);
  const [laboratorio] = usePersistentState('clinicplus_laboratorio', []);
  const [liquidaciones] = usePersistentState(LIQUIDACIONES_KEY, []);

  const [desde, setDesde] = useState(primerDiaDelMes);
  const [hasta, setHasta] = useState(() => localDateStr());
  const [sucursal, setSucursal] = useState('');

  const enRango = (fecha) => fecha >= desde && fecha <= hasta;
  const enSucursal = (r) => !sucursal || String(r.sucursalId) === sucursal;

  // Las citas no tienen sucursal asignada todavía: el filtro de sucursal no las afecta.
  const citas = appointments.filter(a => enRango(a.date));
  const gastosF = gastos.filter(g => enRango(g.fecha) && enSucursal(g));
  const labF = laboratorio.filter(l => enRango(l.fecha) && enSucursal(l));
  const liqF = liquidaciones.filter(l => enRango(l.periodo) && enSucursal(l));

  const cuenta = (lista, estado) => lista.filter(c => c.status === estado).length;
  const pacientes = Object.values(patients || {}).length;
  const stockBajo = inventory.filter(i => Number(i.quantity) <= Number(i.minStock));
  const sumar = (lista, campo) => lista.reduce((total, r) => total + Number(r[campo] || 0), 0);

  const totalGastos = sumar(gastosF, 'monto');
  const totalLiquidado = sumar(liqF, 'monto');
  const pendienteLiquidar = sumar(liqF.filter(l => l.estado !== 'Pagada'), 'monto');
  const labEnCurso = labF.filter(l => l.estado === 'Enviado' || l.estado === 'En proceso').length;

  const porCategoria = gastosF.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.monto || 0);
    return acc;
  }, {});

  const porProfesional = liqF.reduce((acc, l) => {
    const fila = acc[l.profesional] || { honorarios: 0, monto: 0, cantidad: 0 };
    acc[l.profesional] = {
      honorarios: fila.honorarios + Number(l.honorarios || 0),
      monto: fila.monto + Number(l.monto || 0),
      cantidad: fila.cantidad + 1,
    };
    return acc;
  }, {});

  const exportarCitas = () => downloadCsv('citas.csv',
    ['Fecha', 'Hora', 'Paciente', 'Servicio', 'Profesional', 'Estado'],
    citas.map(a => [a.date, a.time, a.patient, a.service, a.doctor, a.status]));

  const exportarGastos = () => downloadCsv('gastos.csv',
    ['Fecha', 'Categoría', 'Descripción', 'Sucursal', 'Monto'],
    gastosF.map(g => [g.fecha, g.categoria, g.descripcion, sucursalNombre(sucursales, g.sucursalId), Number(g.monto).toFixed(2)]));

  const exportarLab = () => downloadCsv('laboratorio.csv',
    ['Fecha', 'Paciente', 'Trabajo', 'Laboratorio', 'Estado', 'Sucursal', 'Costo'],
    labF.map(l => [l.fecha, l.paciente, l.trabajo, l.laboratorio, l.estado, sucursalNombre(sucursales, l.sucursalId), Number(l.costo).toFixed(2)]));

  const exportarLiquidaciones = () => downloadCsv('liquidaciones.csv',
    ['Periodo', 'Profesional', 'Sucursal', 'Honorarios', 'Liquidación (%)', 'Monto liquidado', 'Estado'],
    liqF.map(l => [l.periodo, l.profesional, sucursalNombre(sucursales, l.sucursalId), Number(l.honorarios).toFixed(2), l.porcentaje, Number(l.monto).toFixed(2), l.estado]));

  const exportarInventario = () => downloadCsv('inventario.csv',
    ['Artículo', 'Categoría', 'Stock', 'Stock mínimo', 'Precio ($)'],
    inventory.map(i => [i.item, i.category, i.quantity, i.minStock, Number(i.priceUsd).toFixed(2)]));

  const stats = [
    { icon: <Calendar size={20} />, label: 'Citas en el periodo', value: citas.length, sub: `${cuenta(citas, 'Confirmada')} confirmadas · ${cuenta(citas, 'Cancelada')} canceladas` },
    { icon: <Users size={20} />, label: 'Pacientes registrados', value: pacientes },
    { icon: <Receipt size={20} />, label: 'Gastos del periodo', value: money(totalGastos), sub: `${gastosF.length} registros` },
    { icon: <Wallet size={20} />, label: 'Liquidado a profesionales', value: money(totalLiquidado), sub: `${money(pendienteLiquidar)} pendiente de pago` },
    { icon: <FlaskConical size={20} />, label: 'Laboratorio en curso', value: labEnCurso, sub: `${labF.length} órdenes en el periodo` },
    { icon: <AlertTriangle size={20} />, label: 'Inventario bajo mínimo', value: stockBajo.length },
  ];

  return (
    <div className="cms-page">
      <div className="page-header">
        <h2 className="dashboard-title">Reportes de gestión</h2>
        <p className="text-secondary">Indicadores del periodo y exportación a Excel.</p>
      </div>

      <div className="settings-card" style={{ marginBottom: '1rem' }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rep-desde">Desde</label>
            <input id="rep-desde" type="date" className="form-input" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rep-hasta">Hasta</label>
            <input id="rep-hasta" type="date" className="form-input" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div className="field field-full">
            <label htmlFor="rep-sucursal">Sucursal</label>
            <select id="rep-sucursal" className="form-input" value={sucursal} onChange={e => setSucursal(e.target.value)}>
              <option value="">Todas las sucursales</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
              {s.sub && <p className="text-secondary">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="settings-grid" style={{ marginTop: '1.5rem' }}>
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Gastos por categoría</h3>
            <button className="btn" onClick={exportarGastos} disabled={gastosF.length === 0}><Download size={16} /> Excel</button>
          </div>
          {Object.keys(porCategoria).length === 0
            ? <p className="text-secondary">Sin gastos en el periodo.</p>
            : Object.entries(porCategoria).map(([cat, monto]) => (
              <p key={cat}>{cat}: <strong>{money(monto)}</strong></p>
            ))}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Liquidaciones por profesional</h3>
            <button className="btn" onClick={exportarLiquidaciones} disabled={liqF.length === 0}><Download size={16} /> Excel</button>
          </div>
          {Object.keys(porProfesional).length === 0
            ? <p className="text-secondary">Sin liquidaciones en el periodo.</p>
            : Object.entries(porProfesional).map(([nombre, f]) => (
              <p key={nombre}>{nombre}: <strong>{money(f.monto)}</strong> sobre {money(f.honorarios)} ({f.cantidad})</p>
            ))}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Laboratorio por estado</h3>
            <button className="btn" onClick={exportarLab} disabled={labF.length === 0}><Download size={16} /> Excel</button>
          </div>
          {ESTADOS_LAB.map(estado => (
            <p key={estado}>{estado}: <strong>{labF.filter(l => l.estado === estado).length}</strong></p>
          ))}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Exportar datos</h3>
          </div>
          <div className="header-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <button className="btn" onClick={exportarCitas} disabled={citas.length === 0}><Download size={16} /> Citas</button>
            <button className="btn" onClick={exportarInventario} disabled={inventory.length === 0}><Download size={16} /> Inventario</button>
            <button className="btn" onClick={exportarGastos} disabled={gastosF.length === 0}><Download size={16} /> Gastos</button>
            <button className="btn" onClick={exportarLab} disabled={labF.length === 0}><Download size={16} /> Laboratorio</button>
            <button className="btn" onClick={exportarLiquidaciones} disabled={liqF.length === 0}><Download size={16} /> Liquidaciones</button>
          </div>
          <p className="text-secondary" style={{ marginTop: '0.75rem' }}>
            Las citas no están asociadas a sucursal, así que no se filtran por sede.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
