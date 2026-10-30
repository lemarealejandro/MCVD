import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Calculator, RefreshCw } from 'lucide-react';

const mockInventory = [
  { id: 1, item: 'Anestesia Local (Cajas)', category: 'Insumos Clínicos', quantity: 15, minStock: 5, priceUsd: 25.50, status: 'Normal' },
  { id: 2, item: 'Guantes de Látex Talla M', category: 'Material Desechable', quantity: 3, minStock: 10, priceUsd: 8.00, status: 'Bajo Stock' },
  { id: 3, item: 'Mascarillas Quirúrgicas', category: 'Material Desechable', quantity: 50, minStock: 20, priceUsd: 4.50, status: 'Normal' },
  { id: 4, item: 'Jeringas Desechables 5ml', category: 'Insumos Clínicos', quantity: 120, minStock: 50, priceUsd: 0.15, status: 'Normal' },
  { id: 5, item: 'Resina Compuesta (Kit)', category: 'Material Dental', quantity: 2, minStock: 3, priceUsd: 45.00, status: 'Bajo Stock' },
];

const Inventory = () => {
  const [inventory, setInventory] = useState(mockInventory);
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
      const newBs = (parseFloat(convUsd) * rate).toFixed(2);
      setConvBs(newBs);
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
          <button className="btn" onClick={() => setShowConverter(!showConverter)}>
            <Calculator size={18} />
            <span className="desktop-only">Conversor</span>
          </button>
          <button className="btn btn-primary">
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
        <table className="cms-table">
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
            {inventory.map((item) => (
              <tr key={item.id} className={item.quantity <= item.minStock ? 'low-stock-row' : ''}>
                <td className="font-medium">{item.item}</td>
                <td>{item.category}</td>
                <td>
                  <span className="font-semibold">{item.quantity}</span>
                  <span className="text-secondary ml-1">/ {item.minStock}</span>
                </td>
                <td className="font-medium text-green">{formatCurrency(item.priceUsd, 'USD')}</td>
                <td className="font-medium">{formatCurrency(item.priceUsd * exchangeRate, 'VES')}</td>
                <td>
                  {item.quantity <= item.minStock ? (
                    <span className="status-badge status-red" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      <AlertTriangle size={14} />
                      Bajo Stock
                    </span>
                  ) : (
                    <span className="status-badge status-green">Normal</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-btn edit-btn" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn delete-btn" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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
          min-width: 280px;
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
