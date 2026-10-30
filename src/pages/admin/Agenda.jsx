import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar, List, Mail, CheckCircle, Clock, XCircle, Send, X, AlertCircle } from 'lucide-react';
import { sendAppointmentConfirmation } from '../../utils/emailService';

const SERVICES = [
  'Consulta General', 'Limpieza Dental', 'Extracción Simple', 'Extracción Quirúrgica',
  'Restauración Resina', 'Endodoncia', 'Blanqueamiento', 'Ortodoncia',
  'Implante Dental', 'Coronas y Puentes', 'Periodoncia', 'Cirugía Oral',
  'Radiografía', 'Urgencia Dental'
];

const STATUS_CONFIG = {
  'Confirmada':  { color: 'status-green',  icon: CheckCircle, bg: '#dcfce7', text: '#166534' },
  'Pendiente':   { color: 'status-yellow', icon: Clock,        bg: '#fef9c3', text: '#854d0e' },
  'Cancelada':   { color: 'status-red',    icon: XCircle,      bg: '#fee2e2', text: '#991b1b' },
  'En Proceso':  { color: 'status-blue',   icon: AlertCircle,  bg: '#dbeafe', text: '#1d4ed8' },
  'Completada':  { color: 'status-gray',   icon: CheckCircle,  bg: '#f3f4f6', text: '#374151' },
};

