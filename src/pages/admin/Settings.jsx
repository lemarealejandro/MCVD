import React, { useState } from 'react';
import { Save, User, Bell, Lock, Globe } from 'lucide-react';

const Settings = () => {
  const [clinicName, setClinicName] = useState('ClinicPlus Dental');
  const [email, setEmail] = useState('contacto@clinicplus.com');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('es');

  const handleSave = (e) => {
    e.preventDefault();
    // In a real app, save settings to backend
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="cms-page">
      <div className="page-header">
        <p className="text-secondary">Ajustes generales del sistema y preferencias.</p>
      </div>

      <div className="settings-grid">
        {/* General Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="icon-wrapper">
              <User size={20} />
            </div>
            <h3>Perfil de la Clínica</h3>
          </div>
          <form className="settings-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Nombre de la Clínica</label>
              <input 
                type="text" 
                value={clinicName} 
                onChange={(e) => setClinicName(e.target.value)} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-primary mt-4">
              <Save size={18} />
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="icon-wrapper">
              <Globe size={20} />
            </div>
            <h3>Preferencias Regionales</h3>
          </div>
          <form className="settings-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Moneda Principal</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="form-input"
              >
                <option value="USD">Dólares (USD)</option>
                <option value="VES">Bolívares (VES)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Idioma del Sistema</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="form-input"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary mt-4">
              <Save size={18} />
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Security Placeholder */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="icon-wrapper">
              <Lock size={20} />
            </div>
            <h3>Seguridad</h3>
          </div>
          <div className="settings-form">
            <p className="text-secondary mb-4">Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>
            <button className="btn btn-outline w-full">Cambiar Contraseña</button>
          </div>
        </div>

        {/* Notifications Placeholder */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="icon-wrapper">
              <Bell size={20} />
            </div>
            <h3>Notificaciones</h3>
          </div>
          <div className="settings-form">
            <label className="toggle-label">
              <span>Recibir alertas de bajo stock</span>
              <input type="checkbox" defaultChecked className="toggle-input" />
            </label>
            <label className="toggle-label mt-3">
              <span>Notificaciones de nuevas citas</span>
              <input type="checkbox" defaultChecked className="toggle-input" />
            </label>
          </div>
        </div>
      </div>

      <style>{`
        .cms-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .settings-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .settings-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: rgba(37, 99, 235, 0.1);
          color: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-card-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 0.95rem;
          background-color: var(--bg-secondary);
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-color);
          background-color: var(--bg-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .mt-4 { margin-top: 1rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .w-full { width: 100%; justify-content: center; }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
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
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .btn-outline:hover {
          border-color: var(--text-secondary);
          background-color: var(--bg-secondary);
        }

        .toggle-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .toggle-input {
          appearance: none;
          width: 44px;
          height: 24px;
          background-color: #e5e7eb;
          border-radius: 999px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .toggle-input::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .toggle-input:checked {
          background-color: var(--accent-color);
        }

        .toggle-input:checked::after {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
};

export default Settings;
