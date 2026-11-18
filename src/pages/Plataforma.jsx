import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Check, Clock, LogOut, RefreshCw, ShieldCheck, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserEmail, isAuthenticated, logout } from '../utils/auth';
import './plataforma.css';

const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };
const ROLE_LABEL = { owner: 'Responsable', staff: 'Equipo' };

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// Panel del administrador de la plataforma: revisa solicitudes de clínicas y ve
// la lista de clínicas con sus usuarios. No da acceso a datos clínicos.
const Plataforma = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ requests: [], clinics: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [working, setWorking] = useState(null);       // id de la solicitud en proceso
  const [confirmReject, setConfirmReject] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: overview, error: loadError } = await supabase.rpc('admin_overview');
    setLoading(false);
    if (loadError) { setError(`No se pudo cargar el panel: ${loadError.message}`); return; }
    setError('');
    setData(overview ?? { requests: [], clinics: [] });
  }, []);

  useEffect(() => {
    // Carga inicial; setState ocurre al resolver la petición.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const review = async (request, decision) => {
    setWorking(request.id);
    setNotice('');
    const { error: reviewError } = await supabase.rpc('admin_review_clinic_request', { req_id: request.id, decision });
    setWorking(null);
    setConfirmReject(null);
    if (reviewError) { setError(reviewError.message); return; }
    setNotice(decision === 'approve'
      ? `${request.clinicName} aprobada. ${request.contactName} ya puede entrar con ${request.email}. Avísale: el sistema no le envía correo.`
      : `Solicitud de ${request.clinicName} rechazada.`);
    load();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pending = data.requests.filter(r => r.status === 'pending');
  const visible = filter === 'pending' ? pending : data.requests;
  const userCount = data.clinics.reduce((n, c) => n + c.members.length, 0);

  return (
    <div className="pf">
      <header className="pf-top">
        <div className="pf-brand">
          <ShieldCheck size={22} />
          <div>
            <strong>Administración de la plataforma</strong>
            <span>{getUserEmail()}</span>
          </div>
        </div>
        <div className="pf-top-actions">
          {isAuthenticated() && <Link to="/admin" className="pf-btn">Ir a mi clínica</Link>}
          <button type="button" className="pf-btn" onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </header>

      <main className="pf-main">
        <section className="pf-stats" aria-label="Resumen">
          <div className={`pf-stat ${pending.length ? 'attention' : ''}`}>
            <Clock size={18} /><span className="pf-stat-num">{pending.length}</span><span>Solicitudes pendientes</span>
          </div>
          <div className="pf-stat"><Building2 size={18} /><span className="pf-stat-num">{data.clinics.length}</span><span>Clínicas</span></div>
          <div className="pf-stat"><Users size={18} /><span className="pf-stat-num">{userCount}</span><span>Usuarios en clínicas</span></div>
        </section>

        {error && <p className="pf-msg error" role="alert">{error}</p>}
        {notice && <p className="pf-msg ok" role="status">{notice}</p>}

        <section className="pf-card">
          <div className="pf-card-head">
            <h2>Solicitudes de clínicas</h2>
            <div className="pf-head-actions">
              <div className="pf-seg" role="tablist" aria-label="Filtrar solicitudes">
                <button type="button" role="tab" aria-selected={filter === 'pending'} onClick={() => setFilter('pending')}>Pendientes</button>
                <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
              </div>
              <button type="button" className="pf-icon-btn" onClick={load} disabled={loading} aria-label="Actualizar">
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {!loading && visible.length === 0 && (
            <p className="pf-empty">{filter === 'pending' ? 'No hay solicitudes pendientes.' : 'Todavía no hay solicitudes.'}</p>
          )}

          <ul className="pf-list">
            {visible.map(r => (
              <li key={r.id} className={`pf-req ${r.status}`}>
                <div className="pf-req-info">
                  <div className="pf-req-title">
                    <strong>{r.clinicName}</strong>
                    <span className={`pf-pill ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <dl>
                    <div><dt>Responsable</dt><dd>{r.contactName}</dd></div>
                    <div><dt>Correo</dt><dd>{r.email}</dd></div>
                    <div><dt>Teléfono</dt><dd>{r.phone || '—'}</dd></div>
                    <div><dt>Enviada</dt><dd>{fmt(r.createdAt)}</dd></div>
                    {r.reviewedAt && <div><dt>Revisada</dt><dd>{fmt(r.reviewedAt)}</dd></div>}
                  </dl>
                </div>

                {r.status === 'pending' && (
                  <div className="pf-req-actions">
                    {confirmReject === r.id ? (
                      <>
                        <span className="pf-confirm">¿Rechazar esta solicitud?</span>
                        <button type="button" className="pf-btn danger" onClick={() => review(r, 'reject')} disabled={working === r.id}>
                          {working === r.id ? 'Rechazando...' : 'Sí, rechazar'}
                        </button>
                        <button type="button" className="pf-btn" onClick={() => setConfirmReject(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="pf-btn primary" onClick={() => review(r, 'approve')} disabled={working === r.id}>
                          <Check size={16} /> {working === r.id ? 'Aprobando...' : 'Aprobar'}
                        </button>
                        <button type="button" className="pf-btn danger" onClick={() => setConfirmReject(r.id)} disabled={working === r.id}>
                          <X size={16} /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="pf-card">
          <div className="pf-card-head"><h2>Clínicas</h2></div>
          {!loading && data.clinics.length === 0 && <p className="pf-empty">No hay clínicas.</p>}
          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr><th>Clínica</th><th>Usuarios</th><th>Creada</th><th>Última actividad</th></tr>
              </thead>
              <tbody>
                {data.clinics.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      {c.demo && <span className="pf-pill demo">Datos de ejemplo</span>}
                    </td>
                    <td>
                      {c.members.length === 0 ? <span className="pf-muted">Sin usuarios</span> : (
                        <ul className="pf-members">
                          {c.members.map(m => (
                            <li key={m.email}>
                              {m.email} <span className="pf-muted">· {ROLE_LABEL[m.role] ?? m.role}{m.lastSignIn ? ` · último ingreso ${fmt(m.lastSignIn)}` : ' · nunca ingresó'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="pf-nowrap">{fmt(c.createdAt)}</td>
                    <td className="pf-nowrap">{c.lastActivity ? fmt(c.lastActivity) : <span className="pf-muted">Sin datos</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="pf-foot">Este panel no muestra pacientes ni datos clínicos de las clínicas.</p>
      </main>
    </div>
  );
};

export default Plataforma;
