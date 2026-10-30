import React, { useState } from 'react';
import { Search, Plus, FileText, ChevronRight, X } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const PatientsList = () => {
  const { patients, setPatients } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [newPatient, setNewPatient] = useState({
    name: '', rut: '', age: '', phone: '', email: '', bloodType: 'O+',
  });

  const handlePatientClick = (id) => {
    navigate(`/admin/patients/${id}`);
  };

  const handleAddPatient = (e) => {
    e.preventDefault();
    const id = Date.now().toString();
    const patientObj = {
      id,
      ...newPatient,
      status: 'Activo',
      lastVisit: new Date().toISOString().split('T')[0],
      allergies: [],
      medications: [],
      chronicDiseases: [],
      vitalSigns: { bloodPressure: 'N/A', heartRate: 'N/A', lastCheck: 'N/A' },
      treatments: [],
      odontogramData: {}
    };
    
    setPatients({ ...patients, [id]: patientObj });
    setIsModalOpen(false);
    setNewPatient({ name: '', rut: '', age: '', phone: '', email: '', bloodType: 'O+' });
    
    // Optionally navigate immediately to the new patient
    // navigate(`/admin/patients/${id}`);
  };

  const patientsList = Object.values(patients).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.rut.includes(searchTerm)
  );

  return (
    <div className="cms-page">
      <div className="page-header">
        <p className="text-secondary">Directorio de pacientes y acceso a historiales clínicos.</p>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o RUT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span className="desktop-only">Nuevo Paciente</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="cms-table patients-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT / Cédula</th>
              <th>Edad</th>
              <th>Teléfono</th>
              <th>Última Visita</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {patientsList.map((patient) => (
              <tr key={patient.id} onClick={() => handlePatientClick(patient.id)} className="clickable-row">
                <td className="font-medium patient-name">
                  <div className="avatar-small">{patient.name.charAt(0)}</div>
                  {patient.name}
                </td>
                <td>{patient.rut}</td>
                <td>{patient.age} años</td>
                <td>{patient.phone}</td>
                <td>{patient.lastVisit}</td>
                <td>
                  <span className={`status-badge ${patient.status === 'Activo' ? 'status-green' : 'status-gray'}`}>
                    {patient.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-text" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientClick(patient.id);
                      }}
                    >
                      <FileText size={16} />
                      <span>Ver Historia</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {patientsList.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>
                  No se encontraron pacientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Patient Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear Nuevo Paciente</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPatient} className="modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label>Nombre Completo</label>
                  <input required type="text" className="form-input" value={newPatient.name} onChange={(e) => setNewPatient({...newPatient, name: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>RUT / Cédula</label>
                  <input required type="text" className="form-input" value={newPatient.rut} onChange={(e) => setNewPatient({...newPatient, rut: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Edad</label>
                  <input required type="number" className="form-input" value={newPatient.age} onChange={(e) => setNewPatient({...newPatient, age: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Teléfono</label>
                  <input required type="text" className="form-input" value={newPatient.phone} onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" className="form-input" value={newPatient.email} onChange={(e) => setNewPatient({...newPatient, email: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Grupo Sanguíneo</label>
                  <select className="form-input" value={newPatient.bloodType} onChange={(e) => setNewPatient({...newPatient, bloodType: e.target.value})}>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Paciente</button>
              </div>
            </form>
          </div>
        </div>
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
          width: 300px;
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
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .btn-primary {
          background-color: var(--accent-color);
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1d4ed8;
        }

        .btn-outline {
          background-color: transparent;
          border-color: var(--border-color);
          color: var(--text-primary);
        }
        
        .btn-outline:hover {
          background-color: var(--bg-secondary);
        }

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

        .clickable-row {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .clickable-row:hover {
          background-color: rgba(37, 99, 235, 0.03);
        }

        .patient-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e0e7ff;
          color: #4338ca;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .font-medium { font-weight: 500; }
        .text-secondary { color: var(--text-secondary); }
        .text-center { text-align: center; }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .status-green {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-gray {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-text {
          background: none;
          border: none;
          color: var(--accent-color);
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 500;
          font-family: inherit;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .btn-text:hover {
          text-decoration: underline;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .modal-content {
          background-color: var(--bg-primary);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .btn-icon {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
        }

        .form-grid {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-input {
          padding: 0.625rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: inherit;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .search-bar input { width: 100%; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default PatientsList;
