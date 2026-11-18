import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { callFunction } from '../lib/supabase';
import './auth.css';

const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// Página que abre el administrador desde el correo para aprobar o rechazar una clínica.
// El enlace trae ?id=...&token=...; el token lo valida la función clinic-approval.
const AprobarClinica = () => {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';
  const linkOk = Boolean(id && token);

  const [request, setRequest] = useState(null);
  const [error, setError] = useState(linkOk ? '' : 'El enlace está incompleto. Ábrelo de nuevo desde el correo.');
  const [loading, setLoading] = useState(linkOk);
  const [working, setWorking] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    if (!linkOk) return;
    callFunction('clinic-approval', { action: 'view', id, token }).then(({ data, error: viewError }) => {
      setLoading(false);
      if (viewError) setError(viewError);
      else setRequest(data.request);
    });
  }, [id, token, linkOk]);

  const decide = async (action) => {
    setWorking(action);
    setError('');
    const { data, error: actionError } = await callFunction('clinic-approval', { action, id, token });
    setWorking('');
    setConfirmReject(false);
    if (data?.request) setRequest(data.request);
    if (actionError) setError(actionError);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">Clinic<span className="logo-accent">Plus</span></div>
          <h2>Solicitud de clínica</h2>
          <p>Revisa los datos antes de dar acceso.</p>
        </div>

        {loading && <p className="status-message info">Cargando solicitud...</p>}

        {request && (
          <>
            <table className="auth-details">
              <tbody>
                <tr><th>Estado</th><td><span className={`status-pill ${request.status}`}>{STATUS_LABEL[request.status]}</span></td></tr>
                <tr><th>Clínica</th><td><strong>{request.clinicName}</strong></td></tr>
                <tr><th>Responsable</th><td>{request.contactName}</td></tr>
                <tr><th>Correo</th><td>{request.email}</td></tr>
                <tr><th>Teléfono</th><td>{request.phone || '—'}</td></tr>
                <tr><th>Enviada</th><td>{formatDate(request.createdAt)}</td></tr>
                {request.reviewedAt && <tr><th>Revisada</th><td>{formatDate(request.reviewedAt)}</td></tr>}
              </tbody>
            </table>

            {request.status === 'pending' && !confirmReject && (
              <div className="auth-actions">
                <button type="button" className="btn btn-primary" onClick={() => decide('approve')} disabled={Boolean(working)}>
                  {working === 'approve' ? 'Aprobando...' : 'Aprobar clínica'}
                </button>
                <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmReject(true)} disabled={Boolean(working)}>
                  Rechazar
                </button>
              </div>
            )}

            {request.status === 'pending' && confirmReject && (
              <div className="login-form">
                <p className="status-message info">¿Rechazar la solicitud de {request.clinicName}? La persona no podrá entrar al sistema.</p>
                <div className="auth-actions">
                  <button type="button" className="btn btn-danger-outline" onClick={() => decide('reject')} disabled={Boolean(working)}>
                    {working === 'reject' ? 'Rechazando...' : 'Sí, rechazar'}
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirmReject(false)} disabled={Boolean(working)}>Cancelar</button>
                </div>
              </div>
            )}

            {request.status === 'approved' && (
              <p className="status-message info">Clínica creada. {request.contactName} ya puede iniciar sesión con {request.email} y su contraseña.</p>
            )}
            {request.status === 'rejected' && (
              <p className="status-message info">Solicitud rechazada. Esta cuenta no tiene acceso al sistema.</p>
            )}
          </>
        )}

        {error && <p className="status-message error" role="alert">{error}</p>}
      </div>
    </div>
  );
};

export default AprobarClinica;
