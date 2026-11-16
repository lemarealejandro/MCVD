import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Calculator, RefreshCw, X } from 'lucide-react';

const CATEGORIES = ['Insumos Clínicos', 'Material Desechable', 'Material Dental', 'Instrumental', 'Otros'];

const emptyItem = { id: null, item: '', category: CATEGORIES[0], quantity: '', minStock: '', priceUsd: '' };

const ItemModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), priceUsd: Number(form.priceUsd) });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{form.id ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
          <button className="modal-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="inv-item">Artículo</label>
              <input id="inv-item" required className="form-input" value={form.item} onChange={e => set('item', e.target.value)} />
            </div>
            <div className="field field-full">
              <label htmlFor="inv-category">Categoría</label>
              <select id="inv-category" className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="inv-quantity">Stock actual</label>
              <input id="inv-quantity" required type="number" min="0" className="form-input" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="inv-min">Stock mínimo</label>
              <input id="inv-min" required type="number" min="0" className="form-input" value={form.minStock} onChange={e => set('minStock', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="inv-price">Precio ($)</label>
              <input id="inv-price" required type="number" min="0" step="0.01" className="form-input" value={form.priceUsd} onChange={e => set('priceUsd', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{form.id ? 'Guardar Cambios' : 'Crear Artículo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Inventory = () => {
  const { inventory, setInventory } = useOutletContext();
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [exchangeRate, setExchangeRate] = useState(38.50); // Default exchange rate
  const [tempRate, setTempRate] = useState('38.50');
  const [showConverter, setShowConverter] = useState(false);
  
  // Converter states
  const [convUsd, setConvUsd] = useState('1');
  const [convBs, setConvBs] = useState('38.50');

  const updateExchangeRate = (e) => {
    e.preventDefault();
    const rate = parseFloat(tempRate);
    if (!isNaN(rate) && rate > 0) {
      setExchangeRate(rate);
      // Update converter values as well
      if (convUsd !== '') setConvBs((parseFloat(convUsd) * rate).toFixed(2));
    }
  };

  const handleUsdChange = (e) => {
    const usd = e.target.value;
    setConvUsd(usd);
    if (usd !== '') {
      setConvBs((parseFloat(usd) * exchangeRate).toFixed(2));
    } else {
      setConvBs('');
    }
  };

  const handleBsChange = (e) => {
    const bs = e.target.value;
    setConvBs(bs);
    if (bs !== '') {
      setConvUsd((parseFloat(bs) / exchangeRate).toFixed(2));
    } else {
      setConvUsd('');
    }
  };

  const handleSaveItem = (item) => {
    setInventory(prev => item.id
      ? prev.map(i => i.id === item.id ? item : i)
      : [...prev, { ...item, id: Date.now() }]);
    setEditingItem(null);
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`¿Eliminar "${item.item}" del inventario?`)) {
      setInventory(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const term = searchTerm.toLowerCase();
  const filteredInventory = inventory.filter(i =>
    i.item.toLowerCase().includes(term) || i.category.toLowerCase().includes(term)
  );

  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('es-VE', { 
      style: 'currency', 
      currency: currency 
    }).format(value);
  };

  return (
    <div className="cms-page">
      <div className="page-header">
        <p className="text-secondary">Control de insumos, materiales dentales y precios.</p>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar insumo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn" onClick={() => setShowConverter(!showConverter)} aria-label="Conversor">
            <Calculator size={18} />
            <span className="desktop-only">Conversor</span>
          </button>
          <button className="btn btn-primary" onClick={() => setEditingItem(emptyItem)} aria-label="Nuevo Artículo">
            <Plus size={18} />
            <span className="desktop-only">Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Exchange Rate & Converter Widget */}
      <div className="finance-widgets">
        <div className="widget-card rate-widget">
          <div className="widget-header">
            <h3>Tasa del Día (BCV / Ref)</h3>
          </div>
          <form className="rate-form" onSubmit={updateExchangeRate}>
            <div className="input-group">
              <span className="currency-symbol">Bs.</span>
              <input 
                type="number" 
                step="0.01" 
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="rate-input"
              />
            </div>
            <button type="submit" className="btn-icon" title="Actualizar Tasa">
              <RefreshCw size={18} />
            </button>
          </form>
        </div>

        {showConverter && (
          <div className="widget-card converter-widget">
            <div className="widget-header">
              <h3>Conversor Rápido</h3>
            </div>
            <div className="converter-flex">
              <div className="input-group">
                <span className="currency-symbol">$</span>
                <input 
                  type="number" 
                  value={convUsd}
                  onChange={handleUsdChange}
                  className="rate-input"
                  placeholder="USD"
                />
              </div>
              <div className="equals-sign">=</div>
              <div className="input-group">
                <span className="currency-symbol">Bs.</span>
                <input 
                  type="number" 
                  value={convBs}
                  onChange={handleBsChange}
                  className="rate-input"
                  placeholder="VES"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="cms-table responsive-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Precio ($)</th>
              <th>Precio (Bs)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 && (
              <tr><td colSpan={7} className="no-results-cell" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron artículos.</td></tr>
            )}
            {filteredInventory.map((item) => (
              <tr key={item.id} className={item.quantity <= item.minStock ? 'low-stock-row' : ''}>
                <td data-label="Artículo" className="font-medium">{item.item}</td>
                <td data-label="Categoría">{item.category}</td>
                <td data-label="Stock Actual">
                  <span>
                    <span className="font-semibold">{item.quantity}</span>
                    <span className="text-secondary ml-1">/ {item.minStock}</span>
                  </span>
                </td>
                <td data-label="Precio ($)" className="font-medium text-green">{formatCurrency(item.priceUsd, 'USD')}</td>
                <td data-label="Precio (Bs)" className="font-medium">{formatCurrency(item.priceUsd * exchangeRate, 'VES')}</td>
                <td data-label="Estado">
                  {item.quantity <= item.minStock ? (
                    <span className="status-badge status-red" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      <AlertTriangle size={14} />
                      Bajo Stock
                    </span>
                  ) : (
                    <span className="status-badge status-green">Normal</span>
                  )}
                </td>
                <td data-label="Acciones">
                  <div className="action-buttons">
                    <button className="icon-btn edit-btn" title="Editar" onClick={() => setEditingItem(item)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn delete-btn" title="Eliminar" onClick={() => handleDeleteItem(item)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <ItemModal initial={editingItem} onSave={handleSaveItem} onClose={() => setEditingItem(null)} />
      )}

      <style>{`
        .cms-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          max-width: 100%;
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-tertiary);
        }

        .search-bar input {
          padding: 0.625rem 1rem 0.625rem 2.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: inherit;
          width: 250px;
          transition: all 0.2s;
        }

        .search-bar input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn:hover {
          background-color: var(--bg-secondary);
        }

        .btn-primary {
          background-color: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }
        
        .btn-primary:hover {
          background-color: #1d4ed8;
        }

        /* Finance Widgets */
        .finance-widgets {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .widget-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          padding: 1.25rem;
          box-shadow: var(--shadow-sm);
          flex: 1 1 280px;
          min-width: 0;
          max-width: 100%;
        }

        .widget-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .rate-form {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .converter-flex {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .equals-sign {
          font-weight: bold;
          color: var(--text-tertiary);
        }

        .input-group {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .currency-symbol {
          position: absolute;
          left: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .rate-input {
          padding: 0.5rem 0.5rem 0.5rem 2.2rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: inherit;
          width: 120px;
          font-weight: 600;
        }
        
        .converter-widget .rate-input {
          width: 140px;
        }

        .rate-input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .btn-icon {
          background: none;
          border: none;
          color: var(--accent-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          background-color: rgba(37, 99, 235, 0.1);
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background-color: rgba(37, 99, 235, 0.2);
        }

        /* Table Styles */
        .table-container {
          background-color: var(--bg-primary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow-x: auto;
          box-shadow: var(--shadow-sm);
        }

        .cms-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .cms-table th {
          background-color: var(--bg-secondary);
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
        }

        .cms-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .cms-table tbody tr:last-child td {
          border-bottom: none;
        }

        .cms-table tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.01);
        }
        
        .low-stock-row {
          background-color: #fef2f2 !important;
        }

        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .text-green { color: #16a34a; }
        .ml-1 { margin-left: 0.25rem; }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-green {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-red {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: none;
          border: none;
          padding: 0.375rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background-color: var(--bg-secondary);
        }

        .edit-btn:hover { color: var(--accent-color); }
        .delete-btn:hover { color: #ef4444; background-color: #fee2e2; }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }

          .header-actions {
            width: 100%;
          }

          .search-bar {
            flex: 1;
            min-width: 0;
          }

          .search-bar input {
            width: 100%;
          }

          .converter-flex {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .equals-sign {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Inventory;
