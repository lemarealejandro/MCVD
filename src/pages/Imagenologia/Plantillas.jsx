import React from 'react';
import { Plus, LayoutTemplate, Edit2, Trash2 } from 'lucide-react';

const mockPlantillas = [
  { id: 1, nombre: 'Implantología Básica', bloques: 6, especialidad: 'Cirugía' },
  { id: 2, nombre: 'Endodoncia (Pieza Única)', bloques: 4, especialidad: 'Endodoncia' },
  { id: 3, nombre: 'Evaluación ATM', bloques: 7, especialidad: 'Maxilofacial' },
  { id: 4, nombre: 'Ortodoncia Inicial', bloques: 5, especialidad: 'Ortodoncia' },
];

const Plantillas = () => {
  return (
    <div className="cms-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="dashboard-title">Gestión de Plantillas</h2>
          <p className="text-secondary">Configura los bloques predeterminados para cada tipo de informe.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nueva Plantilla
        </button>
      </div>

      <div className="dashboard-grid">
        {mockPlantillas.map((plantilla) => (
          <div key={plantilla.id} className="dashboard-card" style={{ transition: 'border-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="stat-icon bg-blue-100 text-blue-600" style={{ width: '40px', height: '40px', backgroundColor: '#fff7ed', color: '#f97316' }}>
                    <LayoutTemplate size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{plantilla.nombre}</h3>
                    <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{plantilla.especialidad}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn" style={{ border: 'none', backgroundColor: 'transparent' }}><Edit2 size={16} /></button>
                  <button className="icon-btn" style={{ border: 'none', backgroundColor: 'transparent', color: '#ef4444' }}><Trash2 size={16} /></button>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <p>Contiene <strong>{plantilla.bloques} bloques</strong> configurados.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plantillas;
