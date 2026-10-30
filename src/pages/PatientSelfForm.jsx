import React, { useState } from 'react';
import { CheckCircle, User, Heart, AlertCircle, Activity, ChevronRight, ChevronLeft } from 'lucide-react';

// This is a PUBLIC page (no auth required) for patients to pre-fill their clinical history
// Accessed via /paciente/ficha/:patientId

const STEPS = [
  { key: 'personal',   label: 'Datos Personales',  icon: User },
  { key: 'medico',     label: 'Antecedentes',       icon: Heart },
  { key: 'dental',     label: 'Consulta Dental',    icon: Activity },
  { key: 'done',       label: 'Completado',         icon: CheckCircle },
];

const HABITOS = ['Tabaquismo', 'Alcoholismo', 'Bruxismo', 'Onicofagia', 'Respiración bucal'];

const PatientSelfForm = () => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', rut: '', dob: '', gender: '', phone: '', email: '', address: '',
    emergencyContact: '', emergencyPhone: '',
    allergies: '', medications: '', chronicDiseases: '', antFamiliares: '',
    habitos: [],
    motivoConsulta: '', antOdontologicos: '', lastDentistVisit: '', painLevel: '0', sensibility: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleHabito = (h) => {
    const cur = form.habitos;
    set('habitos', cur.includes(h) ? cur.filter(x => x !== h) : [...cur, h]);
  };

  const handleSubmit = () => {
    // In a real app, this would POST to an API
    // For now we store in localStorage so admin can see it
    const key = `patient_form_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ ...form, submittedAt: new Date().toISOString() }));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="spf-done">
        <div className="spf-done-card">
          <div className="spf-done-icon"><CheckCircle size={60} /></div>
          <h2>¡Información enviada!</h2>
          <p>Gracias <strong>{form.name}</strong>. Tu historia clínica ha sido enviada a la clínica exitosamente.</p>
          <p>El equipo revisará tus datos antes de tu consulta.</p>
        </div>
        <style>{`
          .spf-done { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); padding: 2rem; }
          .spf-done-card { background: #fff; border-radius: 20px; padding: 3rem; text-align: center; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
          .spf-done-icon { color: #16a34a; margin-bottom: 1.5rem; }
          .spf-done-card h2 { font-size: 1.75rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1rem; }
          .spf-done-card p { color: #6b7280; line-height: 1.7; margin-bottom: 0.5rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="spf-root">
      <div className="spf-container">
        {/* Header */}
        <div className="spf-header">
          <div className="spf-logo">🦷</div>
          <div>
            <h1>Historia Clínica</h1>
            <p>Clínica Dental MCVD — Por favor complete el formulario antes de su consulta</p>
          </div>
        </div>

        {/* Progress */}
        <div className="spf-progress">
          {STEPS.filter(s => s.key !== 'done').map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className={`spf-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <div className="spf-step-circle">
                  {i < step ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span>{s.label}</span>
                {i < STEPS.length - 2 && <div className={`spf-step-line ${i < step ? 'done' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 0: Personal */}
        {step === 0 && (
          <div className="spf-card">
            <h2><User size={20} /> Datos Personales</h2>
            <div className="spf-grid">
              <div className="spf-field spf-full">
                <label>Nombre Completo *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: María García Rodríguez" />
              </div>
              <div className="spf-field">
                <label>Cédula / RUT *</label>
                <input value={form.rut} onChange={e => set('rut', e.target.value)} placeholder="Ej: V-12.345.678" />
              </div>
              <div className="spf-field">
                <label>Fecha de Nacimiento *</label>
                <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
              </div>
              <div className="spf-field">
                <label>Género</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="spf-field">
                <label>Teléfono *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+58 412 000 0000" />
              </div>
              <div className="spf-field">
                <label>Correo Electrónico</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
              <div className="spf-field spf-full">
                <label>Dirección</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Dirección de residencia" />
              </div>
              <div className="spf-field">
                <label>Contacto de Emergencia</label>
                <input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Nombre del contacto" />
              </div>
              <div className="spf-field">
                <label>Teléfono de Emergencia</label>
                <input value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="+58 412 000 0000" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Medical */}
        {step === 1 && (
          <div className="spf-card">
            <h2><Heart size={20} /> Antecedentes Médicos</h2>
            <div className="spf-grid">
              <div className="spf-field spf-full">
                <label>¿Tiene alguna alergia? (medicamentos, materiales, alimentos)</label>
                <textarea rows={2} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Ej: Penicilina, Látex... Si no tiene, escriba 'Ninguna'" />
              </div>
              <div className="spf-field spf-full">
                <label>Medicamentos que toma actualmente</label>
                <textarea rows={2} value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="Nombre y dosis. Si no toma, escriba 'Ninguno'" />
              </div>
              <div className="spf-field spf-full">
                <label>Enfermedades crónicas o condiciones médicas</label>
                <textarea rows={2} value={form.chronicDiseases} onChange={e => set('chronicDiseases', e.target.value)} placeholder="Ej: Diabetes, Hipertensión, Cardiopatías... Si no tiene, escriba 'Ninguna'" />
              </div>
              <div className="spf-field spf-full">
                <label>Antecedentes familiares relevantes</label>
                <textarea rows={2} value={form.antFamiliares} onChange={e => set('antFamiliares', e.target.value)} placeholder="Enfermedades hereditarias, cardiopatías, diabetes en familia..." />
              </div>
              <div className="spf-field spf-full">
                <label>Hábitos (seleccione todos los que apliquen)</label>
                <div className="spf-habitos">
                  {HABITOS.map(h => (
                    <label key={h} className={`spf-habito ${form.habitos.includes(h) ? 'active' : ''}`}>
                      <input type="checkbox" checked={form.habitos.includes(h)} onChange={() => toggleHabito(h)} />
                      {h}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dental */}
        {step === 2 && (
          <div className="spf-card">
            <h2><Activity size={20} /> Motivo de Consulta</h2>
            <div className="spf-grid">
              <div className="spf-field spf-full">
                <label>¿Por qué viene a la consulta hoy? *</label>
                <textarea rows={3} value={form.motivoConsulta} onChange={e => set('motivoConsulta', e.target.value)} placeholder="Describa su motivo de consulta: dolor, revisión, tratamiento específico..." />
              </div>
              <div className="spf-field">
                <label>¿Cuándo fue su última visita al dentista?</label>
                <input value={form.lastDentistVisit} onChange={e => set('lastDentistVisit', e.target.value)} placeholder="Ej: hace 6 meses, enero 2025..." />
              </div>
              <div className="spf-field spf-full">
                <label>Antecedentes odontológicos (tratamientos previos)</label>
                <textarea rows={2} value={form.antOdontologicos} onChange={e => set('antOdontologicos', e.target.value)} placeholder="Extracciones, endodoncias, ortodoncia, prótesis, implantes..." />
              </div>
              <div className="spf-field spf-full">
                <label>Nivel de dolor actual (0 = sin dolor, 10 = dolor intenso)</label>
                <div className="spf-pain-scale">
                  <span>0</span>
                  <input type="range" min={0} max={10} value={form.painLevel} onChange={e => set('painLevel', e.target.value)} className="spf-range" />
                  <span>10</span>
                  <span className="spf-pain-val">{form.painLevel}</span>
                </div>
              </div>
              <div className="spf-field spf-full">
                <label className="spf-checkbox-label">
                  <input type="checkbox" checked={form.sensibility} onChange={e => set('sensibility', e.target.checked)} />
                  ¿Siente sensibilidad al frío, calor o dulce?
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="spf-nav">
          {step > 0 && (
            <button className="spf-btn spf-btn-back" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={18} /> Anterior
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button
              className="spf-btn spf-btn-next"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && (!form.name || !form.rut || !form.phone)}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="spf-btn spf-btn-submit"
              onClick={handleSubmit}
              disabled={!form.motivoConsulta}
            >
              <CheckCircle size={18} /> Enviar Historia Clínica
            </button>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .spf-root { min-height: 100vh; background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
        .spf-container { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .spf-header { display: flex; align-items: center; gap: 1rem; }
        .spf-logo { font-size: 2.5rem; }
        .spf-header h1 { font-size: 1.75rem; font-weight: 800; color: #1a1a2e; }
        .spf-header p { font-size: 0.875rem; color: #6b7280; margin-top: 0.15rem; }
        .spf-progress { display: flex; align-items: center; background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); gap: 0; }
        .spf-step { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
        .spf-step-circle { width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #9ca3af; flex-shrink: 0; transition: all 0.3s; }
        .spf-step.active .spf-step-circle { background: #2563eb; color: #fff; }
        .spf-step.done .spf-step-circle { background: #16a34a; color: #fff; }
        .spf-step span { font-size: 0.8rem; font-weight: 600; color: #9ca3af; white-space: nowrap; }
        .spf-step.active span { color: #2563eb; }
        .spf-step.done span { color: #16a34a; }
        .spf-step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 0.5rem; }
        .spf-step-line.done { background: #16a34a; }
        .spf-card { background: #fff; border-radius: 20px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .spf-card h2 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1.5rem; }
        .spf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .spf-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .spf-full { grid-column: 1 / -1; }
        .spf-field label { font-size: 0.82rem; font-weight: 600; color: #374151; }
        .spf-field input, .spf-field select, .spf-field textarea { padding: 0.7rem 0.9rem; border: 1.5px solid #e5e7eb; border-radius: 10px; font-family: inherit; font-size: 0.9rem; color: #1a1a2e; transition: all 0.2s; }
        .spf-field input:focus, .spf-field select:focus, .spf-field textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .spf-field textarea { resize: vertical; }
        .spf-habitos { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .spf-habito { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; border-radius: 999px; border: 1.5px solid #e5e7eb; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; user-select: none; }
        .spf-habito input { display: none; }
        .spf-habito.active { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; font-weight: 600; }
        .spf-pain-scale { display: flex; align-items: center; gap: 0.75rem; }
        .spf-range { flex: 1; accent-color: #2563eb; }
        .spf-pain-val { font-size: 1.25rem; font-weight: 800; color: #2563eb; width: 32px; text-align: center; }
        .spf-checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; }
        .spf-nav { display: flex; align-items: center; }
        .spf-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.5rem; border-radius: 12px; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .spf-btn-back { background: #f3f4f6; color: #374151; }
        .spf-btn-back:hover { background: #e5e7eb; }
        .spf-btn-next { background: #2563eb; color: #fff; }
        .spf-btn-next:hover:not(:disabled) { background: #1d4ed8; }
        .spf-btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
        .spf-btn-submit { background: #16a34a; color: #fff; }
        .spf-btn-submit:hover:not(:disabled) { background: #15803d; }
        .spf-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 560px) { .spf-grid { grid-template-columns: 1fr; } .spf-step span { display: none; } }
      `}</style>
    </div>
  );
};

export default PatientSelfForm;
