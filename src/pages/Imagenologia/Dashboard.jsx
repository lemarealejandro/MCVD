import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileImage, Calendar, User, MoreVertical } from 'lucide-react';

const mockEstudios = [
  { id: 1, paciente: 'Juan Pérez', tipo: 'Tomografía CBCT', fecha: '2023-10-24', estado: 'Pendiente' },
  { id: 2, paciente: 'María García', tipo: 'Radiografía Panorámica', fecha: '2023-10-23', estado: 'Informado' },
  { id: 3, paciente: 'Carlos López', tipo: 'Radiografía Periapical', fecha: '2023-10-22', estado: 'Pendiente' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="cms-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="dashboard-title">Estudios Recientes</h2>
          <p className="text-secondary">Gestiona las imágenes y genera informes.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => alert('Nuevo estudio modal')}
        >
          <Plus size={18} />
          Nuevo Estudio
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <div className="input-with-icon">
          <span className="input-icon"><Search size={18} /></span>
          <input
            type="text"
            placeholder="Buscar por paciente, RUT o estudio..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {mockEstudios.map((estudio) => (
          <div key={estudio.id} className="dashboard-card">
            <div className="card-header" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="avatar" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {estudio.paciente.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{estudio.paciente}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={12} />
                    {estudio.fecha}
                  </div>
                </div>
              </div>
              <button className="icon-btn" style={{ border: 'none', backgroundColor: 'transparent' }}>
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="stat-icon bg-blue-100 text-blue-600" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                  <FileImage size={18} />
                </div>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{estudio.tipo}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span className={`badge ${estudio.estado === 'Informado' ? 'badge-green' : 'badge-yellow'}`} style={{ backgroundColor: estudio.estado === 'Informado' ? '#dcfce7' : '#fef08a', color: estudio.estado === 'Informado' ? '#16a34a' : '#854d0e' }}>
                  {estudio.estado}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => navigate(`/admin/imagenologia/estudio/${estudio.id}`)}
                    className="btn-small"
                  >
                    Ver Imágenes
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/informes/constructor/${estudio.id}`)}
                    className="btn-small" style={{ backgroundColor: 'var(--accent-color)', color: 'white', borderColor: 'var(--accent-color)' }}
                  >
                    Informe
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
