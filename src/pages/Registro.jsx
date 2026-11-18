import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle, Lock, Mail, Phone, User } from 'lucide-react';
import { callFunction } from '../lib/supabase';
import './auth.css';

// Registro público de una clínica nueva. La cuenta queda pendiente hasta que
// el administrador la aprueba desde el correo que recibe.
const Registro = () => {
  const [form, setForm] = useState({ clinicName: '', contactName: '', phone: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }

    setSubmitting(true);
    const { error: sendError } = await callFunction('clinic-signup', {
      clinicName: form.clinicName,
      contactName: form.contactName,
      phone: form.phone,
      email: form.email,
      password: form.password,
    });
    setSubmitting(false);
    if (sendError) { setError(sendError); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="login-container">
        <div className="login-card auth-done">
          <CheckCircle size={56} />
          <h2>Solicitud enviada</h2>
          <p>Recibimos la solicitud de <strong>{form.clinicName}</strong>. La revisaremos y, cuando sea aprobada, podrás entrar con <strong>{form.email}</strong> y la contraseña que creaste.</p>
          <Link to="/login" className="btn btn-primary btn-full">Ir al inicio de sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">Clinic<span className="logo-accent">Plus</span></div>
          <h2>Registra tu clínica</h2>
          <p>Completa los datos. Revisaremos la solicitud antes de activar tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="clinicName">Nombre de la clínica</label>
            <div className="input-wrapper">
              <Building2 size={20} className="input-icon" />
              <input id="clinicName" value={form.clinicName} onChange={set('clinicName')} placeholder="Clínica Dental Ejemplo" required minLength={2} maxLength={200} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="contactName">Tu nombre completo</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input id="contactName" value={form.contactName} onChange={set('contactName')} autoComplete="name" placeholder="Nombre y apellido" required minLength={2} maxLength={200} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Teléfono</label>
            <div className="input-wrapper">
              <Phone size={20} className="input-icon" />
              <input id="phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+58 412 000 0000" maxLength={40} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Correo</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="tu@correo.com" required />
            </div>
            <p className="auth-hint">Con este correo iniciarás sesión.</p>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="Mínimo 8 caracteres" required minLength={8} maxLength={72} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirm">Repite la contraseña</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required minLength={8} maxLength={72} />
            </div>
          </div>

          {error && <p className="status-message error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>

        <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  );
};

export default Registro;
