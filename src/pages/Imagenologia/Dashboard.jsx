import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Plus, FileImage, Calendar, Trash2, X } from 'lucide-react';
import { localDateStr } from '../../utils/date';

const TIPOS_ESTUDIO = ['Tomografía CBCT', 'Radiografía Panorámica', 'Radiografía Periapical', 'Radiografía Bite-Wing', 'Radiografía Cefalométrica'];

const NuevoEstudioModal = ({ onSave, onClose }) => {
  const [paciente, setPaciente] = useState('');
  const [tipo, setTipo] = useState(TIPOS_ESTUDIO[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ paciente: paciente.trim(), tipo });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Nuevo Estudio</h3>
          <button className="modal-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="estudio-paciente">Paciente</label>
              <input id="estudio-paciente" required className="form-input" value={paciente} onChange={e => setPaciente(e.target.value)} />
            </div>
            <div className="field field-full">
              <label htmlFor="estudio-tipo">Tipo de estudio</label>
              <select id="estudio-tipo" className="form-input" value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS_ESTUDIO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear Estudio</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { estudios, setEstudios } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const term = searchTerm.toLowerCase();
  const filtered = estudios.filter(e =>
    e.paciente.toLowerCase().includes(term) || e.tipo.toLowerCase().includes(term)
  );

  const handleCreate = ({ paciente, tipo }) => {
    setEstudios(prev => [{ id: Date.now(), paciente, tipo, fecha: localDateStr(), estado: 'Pendiente' }, ...prev]);
    setShowModal(false);
  };

  const handleDelete = (estudio) => {
    if (window.confirm(`¿Eliminar el estudio de ${estudio.paciente}?`)) {
      setEstudios(prev => prev.filter(e => e.id !== estudio.id));
    }
  };

  return (
    <div className="cms-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="dashboard-title">Estudios Recientes</h2>
          <p className="text-secondary">Gestiona las imágenes y genera informes.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
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
            placeholder="Buscar por paciente o estudio..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 && <p className="text-secondary">No se encontraron estudios.</p>}

      <div className="dashboard-grid">
        {filtered.map((estudio) => (
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
              <button className="icon-btn" title="Eliminar estudio" style={{ border: 'none', backgroundColor: 'transparent', color: '#ef4444' }} onClick={() => handleDelete(estudio)}>
                <Trash2 size={18} />
              </button>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="stat-icon bg-blue-100 text-blue-600" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                  <FileImage size={18} />
                </div>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{estudio.tipo}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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

      {showModal && <NuevoEstudioModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Dashboard;
