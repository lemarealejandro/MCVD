import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Users, Calendar, AlertTriangle, TrendingUp, CreditCard, Copy, Check, Send } from 'lucide-react';
import { localDateStr } from '../../utils/date';

const Dashboard = () => {
  const navigate = useNavigate();
  const { patients, appointments, inventory } = useOutletContext();
  const lowStock = inventory.filter(i => i.quantity <= i.minStock);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const monthPrefix = localDateStr(now).slice(0, 7);
  const active = appointments.filter(a => a.status !== 'Cancelada');
  const stats = {
    appointmentsWeek: active.filter(a => a.date >= localDateStr(weekStart) && a.date <= localDateStr(weekEnd)).length,
    appointmentsMonth: active.filter(a => a.date.startsWith(monthPrefix)).length,
    patients: Object.keys(patients).length,
  };

  const [paymentAmount, setPaymentAmount] = useState('');
  const [patientName, setPatientName] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePaymentLink = (e) => {
    e.preventDefault();
    if (!paymentAmount || !patientName) return;
    
    // In a real app, this would call an API (e.g. Stripe, PagoMóvil, etc)
    const mockId = Math.random().toString(36).substring(2, 9);
    const link = `https://clinicplus.com/pay/${mockId}?amt=${paymentAmount}&ref=${encodeURIComponent(patientName)}`;
    setPaymentLink(link);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendViaWhatsApp = () => {
    const text = `Hola ${patientName}, aquí tienes el enlace para el pago de tu consulta/tratamiento: ${paymentLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="cms-page">
      <div className="page-header">
        <h2 className="dashboard-title">Resumen General</h2>
        <p className="text-secondary">Bienvenido al panel de control de la clínica.</p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3>Citas esta Semana</h3>
            <p className="stat-value">{stats.appointmentsWeek}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-600">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Citas este Mes</h3>
            <p className="stat-value">{stats.appointmentsMonth}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-100 text-purple-600">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Pacientes Registrados</h3>
            <p className="stat-value">{stats.patients}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Alerts & Low Stock */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Alertas de Inventario</h3>
            <span className="badge badge-red">{lowStock.length} bajos</span>
          </div>
          <div className="card-body">
            {lowStock.length > 0 ? (
              <ul className="alert-list">
                {lowStock.map((item) => (
                  <li key={item.id} className="alert-item">
                    <div className="alert-icon">
                      <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <div className="alert-content">
                      <h4>{item.item}</h4>
                      <p>Stock: <strong>{item.quantity}</strong> (Mínimo: {item.minStock})</p>
                    </div>
                    <button className="btn-small" onClick={() => navigate('/admin/inventory')}>Reponer</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary">No hay alertas de stock bajo actualmente.</p>
            )}
          </div>
        </div>

        {/* Payment Link Generator */}
        <div className="dashboard-card payment-card">
          <div className="card-header">
            <h3>Generar Link de Pago</h3>
          </div>
          <div className="card-body">
            <p className="text-secondary mb-4">Crea un enlace rápido para cobrar a tus pacientes vía transferencia o tarjeta.</p>
            <form onSubmit={generatePaymentLink} className="payment-form">
              <div className="input-group">
                <label>Nombre del Paciente</label>
                <input 
                  type="text" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="form-input"
                  required
                />
              </div>
              <div className="input-group">
                <label>Monto a Cobrar ($)</label>
                <div className="input-with-icon">
                  <span className="input-icon">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-2">
                <CreditCard size={18} />
                Crear Enlace
              </button>
            </form>

            {paymentLink && (
              <div className="generated-link-box">
                <p className="link-label">Enlace Generado:</p>
                <div className="link-display">
                  <input type="text" value={paymentLink} readOnly />
                  <button onClick={copyToClipboard} className="icon-btn" title="Copiar">
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <button onClick={sendViaWhatsApp} className="btn-whatsapp mt-3">
                  <Send size={18} />
                  Enviar por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
