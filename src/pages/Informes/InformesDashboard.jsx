import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, FileText, Calendar, MoreVertical, Download, 
  Eye, Edit3, FileSearch, Clock, CheckCircle, AlertCircle 
} from 'lucide-react';

const mockInformes = [
  { 
    id: 101, paciente: 'Juan Pérez', rut: '12.345.678-9',
    estudio: 'CBCT Maxilar Superior', tipo: 'Tomografía CBCT',
    fecha: '24 Oct 2023', medico: 'Dr. Rodríguez',
    estado: 'Borrador', bloques: 4, imagenes: 2
  },
  { 
    id: 102, paciente: 'María García', rut: '9.876.543-2',
    estudio: 'Radiografía Panorámica', tipo: 'Panorámica',
    fecha: '23 Oct 2023', medico: 'Dr. Rodríguez',
    estado: 'Finalizado', bloques: 6, imagenes: 3
  },
  { 
    id: 103, paciente: 'Carlos Fuentes', rut: '15.123.456-7',
    estudio: 'Periapical Zona Anterior', tipo: 'Periapical',
    fecha: '22 Oct 2023', medico: 'Dra. Martínez',
    estado: 'Finalizado', bloques: 5, imagenes: 1
  },
  { 
    id: 104, paciente: 'Ana Torres', rut: '11.222.333-4',
    estudio: 'Bite-Wing Bilateral', tipo: 'Bite-Wing',
    fecha: '21 Oct 2023', medico: 'Dra. Martínez',
    estado: 'Pendiente', bloques: 0, imagenes: 0
  },
];

const estadoBadge = {
  'Borrador':   { cls: 'badge-yellow', icon: <Edit3 size={11} /> },
  'Finalizado': { cls: 'badge-green',  icon: <CheckCircle size={11} /> },
  'Pendiente':  { cls: 'badge-gray',   icon: <Clock size={11} /> },
};

const InformesDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

  const filtered = mockInformes.filter(inf => {
    const matchSearch = inf.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inf.estudio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterEstado === 'Todos' || inf.estado === filterEstado;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: mockInformes.length,
    finalizados: mockInformes.filter(i => i.estado === 'Finalizado').length,
    borradores: mockInformes.filter(i => i.estado === 'Borrador').length,
    pendientes: mockInformes.filter(i => i.estado === 'Pendiente').length,
  };

  return (
    <div className="cms-page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="dashboard-title">Informes Radiológicos</h2>
          <p className="text-secondary">Genera, edita y gestiona los reportes diagnósticos estructurados.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/informes/constructor/nuevo')}
        >
          <Plus size={18} />
          Nuevo Informe
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <h3>Total</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-600">
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <h3>Finalizados</h3>
            <p className="stat-value">{stats.finalizados}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
            <Edit3 size={22} />
          </div>
          <div className="stat-info">
            <h3>Borradores</h3>
            <p className="stat-value">{stats.borradores}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <h3>Pendientes</h3>
            <p className="stat-value">{stats.pendientes}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div className="input-with-icon" style={{ flex: '1', minWidth: '220px', maxWidth: '360px' }}>
          <span className="input-icon"><Search size={16} /></span>
          <input
            type="text"
            placeholder="Buscar por paciente o estudio..."
            className="form-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Todos', 'Finalizado', 'Borrador', 'Pendiente'].map(est => (
            <button
              key={est}
              onClick={() => setFilterEstado(est)}
              className="btn-small"
              style={{
                backgroundColor: filterEstado === est ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: filterEstado === est ? 'white' : 'var(--text-secondary)',
                borderColor: filterEstado === est ? 'var(--accent-color)' : 'var(--border-color)',
              }}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      <div className="dashboard-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Paciente</th>
              <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Estudio</th>
              <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Fecha</th>
              <th style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Estado</th>
              <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FileSearch size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                  <p>No se encontraron informes</p>
                </td>
              </tr>
            ) : (
              filtered.map((inf, idx) => {
                const badge = estadoBadge[inf.estado];
                return (
                  <tr
                    key={inf.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ backgroundColor: 'var(--accent-color)', color: 'white', fontSize: '0.8rem', width: '32px', height: '32px', flexShrink: 0 }}>
                          {inf.paciente.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.2 }}>{inf.paciente}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inf.rut}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{inf.estudio}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {inf.bloques > 0 ? `${inf.bloques} bloques · ${inf.imagenes} imgs` : 'Sin contenido aún'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        <Calendar size={13} />
                        {inf.fecha}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>{inf.medico}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge ${badge.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {badge.icon}
                        {inf.estado}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {inf.estado === 'Finalizado' && (
                          <button className="icon-btn" title="Descargar PDF" style={{ padding: '0.4rem' }}>
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          className="btn-small"
                          style={{
                            backgroundColor: 'var(--accent-color)',
                            color: 'white',
                            borderColor: 'var(--accent-color)',
                            display: 'flex', alignItems: 'center', gap: '0.35rem'
                          }}
                          onClick={() => navigate(`/admin/informes/constructor/${inf.id}`)}
                        >
                          {inf.estado === 'Finalizado' ? <Eye size={14} /> : <Edit3 size={14} />}
                          {inf.estado === 'Finalizado' ? 'Ver' : 'Editar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InformesDashboard;
