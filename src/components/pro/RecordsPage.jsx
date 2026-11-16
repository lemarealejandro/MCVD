import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Download } from 'lucide-react';
import { usePersistentState } from '../../utils/usePersistentState';
import { downloadCsv } from '../../utils/csv';
import { SUCURSALES_KEY } from '../../utils/sucursales';

// Campos: { key, label, type: 'text'|'number'|'date'|'select'|'sucursal', options?, step?, required? }
const RecordModal = ({ singular, fields, initial, sucursales, transform, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const record = { ...form };
    fields.forEach(f => {
      if (f.type === 'number') record[f.key] = record[f.key] === '' ? 0 : Number(record[f.key]);
    });
    onSave(transform ? transform(record) : record);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{form.id ? `Editar ${singular}` : `Nuevo ${singular}`}</h3>
          <button className="modal-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {fields.map(f => {
              const id = `rec-${f.key}`;
              const common = { id, className: 'form-input', required: f.required, value: form[f.key] ?? '', onChange: e => set(f.key, e.target.value) };
              let input;
              if (f.type === 'select') {
                input = <select {...common}>{f.options.map(o => <option key={o} value={o}>{o}</option>)}</select>;
              } else if (f.type === 'sucursal') {
                input = (
                  <select {...common}>
                    <option value="">Sin sucursal</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                );
              } else if (f.type === 'number') {
                input = <input {...common} type="number" min="0" step={f.step || '0.01'} />;
              } else {
                input = <input {...common} type={f.type || 'text'} />;
              }
              return (
                <div className={`field ${f.wide ? 'field-full' : ''}`} key={f.key}>
                  <label htmlFor={id}>{f.label}</label>
                  {input}
                </div>
              );
            })}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{form.id ? 'Guardar Cambios' : `Crear ${singular}`}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lista + alta/edición/baja + exportación CSV, parametrizada por configuración.
const RecordsPage = ({
  storageKey, title, description, singular, fields, columns, emptyRecord,
  transform, exportName, showExport = true,
}) => {
  const [records, setRecords] = usePersistentState(storageKey, []);
  const [sucursales] = usePersistentState(SUCURSALES_KEY, []);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const ctx = { sucursales };
  const term = searchTerm.trim().toLowerCase();
  const visible = records.filter(r => !term || columns.some(c => {
    const value = c.render ? c.plain?.(r, ctx) ?? '' : r[c.key];
    return String(value ?? '').toLowerCase().includes(term);
  }));

  const handleSave = (record) => {
    setRecords(prev => record.id
      ? prev.map(r => r.id === record.id ? record : r)
      : [...prev, { ...record, id: Date.now() }]);
    setEditing(null);
  };

  const handleDelete = (record) => {
    const label = record[fields[0].key] || singular;
    if (window.confirm(`¿Eliminar "${label}"?`)) {
      setRecords(prev => prev.filter(r => r.id !== record.id));
    }
  };

  const handleExport = () => {
    downloadCsv(
      `${exportName}.csv`,
      columns.map(c => c.label),
      visible.map(r => columns.map(c => (c.plain ? c.plain(r, ctx) : r[c.key])))
    );
  };

  return (
    <div className="cms-page">
      <div className="page-header">
        <p className="text-secondary">{description}</p>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder={`Buscar ${title.toLowerCase()}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {showExport && (
            <button className="btn" onClick={handleExport} disabled={visible.length === 0} aria-label="Exportar a Excel">
              <Download size={18} />
              <span className="desktop-only">Exportar a Excel</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setEditing({ ...emptyRecord })} aria-label={`Nuevo ${singular}`}>
            <Plus size={18} />
            <span className="desktop-only">Nuevo {singular}</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="cms-table responsive-table">
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.label}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="no-results-cell" style={{ textAlign: 'center', padding: '2rem' }}>Sin registros.</td></tr>
            )}
            {visible.map(r => (
              <tr key={r.id}>
                {columns.map(c => (
                  <td key={c.key} data-label={c.label}>
                    {c.render ? c.render(r, ctx) : r[c.key]}
                  </td>
                ))}
                <td data-label="Acciones">
                  <button className="btn-icon" onClick={() => setEditing(r)} aria-label="Editar"><Edit2 size={16} /></button>
                  <button className="btn-icon" onClick={() => handleDelete(r)} aria-label="Eliminar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <RecordModal
          singular={singular}
          fields={fields}
          initial={editing}
          sucursales={sucursales}
          transform={transform}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default RecordsPage;
