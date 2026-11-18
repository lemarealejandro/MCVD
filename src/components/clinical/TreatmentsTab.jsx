import React, { useState } from 'react';
import { Plus, Trash2, FileText, Search, ChevronDown, ChevronRight, DollarSign, ArrowRight, Check } from 'lucide-react';
import { DENTAL_TREATMENTS } from '../../data/treatmentCatalog';
import BudgetWithPDF from './BudgetWithPDF';
import { localDateStr } from '../../utils/date';
import { elegirProcedimiento, quitarDelPlan } from '../../utils/planTratamiento';
import { calcularVencimiento, presupuestoVencido, formatearFechaHora, revalorarItems, VIGENCIA_HORAS } from '../../utils/presupuesto';

const newId = () => Date.now();

// Catálogo aplanado para elegir el procedimiento de cada diente del plan.
const PROCEDIMIENTOS = DENTAL_TREATMENTS.flatMap(cat => cat.items.map(item => ({ ...item, categoria: cat.category })));

const TreatmentsTab = ({ patient, patients, patientId, setPatients, seccionInicial = 'history' }) => {
  const [activeSection, setActiveSection] = useState(seccionInicial); // 'history' | 'catalog' | 'plan' | 'budget'
  const [openCategories, setOpenCategories] = useState({});
  const [search, setSearch] = useState('');
  const [newTreatment, setNewTreatment] = useState({ procedure: '', tooth: '', notes: '', doctor: '', date: localDateStr() });
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastAdded, setLastAdded] = useState('');

  const toggleCategory = (cat) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  // --- Presupuesto persistido en la ficha, con vigencia de 48 horas ---
  const presupuesto = patient.presupuesto || null;
  const budgetItems = presupuesto?.items || [];
  const exchangeRate = presupuesto?.tasa ?? 40;
  const vencido = presupuestoVencido(presupuesto);
  const catalogoPrecios = Object.fromEntries(PROCEDIMIENTOS.map(p => [p.id, { priceUSD: p.priceUSD }]));

  // Crea, actualiza o borra el presupuesto. Renovar reinicia las 48 horas.
  const guardarPresupuesto = (items, tasa, { renovar = false } = {}) => {
    if (items.length === 0) {
      const sinPresupuesto = { ...patient };
      delete sinPresupuesto.presupuesto;
      setPatients({ ...patients, [patientId]: sinPresupuesto });
      return;
    }
    const nuevo = renovar || !presupuesto;
    const creadoEn = nuevo ? new Date().toISOString() : presupuesto.creadoEn;
    setPatients({
      ...patients,
      [patientId]: {
        ...patient,
        presupuesto: {
          id: nuevo ? String(newId()) : presupuesto.id,
          creadoEn,
          vencimiento: calcularVencimiento(creadoEn),
          tasa,
          items,
        },
      },
    });
  };

  const setBudgetItems = (u) => {
    if (vencido) {
      window.alert('El presupuesto venció. Renuévelo para modificarlo.');
      return;
    }
    const siguiente = typeof u === 'function' ? u(budgetItems) : u;
    guardarPresupuesto(siguiente, exchangeRate);
  };
  const setExchangeRate = (tasa) => {
    if (vencido) {
      window.alert('El presupuesto venció. Renuévelo para cambiar la tasa.');
      return;
    }
    guardarPresupuesto(budgetItems, tasa);
  };
  const renovarPresupuesto = () => {
    guardarPresupuesto(revalorarItems(budgetItems, catalogoPrecios), exchangeRate, { renovar: true });
  };
  const fechaVencimiento = presupuesto ? formatearFechaHora(presupuesto.vencimiento) : '';

  // --- Plan de tratamiento (dientes enviados desde el odontograma) ---
  const planItems = patient.planTratamientos || [];
  const planPendiente = planItems.filter(p => p.status === 'pendiente');
  const actualizarPlan = (siguiente) => setPatients({ ...patients, [patientId]: { ...patient, planTratamientos: siguiente } });
  const idEnPresupuesto = (item) => `${item.procedureId}-${item.tooth}`;
  const agregarPlanAPresupuesto = (item) => {
    const proc = PROCEDIMIENTOS.find(p => p.id === item.procedureId);
    if (!proc) return;
    addToBudget({
      id: idEnPresupuesto(item),
      catalogId: proc.id,
      name: `${proc.name} · Diente ${item.tooth}`,
      unit: proc.unit,
      priceUSD: proc.priceUSD,
    });
  };

  const filteredCatalog = DENTAL_TREATMENTS.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  const addToBudget = (item) => {
    if (vencido) {
      window.alert('El presupuesto venció. Renuévelo antes de agregar procedimientos.');
      return;
    }
    setBudgetItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    // Se queda en el catálogo para seguir agregando; el presupuesto se abre al continuar.
    setLastAdded(item.name);
  };

  const addToHistory = (item) => {
    const treatment = {
      id: newId(),
      date: localDateStr(),
      procedure: item.name,
      tooth: '-',
      notes: '',
      doctor: 'Dr. Tratante',
      priceUSD: item.priceUSD
    };
    setPatients({ ...patients, [patientId]: { ...patient, treatments: [...(patient.treatments || []), treatment] } });
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    const treatment = { ...newTreatment, id: newId() };
    setPatients({ ...patients, [patientId]: { ...patient, treatments: [...(patient.treatments || []), treatment] } });
    setNewTreatment({ procedure: '', tooth: '', notes: '', doctor: '', date: localDateStr() });
    setShowAddForm(false);
  };

  const removeFromHistory = (treatmentId) => {
    if (!window.confirm('¿Eliminar este tratamiento del historial?')) return;
    setPatients({ ...patients, [patientId]: { ...patient, treatments: patient.treatments.filter(t => t.id !== treatmentId) } });
  };

  return (
    <div className="treatments-layout">
      {/* Section Tabs */}
      <div className="section-tabs">
        <button className={`section-tab ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}>
          <FileText size={16} /> Historial de Tratamientos
        </button>
        <button className={`section-tab ${activeSection === 'plan' ? 'active' : ''}`} onClick={() => setActiveSection('plan')}>
          <ArrowRight size={16} /> Plan de Tratamiento
          {planPendiente.length > 0 && <span className="budget-badge">{planPendiente.length}</span>}
        </button>
        <button className={`section-tab ${activeSection === 'catalog' ? 'active' : ''}`} onClick={() => setActiveSection('catalog')}>
          <Search size={16} /> Catálogo de Procedimientos
        </button>
        <button className={`section-tab ${activeSection === 'budget' ? 'active' : ''}`} onClick={() => setActiveSection('budget')}>
          <DollarSign size={16} /> Presupuesto
          {budgetItems.length > 0 && <span className="budget-badge">{budgetItems.length}</span>}
        </button>
      </div>

      {/* HISTORY SECTION */}
      {activeSection === 'history' && (
        <div className="info-card">
          <div className="card-header">
            <h3>Historial de Tratamientos Realizados</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={16} /> Agregar
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddManual} className="add-treatment-form">
              <div className="form-row">
                <div className="input-group"><label>Procedimiento</label>
                  <input required className="form-input" value={newTreatment.procedure} onChange={e => setNewTreatment({...newTreatment, procedure: e.target.value})} placeholder="Ej: Extracción simple" />
                </div>
                <div className="input-group"><label>Diente / Zona</label>
                  <input className="form-input" value={newTreatment.tooth} onChange={e => setNewTreatment({...newTreatment, tooth: e.target.value})} placeholder="Ej: 16, Toda la boca" />
                </div>
                <div className="input-group"><label>Odontólogo</label>
                  <input className="form-input" value={newTreatment.doctor} onChange={e => setNewTreatment({...newTreatment, doctor: e.target.value})} placeholder="Ej: Dr. López" />
                </div>
                <div className="input-group"><label>Fecha</label>
                  <input type="date" className="form-input" value={newTreatment.date} onChange={e => setNewTreatment({...newTreatment, date: e.target.value})} />
                </div>
              </div>
              <div className="input-group full-width"><label>Notas Clínicas</label>
                <input className="form-input" value={newTreatment.notes} onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})} placeholder="Observaciones del tratamiento..." />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Tratamiento</button>
              </div>
            </form>
          )}

          <div className="table-container">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Procedimiento</th><th>Diente / Zona</th>
                  <th>Odontólogo</th><th>Notas</th><th></th>
                </tr>
              </thead>
              <tbody>
                {patient.treatments?.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.date}</td>
                    <td>{t.procedure}</td>
                    <td><span className="tooth-badge">{t.tooth || '-'}</span></td>
                    <td>{t.doctor || '-'}</td>
                    <td className="text-secondary text-sm">{t.notes || '-'}</td>
                    <td>
                      <button className="btn-danger-sm" onClick={() => removeFromHistory(t.id)}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {(!patient.treatments || patient.treatments.length === 0) && (
                  <tr><td colSpan="6" className="empty-state">No hay tratamientos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATALOG SECTION */}
      {activeSection === 'catalog' && (
        <div className="info-card">
          <div className="card-header">
            <h3>Catálogo Completo de Procedimientos</h3>
            <div className="search-bar-sm">
              <Search size={14} />
              <input placeholder="Buscar tratamiento..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="catalog-body">
            {filteredCatalog.map(cat => (
              <div key={cat.category} className="catalog-category">
                <button className="category-toggle" onClick={() => toggleCategory(cat.category)}>
                  {openCategories[cat.category] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  <span>{cat.category}</span>
                  <span className="cat-count">{cat.items.length} procedimientos</span>
                </button>
                {openCategories[cat.category] && (
                  <div className="catalog-items">
                    {cat.items.map(item => (
                      <div key={item.id} className="catalog-item">
                        <div className="catalog-item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-unit">{item.unit}</span>
                        </div>
                        <div className="catalog-item-price">
                          <span className="price-usd">${item.priceUSD}</span>
                          <span className="price-ves">{(item.priceUSD * exchangeRate).toLocaleString('es-VE')} Bs.</span>
                        </div>
                        <div className="catalog-item-actions">
                          <button className="btn-catalog add-history" onClick={() => addToHistory(item)} title="Agregar al Historial">
                            <FileText size={14}/> Historial
                          </button>
                          <button className="btn-catalog add-budget" onClick={() => addToBudget(item)} title="Agregar al Presupuesto">
                            <Plus size={14}/> Presupuesto
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra para pasar del catálogo al presupuesto final */}
      {activeSection === 'catalog' && budgetItems.length > 0 && (
        <div className="budget-continue-bar" role="status">
          <div className="budget-continue-info">
            {lastAdded && <span className="budget-continue-last"><Check size={14} /> Agregado: {lastAdded}</span>}
            <span>{budgetItems.reduce((s, i) => s + i.qty, 0)} procedimiento(s) en el presupuesto</span>
          </div>
          <button className="btn btn-primary" onClick={() => setActiveSection('budget')}>
            Continuar al presupuesto <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* PLAN SECTION */}
      {activeSection === 'plan' && (
        <div className="info-card">
          <div className="card-header">
            <h3>Plan de Tratamiento (pendientes)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              Dientes enviados desde el odontograma. Elija el procedimiento y agréguelo al presupuesto.
            </p>
          </div>
          <div className="card-body plan-list">
            {planPendiente.length === 0 ? (
              <p className="plan-empty">No hay dientes en el plan. Envíelos desde el registro de hallazgos del odontograma.</p>
            ) : planPendiente.map(item => {
              const proc = PROCEDIMIENTOS.find(p => p.id === item.procedureId);
              const enPresupuesto = budgetItems.some(b => b.id === idEnPresupuesto(item));
              return (
                <div key={item.id} className="plan-item">
                  <div className="plan-item-head">
                    <div>
                      <strong>Diente {item.tooth}</strong>
                      <span className="plan-item-name"> · {item.toothName}</span>
                    </div>
                    <span className="plan-item-meta">
                      {item.fecha ? new Date(item.fecha).toLocaleDateString('es-VE') : '—'} · {item.creador || '—'}
                    </span>
                  </div>
                  {item.caras && item.caras !== '—' && <div className="plan-item-caras">{item.caras}</div>}
                  {item.estado?.length > 0 && (
                    <div className="plan-item-estado">
                      {item.estado.map(e => <span key={e} className="plan-chip">{e}</span>)}
                    </div>
                  )}
                  <div className="plan-item-actions">
                    <select
                      className="form-input plan-select"
                      value={item.procedureId || ''}
                      onChange={e => actualizarPlan(elegirProcedimiento(planItems, item.id, e.target.value))}
                      aria-label={`Procedimiento para el diente ${item.tooth}`}
                    >
                      <option value="">Seleccione procedimiento…</option>
                      {PROCEDIMIENTOS.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — ${p.priceUSD}</option>
                      ))}
                    </select>
                    {enPresupuesto ? (
                      <span className="plan-done"><Check size={14} /> En presupuesto</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" disabled={!proc} onClick={() => agregarPlanAPresupuesto(item)}>
                        <DollarSign size={14} /> Agregar al presupuesto
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => actualizarPlan(quitarDelPlan(planItems, item.id))}>
                      <Trash2 size={14} /> Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BUDGET SECTION */}
      {activeSection === 'budget' && (
        <div className="budget-layout">
          {budgetItems.length === 0 ? (
            <div className="info-card">
              <div className="empty-budget" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <DollarSign size={40} style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Agrega procedimientos desde el Catálogo para generar un presupuesto.</p>
                <button className="btn btn-primary" onClick={() => setActiveSection('catalog')}><Plus size={16}/> Ir al Catálogo</button>
              </div>
            </div>
          ) : (
            <>
              <div className={`bdg-vigencia ${vencido ? 'bdg-vigencia-vencido' : ''}`} role="status">
                <span>
                  {vencido
                    ? `Presupuesto vencido el ${fechaVencimiento}. Renuévelo para modificarlo; los precios se actualizarán con el catálogo.`
                    : `Presupuesto vigente hasta ${fechaVencimiento} (${VIGENCIA_HORAS} horas desde ${formatearFechaHora(presupuesto.creadoEn)}).`}
                </span>
                {vencido && (
                  <button className="btn btn-primary btn-sm" onClick={renovarPresupuesto}>Renovar {VIGENCIA_HORAS} horas</button>
                )}
              </div>
              <BudgetWithPDF
                patient={patient}
                budgetItems={budgetItems}
                setBudgetItems={setBudgetItems}
                exchangeRate={exchangeRate}
                setExchangeRate={setExchangeRate}
                onAddMore={() => setActiveSection('catalog')}
                vigencia={`Vigencia: ${VIGENCIA_HORAS} horas. Válido hasta ${fechaVencimiento}.`}
                vencido={vencido}
              />
            </>
          )}
        </div>
      )}

      <style>{`
        .treatments-layout { display: flex; flex-direction: column; gap: 1.5rem; }
        .bdg-vigencia { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 0.875rem; }
        .bdg-vigencia-vencido { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        .plan-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .plan-empty { color: var(--text-secondary); text-align: center; padding: 1.5rem 0; }
        .plan-item { border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; background: var(--bg-primary); }
        .plan-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
        .plan-item-name { color: var(--text-secondary); }
        .plan-item-meta { font-size: 0.78rem; color: var(--text-tertiary); }
        .plan-item-caras { font-size: 0.85rem; color: var(--text-primary); }
        .plan-item-estado { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .plan-chip { font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8; }
        .plan-item-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .plan-select { min-width: 260px; flex: 1; }
        .plan-done { display: inline-flex; align-items: center; gap: 0.3rem; color: #166534; font-weight: 600; font-size: 0.875rem; }
        @media (max-width: 768px) { .plan-select { min-width: 0; width: 100%; } }

        .section-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .section-tab {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.25rem; border-radius: var(--radius-md);
          border: 1px solid var(--border-color); background: var(--bg-primary);
          font-weight: 500; font-size: 0.9rem; cursor: pointer;
          color: var(--text-secondary); transition: all 0.2s; font-family: inherit;
          position: relative;
        }
        .section-tab:hover { border-color: var(--accent-color); color: var(--accent-color); }
        .section-tab.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
        .budget-badge {
          background: #ef4444; color: white; border-radius: 999px;
          font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; min-width: 18px;
        }

        .info-card { background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden; }
        .card-header {
          padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .card-header h3 { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; font-family: inherit; }
        .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.875rem; }
        .btn-primary { background: var(--accent-color); color: white; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-outline { background: transparent; border-color: var(--border-color); color: var(--text-primary); }
        .btn-outline:hover { background: var(--bg-secondary); }
        .btn-danger-sm { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 0.375rem; border-radius: var(--radius-sm); cursor: pointer; display:flex; align-items:center; }
        .btn-danger-sm:hover { background: #fecaca; }

        /* Add Treatment Form */
        .add-treatment-form { padding: 1.5rem; border-bottom: 1px solid var(--border-color); background: #f8fafc; display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .input-group.full-width { grid-column: 1 / -1; }
        .input-group label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
        .form-input { padding: 0.55rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit; font-size: 0.9rem; background: white; }
        .form-input:focus { outline: none; border-color: var(--accent-color); }
        .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

        /* Table */
        .table-container { overflow-x: auto; }
        .cms-table { width: 100%; border-collapse: collapse; text-align: left; }
        .cms-table th { background: var(--bg-secondary); padding: 0.875rem 1.25rem; font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); }
        .cms-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-primary); }
        .tooth-badge { background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; font-weight: 600; font-size: 0.85rem; }
        .font-medium { font-weight: 500; }
        .text-secondary { color: var(--text-secondary); }
        .text-sm { font-size: 0.875rem; }
        .empty-state { text-align: center; padding: 2rem; color: var(--text-secondary); }

        /* Catalog */
        .catalog-body { display: flex; flex-direction: column; }
        .search-bar-sm { display: flex; align-items: center; gap: 0.5rem; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.4rem 0.75rem; }
        .search-bar-sm { max-width: 100%; min-width: 0; }
        .search-bar-sm input { border: none; outline: none; font-family: inherit; font-size: 0.875rem; width: 180px; min-width: 0; }
        .category-toggle { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; background: none; border: none; border-bottom: 1px solid var(--border-color); cursor: pointer; font-weight: 600; font-size: 0.95rem; color: var(--text-primary); font-family: inherit; text-align: left; }
        .category-toggle:hover { background: rgba(37,99,235,0.04); }
        .cat-count { margin-left: auto; font-size: 0.8125rem; font-weight: 400; color: var(--text-tertiary); }
        .catalog-items { display: flex; flex-direction: column; }
        .catalog-item { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.5rem; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; }
        .catalog-item:hover { background: rgba(37,99,235,0.03); }
        .catalog-item-info { flex: 1 1 160px; min-width: 0; }
        .item-name { font-weight: 500; font-size: 0.9rem; display: block; }
        .item-unit { font-size: 0.8125rem; color: var(--text-tertiary); }
        .catalog-item-price { display: flex; flex-direction: column; align-items: flex-end; min-width: 120px; }
        .price-usd { font-weight: 700; color: var(--accent-color); font-size: 1rem; }
        .price-ves { font-size: 0.8rem; color: var(--text-tertiary); }
        .catalog-item-actions { display: flex; gap: 0.5rem; }
        .btn-catalog { display: flex; align-items: center; gap: 0.375rem; padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: inherit; border: 1px solid; transition: all 0.15s; }
        .add-history { background: #f0fdf4; border-color: #86efac; color: #166534; }
        .add-history:hover { background: #dcfce7; }
        .add-budget { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
        .add-budget:hover { background: #dbeafe; }

        /* Budget */
        .budget-layout { display: flex; flex-direction: column; gap: 1rem; }
        .budget-continue-bar { position: sticky; bottom: 1rem; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 0.9rem 1.1rem; border-radius: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .budget-continue-info { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.9rem; color: var(--text-secondary); }
        .budget-continue-last { display: inline-flex; align-items: center; gap: 0.3rem; color: #166534; font-weight: 600; }
        .exchange-rate-widget { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
        .rate-input { width: 80px; padding: 0.4rem 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: inherit; font-size: 0.875rem; text-align: center; }
        .qty-control { display: flex; align-items: center; gap: 0.5rem; }
        .qty-control button { width: 24px; height: 24px; border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: 4px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
        .qty-control span { font-weight: 600; min-width: 20px; text-align: center; }
        .budget-totals { padding: 1.5rem; border-top: 2px solid var(--border-color); background: var(--bg-secondary); display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-end; }
        .total-row { display: flex; align-items: center; gap: 2rem; font-size: 1rem; }
        .total-usd { font-size: 1.5rem; color: var(--accent-color); }
        .total-ves-row { color: var(--text-secondary); }
        .total-ves { font-size: 1.1rem; color: var(--text-secondary); }
        .budget-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }
        .empty-budget { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem 2rem; color: var(--text-secondary); text-align: center; }
        .empty-budget svg { opacity: 0.3; }

        @media (max-width: 768px) {
          .section-tab { flex: 1 1 100%; justify-content: center; }
          .card-header { padding: 1rem; }
          .category-toggle { padding: 0.875rem 1rem; }
          .catalog-item { padding: 0.875rem 1rem; }
          .catalog-item-price { align-items: flex-start; min-width: 0; }
          .catalog-item-actions { width: 100%; }
          .btn-catalog { flex: 1; justify-content: center; }
          .search-bar-sm { width: 100%; }
          .search-bar-sm input { flex: 1; width: auto; }
          .form-actions { flex-wrap: wrap; }
          .form-actions .btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default TreatmentsTab;