const HOURS = Array.from({ length: 10 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const emptyAppointment = () => ({
  id: null, patient: '', patientEmail: '', patientPhone: '',
  service: 'Consulta General', date: new Date().toISOString().split('T')[0],
  time: '09:00', duration: 60, status: 'Pendiente', notes: '', doctor: ''
});

const AppointmentModal = ({ apt, onSave, onClose, patients = {} }) => {
  const [form, setForm] = useState(apt || emptyAppointment());
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePatientSelect = (e) => {
    const patient = Object.values(patients).find(p => p.name === e.target.value);
    if (patient) {
      setForm(f => ({ ...f, patient: patient.name, patientEmail: patient.email || '', patientPhone: patient.phone || '' }));
    } else {
      set('patient', e.target.value);
    }
  };

  const handleSendEmail = async () => {
    if (!form.patientEmail) { setEmailError('Ingrese el email del paciente'); return; }
    setSending(true); setEmailError('');
    const result = await sendAppointmentConfirmation({
      patientName: form.patient,
      patientEmail: form.patientEmail,
      date: form.date,
      time: form.time,
      service: form.service,
    });
    setSending(false);
    if (result.success) { setEmailSent(true); }
    else { setEmailError(result.error || 'Error al enviar'); }
  };

  const handleSave = () => {
    if (!form.patient || !form.date || !form.time) return;
    onSave({ ...form, id: form.id || Date.now() });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>{form.id ? 'Editar Cita' : 'Nueva Cita'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="modal-grid">
            <div className="mf">
              <label>Paciente *</label>
              <input list="patients-list" value={form.patient} onChange={handlePatientSelect} placeholder="Nombre del paciente" />
              <datalist id="patients-list">
                {Object.values(patients).map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
            <div className="mf">
              <label>Email del Paciente</label>
              <input type="email" value={form.patientEmail} onChange={e => set('patientEmail', e.target.value)} placeholder="email@ejemplo.com" />
            </div>
            <div className="mf">
              <label>Teléfono</label>
              <input value={form.patientPhone} onChange={e => set('patientPhone', e.target.value)} placeholder="+58 412..." />
            </div>
            <div className="mf">
              <label>Servicio *</label>
              <select value={form.service} onChange={e => set('service', e.target.value)}>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="mf">
              <label>Fecha *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="mf">
              <label>Hora *</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
            <div className="mf">
              <label>Duración (min)</label>
              <select value={form.duration} onChange={e => set('duration', +e.target.value)}>
                {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div className="mf">
              <label>Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="mf">
              <label>Doctor / Profesional</label>
              <input value={form.doctor} onChange={e => set('doctor', e.target.value)} placeholder="Dr. Apellido" />
            </div>
            <div className="mf mf-full">
              <label>Notas</label>
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones adicionales..." />
            </div>
          </div>

          <div className="modal-email-section">
            <div className="modal-email-header">
              <Mail size={16} />
              <span>Enviar Confirmación por Email</span>
            </div>
            {emailSent ? (
              <div className="email-success"><CheckCircle size={16} /> Correo enviado exitosamente</div>
            ) : (
              <>
                <button className="modal-email-btn" onClick={handleSendEmail} disabled={sending || !form.patientEmail}>
                  {sending ? 'Enviando...' : <><Send size={14} /> Enviar Confirmación</>}
                </button>
                {emailError && <p className="email-error">{emailError}</p>}
                {!form.patientEmail && <p className="email-hint">Ingrese el email del paciente para habilitar</p>}
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-outline" onClick={onClose}>Cancelar</button>
          <button className="modal-btn modal-btn-primary" onClick={handleSave}>
            {form.id ? 'Guardar Cambios' : 'Crear Cita'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-box { background: var(--bg-primary); border-radius: var(--radius-xl, 16px); border: 1px solid var(--border-color); width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); }
        .modal-header h3 { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); }
        .modal-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.25rem; border-radius: 50%; transition: all 0.2s; }
        .modal-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
        .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mf { display: flex; flex-direction: column; gap: 0.3rem; }
        .mf-full { grid-column: 1 / -1; }
        .mf label { font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }
        .mf input, .mf select, .mf textarea { padding: 0.6rem 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit; font-size: 0.875rem; color: var(--text-primary); background: var(--bg-primary); transition: all 0.2s; }
        .mf input:focus, .mf select:focus, .mf textarea:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .mf textarea { resize: vertical; }
        .modal-email-section { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .modal-email-header { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
        .modal-email-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: #2563eb; color: #fff; border: none; border-radius: var(--radius-md); font-size: 0.875rem; cursor: pointer; font-family: inherit; width: fit-content; transition: background 0.2s; }
        .modal-email-btn:hover:not(:disabled) { background: #1d4ed8; }
        .modal-email-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .email-success { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: #16a34a; font-weight: 500; }
        .email-error { font-size: 0.8rem; color: #ef4444; }
        .email-hint { font-size: 0.8rem; color: var(--text-tertiary); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.25rem 1.5rem; border-top: 1px solid var(--border-color); }
        .modal-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.25rem; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-family: inherit; transition: all 0.2s; }
        .modal-btn-primary { background: var(--accent-color); color: #fff; }
        .modal-btn-primary:hover { background: #1d4ed8; }
        .modal-btn-outline { background: transparent; border-color: var(--border-color); color: var(--text-primary); }
        .modal-btn-outline:hover { background: var(--bg-secondary); }
        @media (max-width: 640px) { .modal-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

const AgendaPage = () => {
  const today = new Date();
  const [appointments, setAppointments] = useState([
    { id: 1, patient: 'María Rodríguez', patientEmail: 'maria.rodriguez@email.com', patientPhone: '+58 412 123 4567', service: 'Limpieza Dental', date: today.toISOString().split('T')[0], time: '09:00', duration: 60, status: 'Confirmada', notes: '', doctor: 'Dr. López' },
    { id: 2, patient: 'Juan Pérez', patientEmail: 'juan.perez@email.com', patientPhone: '+58 416 987 6543', service: 'Extracción Simple', date: today.toISOString().split('T')[0], time: '11:00', duration: 45, status: 'Pendiente', notes: 'Paciente nervioso', doctor: 'Dr. López' },
    { id: 3, patient: 'Ana Gómez', patientEmail: '', patientPhone: '', service: 'Blanqueamiento', date: (() => { const d = new Date(today); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(), time: '15:00', duration: 90, status: 'Confirmada', notes: '', doctor: 'Dra. Martínez' },
    { id: 4, patient: 'Carlos López', patientEmail: '', patientPhone: '', service: 'Consulta General', date: (() => { const d = new Date(today); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })(), time: '16:00', duration: 30, status: 'Cancelada', notes: '', doctor: 'Dr. López' },
  ]);

  const [view, setView] = useState('list'); // 'list' | 'week'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalApt, setModalApt] = useState(null); // null | apt object
  const [showModal, setShowModal] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  // --- List helpers ---
  const filtered = appointments.filter(a =>
    (!searchTerm || a.patient.toLowerCase().includes(searchTerm.toLowerCase()) || a.service.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterStatus || a.status === filterStatus)
  ).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const openNew = () => { setModalApt(emptyAppointment()); setShowModal(true); };
  const openEdit = (apt) => { setModalApt({ ...apt }); setShowModal(true); };
  const handleSave = (apt) => {
    setAppointments(prev => prev.some(a => a.id === apt.id) ? prev.map(a => a.id === apt.id ? apt : a) : [...prev, apt]);
  };
  const handleDelete = (id) => setAppointments(prev => prev.filter(a => a.id !== id));
  const changeStatus = (id, status) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

  // --- Week calendar helpers ---
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const getAptForSlot = (day, hour) => {
    const dateStr = day.toISOString().split('T')[0];
    return appointments.filter(a => a.date === dateStr && a.time.startsWith(hour.split(':')[0].padStart(2, '0')));
  };

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday  = () => { const d = new Date(today); d.setDate(d.getDate() - d.getDay()); setWeekStart(d); };

  const todayStr = today.toISOString().split('T')[0];
  const todayCount = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelada').length;
  const pendingCount = appointments.filter(a => a.status === 'Pendiente').length;
  const weekCount = appointments.filter(a => {
    const s = weekStart.toISOString().split('T')[0];
    const e = weekDays[6].toISOString().split('T')[0];
    return a.date >= s && a.date <= e && a.status !== 'Cancelada';
  }).length;

  return (
    <div className="agenda-root">
      {/* Stats */}
      <div className="agenda-stats">
        <div className="astat"><span className="astat-num">{todayCount}</span><span className="astat-lbl">Citas Hoy</span></div>
        <div className="astat"><span className="astat-num text-yellow">{pendingCount}</span><span className="astat-lbl">Pendientes</span></div>
        <div className="astat"><span className="astat-num">{weekCount}</span><span className="astat-lbl">Esta Semana</span></div>
        <div className="astat"><span className="astat-num">{appointments.length}</span><span className="astat-lbl">Total</span></div>
      </div>

      {/* Toolbar */}
      <div className="agenda-toolbar">
        <div className="agenda-toolbar-left">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar paciente, servicio..." />
          </div>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="agenda-toolbar-right">
          <div className="view-toggle">
            <button className={`vt-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={16} /></button>
            <button className={`vt-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}><Calendar size={16} /></button>
          </div>
          <button className="btn-new-apt" onClick={openNew}>
            <Plus size={18} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Week Calendar View */}
      {view === 'week' && (
        <div className="week-view-container">
          <div className="week-nav">
            <button className="week-nav-btn" onClick={prevWeek}><ChevronLeft size={18} /></button>
            <span className="week-nav-title">
              {MONTHS_ES[weekStart.getMonth()]} {weekStart.getFullYear()}
            </span>
            <button className="week-nav-btn" onClick={nextWeek}><ChevronRight size={18} /></button>
            <button className="week-today-btn" onClick={goToday}>Hoy</button>
          </div>
          <div className="week-grid">
            <div className="week-time-col">
              <div className="week-header-cell" />
              {HOURS.map(h => <div key={h} className="week-time-label">{h}</div>)}
            </div>
            {weekDays.map((day, di) => {
              const isToday = day.toISOString().split('T')[0] === todayStr;
              return (
                <div key={di} className="week-day-col">
                  <div className={`week-header-cell ${isToday ? 'today-header' : ''}`}>
                    <span className="week-day-name">{DAYS_ES[day.getDay()]}</span>
                    <span className={`week-day-num ${isToday ? 'today-num' : ''}`}>{day.getDate()}</span>
                  </div>
                  {HOURS.map(h => {
                    const apts = getAptForSlot(day, h);
                    return (
                      <div key={h} className={`week-slot ${isToday ? 'today-slot' : ''}`} onClick={() => {
                        const newApt = emptyAppointment();
                        newApt.date = day.toISOString().split('T')[0];
                        newApt.time = h;
                        setModalApt(newApt); setShowModal(true);
                      }}>
                        {apts.map(a => {
                          const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG['Pendiente'];
                          return (
                            <div key={a.id} className="week-apt" style={{ background: cfg.bg, color: cfg.text, borderLeft: `3px solid ${cfg.text}` }}
                              onClick={e => { e.stopPropagation(); openEdit(a); }}>
                              <span className="week-apt-time">{a.time}</span>
                              <span className="week-apt-name">{a.patient}</span>
                              <span className="week-apt-svc">{a.service}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="agenda-table-container">
          <table className="agenda-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Doctor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="no-results">No se encontraron citas</td></tr>
              )}
              {filtered.map(apt => {
                const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG['Pendiente'];
                return (
                  <tr key={apt.id} className={apt.date === todayStr ? 'row-today' : ''}>
                    <td>
                      <div className="patient-cell">
                        <span className="patient-name">{apt.patient}</span>
                        {apt.patientEmail && <span className="patient-email">{apt.patientEmail}</span>}
                      </div>
                    </td>
                    <td>{apt.service}</td>
                    <td>
                      <span className={apt.date === todayStr ? 'today-badge' : ''}>
                        {new Date(apt.date + 'T12:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>{apt.time} <small>({apt.duration}min)</small></td>
                    <td>{apt.doctor || '—'}</td>
                    <td>
                      <select
                        className="status-select"
                        value={apt.status}
                        onChange={e => changeStatus(apt.id, e.target.value)}
                        style={{ background: cfg.bg, color: cfg.text }}
                      >
                        {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="apt-actions">
                        <button className="apt-action-btn edit" title="Editar" onClick={() => openEdit(apt)}><Edit2 size={15} /></button>
                        <button className="apt-action-btn delete" title="Eliminar" onClick={() => handleDelete(apt.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AppointmentModal apt={modalApt} onSave={handleSave} onClose={() => setShowModal(false)} />
      )}

      <style>{`
        .agenda-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .agenda-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .astat { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.25rem; box-shadow: var(--shadow-sm); }
        .astat-num { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); }
        .text-yellow { color: #d97706 !important; }
        .astat-lbl { font-size: 0.8rem; color: var(--text-tertiary); font-weight: 500; }
        .agenda-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
        .agenda-toolbar-left, .agenda-toolbar-right { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .search-bar { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 0.75rem; color: var(--text-tertiary); }
        .search-bar input { padding: 0.55rem 0.75rem 0.55rem 2.25rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit; font-size: 0.875rem; width: 240px; background: var(--bg-primary); color: var(--text-primary); }
        .search-bar input:focus { outline: none; border-color: var(--accent-color); }
        .filter-select { padding: 0.55rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit; font-size: 0.875rem; background: var(--bg-primary); color: var(--text-primary); }
        .view-toggle { display: flex; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; }
        .vt-btn { padding: 0.5rem 0.75rem; background: var(--bg-primary); border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; transition: all 0.2s; }
        .vt-btn.active { background: var(--accent-color); color: #fff; }
        .vt-btn:hover:not(.active) { background: var(--bg-secondary); }
        .btn-new-apt { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.1rem; background: var(--accent-color); color: #fff; border: none; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.2s; }
        .btn-new-apt:hover { background: #1d4ed8; }
        /* Week Calendar */
        .week-view-container { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
        .week-nav { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); }
        .week-nav-btn { background: none; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.35rem; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); }
        .week-nav-btn:hover { background: var(--bg-secondary); }
        .week-nav-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); flex: 1; }
        .week-today-btn { padding: 0.35rem 0.75rem; border: 1px solid var(--accent-color); color: var(--accent-color); border-radius: var(--radius-md); background: none; cursor: pointer; font-size: 0.875rem; font-weight: 600; font-family: inherit; }
        .week-grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); overflow-x: auto; min-width: 600px; }
        .week-time-col { display: flex; flex-direction: column; }
        .week-day-col { display: flex; flex-direction: column; border-left: 1px solid var(--border-color); }
        .week-header-cell { height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); }
        .today-header { background: #eff6ff; }
        .week-day-name { font-size: 0.7rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; }
        .week-day-num { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .today-num { background: var(--accent-color); color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; }
        .week-time-label { height: 64px; display: flex; align-items: flex-start; padding: 4px 6px 0 0; font-size: 0.7rem; color: var(--text-tertiary); text-align: right; border-bottom: 1px solid var(--border-color); }
        .week-slot { height: 64px; border-bottom: 1px solid var(--border-color); padding: 2px 3px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; overflow: hidden; transition: background 0.15s; }
        .week-slot:hover { background: rgba(37,99,235,0.04); }
        .today-slot { background: rgba(37,99,235,0.02); }
        .week-apt { border-radius: 4px; padding: 3px 5px; font-size: 0.7rem; cursor: pointer; overflow: hidden; }
        .week-apt-time { font-weight: 700; display: block; }
        .week-apt-name { font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .week-apt-svc { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; }
        /* Table */
        .agenda-table-container { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow-x: auto; box-shadow: var(--shadow-sm); }
        .agenda-table { width: 100%; border-collapse: collapse; }
        .agenda-table th { background: var(--bg-secondary); padding: 0.875rem 1.25rem; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); text-align: left; }
        .agenda-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); font-size: 0.9rem; }
        .agenda-table tbody tr:last-child td { border-bottom: none; }
        .agenda-table tbody tr:hover { background: rgba(0,0,0,0.015); }
        .row-today { background: rgba(37,99,235,0.03) !important; }
        .patient-cell { display: flex; flex-direction: column; gap: 0.1rem; }
        .patient-name { font-weight: 600; }
        .patient-email { font-size: 0.78rem; color: var(--text-tertiary); }
        .today-badge { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; }
        .no-results { text-align: center; color: var(--text-tertiary); padding: 2rem; }
        .status-select { border: none; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .apt-actions { display: flex; gap: 0.4rem; }
        .apt-action-btn { background: none; border: none; padding: 0.35rem; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; }
        .apt-action-btn.edit { color: var(--text-secondary); }
        .apt-action-btn.edit:hover { background: #dbeafe; color: #1d4ed8; }
        .apt-action-btn.delete { color: var(--text-secondary); }
        .apt-action-btn.delete:hover { background: #fee2e2; color: #ef4444; }
        @media (max-width: 768px) { .agenda-stats { grid-template-columns: repeat(2, 1fr); } .search-bar input { width: 160px; } }
      `}</style>
    </div>
  );
};

export default AgendaPage;
