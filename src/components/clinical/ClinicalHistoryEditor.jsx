import React, { useState, useCallback } from 'react';
import { Save, ChevronDown, ChevronUp, Plus, X, AlertCircle, Activity, FileText, User, Heart, Stethoscope } from 'lucide-react';

const HABITOS = ['Tabaquismo', 'Alcoholismo', 'Bruxismo', 'Onicofagia', 'Respiración bucal', 'Deglución atípica', 'Succión digital'];
const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'];
const ESCOLARIDADES = ['Sin escolaridad', 'Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Postgrado'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="hce-section">
      <button className="hce-section-header" onClick={() => setOpen(o => !o)}>
        <div className="hce-section-title">
          <Icon size={18} />
          <span>{title}</span>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="hce-section-body">{children}</div>}
    </div>
  );
};

const TagInput = ({ label, tags = [], onChange, placeholder, colorClass = 'tag-blue' }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onChange([...tags, v]); }
    setInput('');
  };
  return (
    <div className="hce-field">
      <label className="hce-label">{label}</label>
      <div className="tag-input-box">
        <div className="tag-input-tags">
          {tags.map((t, i) => (
            <span key={i} className={`htag ${colorClass}`}>
              {t}
              <button onClick={() => onChange(tags.filter((_, j) => j !== i))}><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="tag-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={placeholder}
          />
          <button className="tag-add-btn" onClick={add}><Plus size={14} /></button>
        </div>
      </div>
    </div>
  );
};

const ClinicalHistoryEditor = ({ patient, patients, patientId, setPatients }) => {
  const [form, setForm] = useState({
    name: patient.name || '',
    rut: patient.rut || '',
    dob: patient.dob || '',
    age: patient.age || '',
    gender: patient.gender || '',
    phone: patient.phone || '',
    email: patient.email || '',
    address: patient.address || '',
    bloodType: patient.bloodType || '',
    maritalStatus: patient.maritalStatus || '',
    occupation: patient.occupation || '',
    escolaridad: patient.escolaridad || '',
    emergencyContact: patient.emergencyContact || '',
    emergencyPhone: patient.emergencyPhone || '',
    allergies: patient.allergies || [],
    medications: patient.medications || [],
    chronicDiseases: patient.chronicDiseases || [],
    antFamiliares: patient.antFamiliares || [],
    habitos: patient.habitos || [],
    motivoConsulta: patient.motivoConsulta || '',
    enfermedadActual: patient.enfermedadActual || '',
    antOdontologicos: patient.antOdontologicos || '',
    examenExtraoral: patient.examenExtraoral || '',
    examenIntraoral: patient.examenIntraoral || '',
    examenOclusal: patient.examenOclusal || '',
    diagnostico: patient.diagnostico || '',
    planTratamiento: patient.planTratamiento || '',
    vitalSigns: patient.vitalSigns || { bloodPressure: '', heartRate: '', weight: '', height: '', lastCheck: '' },
    consentimientoFirmado: patient.consentimientoFirmado || false,
    firmaConsentimiento: patient.firmaConsentimiento || null,
    firmaFecha: patient.firmaFecha || null,
  });
  const [saved, setSaved] = useState(false);

  const set = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);
  const setVital = useCallback((key, val) => setForm(f => ({ ...f, vitalSigns: { ...f.vitalSigns, [key]: val } })), []);

  const toggleHabito = (h) => {
    const cur = form.habitos;
    set('habitos', cur.includes(h) ? cur.filter(x => x !== h) : [...cur, h]);
  };

  const handleSave = () => {
    setPatients({ ...patients, [patientId]: { ...patient, ...form } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="hce-root">
      <Section title="Datos Personales" icon={User}>
        <div className="hce-grid-3">
          <div className="hce-field">
            <label className="hce-label">Nombre Completo</label>
            <input className="hce-input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">RUT / Cédula</label>
            <input className="hce-input" value={form.rut} onChange={e => set('rut', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Fecha de Nacimiento</label>
            <input type="date" className="hce-input" value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Edad</label>
            <input className="hce-input" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Género</label>
            <select className="hce-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Seleccionar</option>
              <option>Masculino</option>
              <option>Femenino</option>
              <option>Otro</option>
            </select>
          </div>
          <div className="hce-field">
            <label className="hce-label">Grupo Sanguíneo</label>
            <select className="hce-input" value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
              <option value="">Seleccionar</option>
              {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="hce-field">
            <label className="hce-label">Teléfono</label>
            <input className="hce-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Correo Electrónico</label>
            <input type="email" className="hce-input" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Dirección</label>
            <input className="hce-input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Estado Civil</label>
            <select className="hce-input" value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)}>
              <option value="">Seleccionar</option>
              {ESTADOS_CIVILES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="hce-field">
            <label className="hce-label">Ocupación</label>
            <input className="hce-input" value={form.occupation} onChange={e => set('occupation', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Escolaridad</label>
            <select className="hce-input" value={form.escolaridad} onChange={e => set('escolaridad', e.target.value)}>
              <option value="">Seleccionar</option>
              {ESCOLARIDADES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="hce-field">
            <label className="hce-label">Contacto de Emergencia</label>
            <input className="hce-input" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Teléfono Emergencia</label>
            <input className="hce-input" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Signos Vitales" icon={Heart}>
        <div className="hce-grid-3">
          <div className="hce-field">
            <label className="hce-label">Presión Arterial (mmHg)</label>
            <input className="hce-input" placeholder="120/80" value={form.vitalSigns.bloodPressure} onChange={e => setVital('bloodPressure', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Frec. Cardíaca (lpm)</label>
            <input className="hce-input" placeholder="72" value={form.vitalSigns.heartRate} onChange={e => setVital('heartRate', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Peso (kg)</label>
            <input className="hce-input" type="number" value={form.vitalSigns.weight || ''} onChange={e => setVital('weight', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Talla (cm)</label>
            <input className="hce-input" type="number" value={form.vitalSigns.height || ''} onChange={e => setVital('height', e.target.value)} />
          </div>
          <div className="hce-field">
            <label className="hce-label">Fecha de Toma</label>
            <input type="date" className="hce-input" value={form.vitalSigns.lastCheck} onChange={e => setVital('lastCheck', e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Anamnesis Médica" icon={AlertCircle}>
        <div className="hce-grid-2">
          <TagInput label="Alergias" tags={form.allergies} onChange={v => set('allergies', v)} placeholder="Ej: Penicilina + Enter" colorClass="htag-red" />
          <TagInput label="Medicamentos Actuales" tags={form.medications} onChange={v => set('medications', v)} placeholder="Ej: Eutirox 50mcg + Enter" colorClass="htag-purple" />
          <TagInput label="Enfermedades Crónicas" tags={form.chronicDiseases} onChange={v => set('chronicDiseases', v)} placeholder="Ej: Diabetes tipo 2 + Enter" colorClass="htag-blue" />
          <TagInput label="Antecedentes Familiares" tags={form.antFamiliares} onChange={v => set('antFamiliares', v)} placeholder="Ej: Hipertensión + Enter" colorClass="htag-orange" />
        </div>
        <div className="hce-field" style={{ marginTop: '1rem' }}>
          <label className="hce-label">Hábitos</label>
          <div className="habitos-grid">
            {HABITOS.map(h => (
              <label key={h} className={`habito-chip ${form.habitos.includes(h) ? 'active' : ''}`}>
                <input type="checkbox" checked={form.habitos.includes(h)} onChange={() => toggleHabito(h)} />
                {h}
              </label>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Anamnesis Odontológica" icon={Activity}>
        <div className="hce-field">
          <label className="hce-label">Motivo de Consulta</label>
          <textarea className="hce-input hce-textarea" rows={3} value={form.motivoConsulta} onChange={e => set('motivoConsulta', e.target.value)} placeholder="Describa el motivo de consulta del paciente..." />
        </div>
        <div className="hce-field">
          <label className="hce-label">Enfermedad Actual</label>
          <textarea className="hce-input hce-textarea" rows={3} value={form.enfermedadActual} onChange={e => set('enfermedadActual', e.target.value)} placeholder="Descripción de la enfermedad o problema actual..." />
        </div>
        <div className="hce-field">
          <label className="hce-label">Antecedentes Odontológicos</label>
          <textarea className="hce-input hce-textarea" rows={3} value={form.antOdontologicos} onChange={e => set('antOdontologicos', e.target.value)} placeholder="Tratamientos anteriores, cirugías, ortodoncia..." />
        </div>
      </Section>

      <Section title="Examen Clínico" icon={Stethoscope}>
        <div className="hce-field">
          <label className="hce-label">Examen Extraoral</label>
          <textarea className="hce-input hce-textarea" rows={3} value={form.examenExtraoral} onChange={e => set('examenExtraoral', e.target.value)} placeholder="ATM, músculos masticatorios, ganglios, asimetrías faciales..." />
        </div>
        <div className="hce-field">
          <label className="hce-label">Examen Intraoral</label>
          <textarea className="hce-input hce-textarea" rows={3} value={form.examenIntraoral} onChange={e => set('examenIntraoral', e.target.value)} placeholder="Tejidos blandos, mucosas, lengua, piso de boca, paladar..." />
        </div>
        <div className="hce-field">
          <label className="hce-label">Examen Oclusal</label>
          <textarea className="hce-input hce-textarea" rows={2} value={form.examenOclusal} onChange={e => set('examenOclusal', e.target.value)} placeholder="Clase molar, overjet, overbite, línea media..." />
        </div>
      </Section>

      <Section title="Diagnóstico y Plan de Tratamiento" icon={FileText}>
        <div className="hce-field">
          <label className="hce-label">Diagnóstico</label>
          <textarea className="hce-input hce-textarea" rows={3} value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} placeholder="Diagnóstico clínico..." />
        </div>
        <div className="hce-field">
          <label className="hce-label">Plan de Tratamiento</label>
          <textarea className="hce-input hce-textarea" rows={4} value={form.planTratamiento} onChange={e => set('planTratamiento', e.target.value)} placeholder="Secuencia de tratamiento propuesta..." />
        </div>
      </Section>

      <div className="hce-save-bar">
        {saved && <span className="hce-saved-msg">✓ Cambios guardados exitosamente</span>}
        <button className="hce-save-btn" onClick={handleSave}>
          <Save size={18} />
          Guardar Historia Clínica
        </button>
      </div>

      <style>{`
        .hce-root { display: flex; flex-direction: column; gap: 1rem; }
        .hce-section { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
        .hce-section-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: var(--bg-secondary); border: none; cursor: pointer; transition: background 0.2s; }
        .hce-section-header:hover { background: var(--bg-tertiary, var(--bg-secondary)); }
        .hce-section-title { display: flex; align-items: center; gap: 0.75rem; font-size: 1rem; font-weight: 600; color: var(--text-primary); }
        .hce-section-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .hce-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        .hce-grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
        .hce-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .hce-label { font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }
        .hce-input { padding: 0.6rem 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit; font-size: 0.9rem; color: var(--text-primary); background: var(--bg-primary); transition: all 0.2s; }
        .hce-input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .hce-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
        .tag-input-box { border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem; background: var(--bg-primary); display: flex; flex-direction: column; gap: 0.5rem; transition: border-color 0.2s; }
        .tag-input-box:focus-within { border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .tag-input-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .tag-input-row { display: flex; gap: 0.5rem; }
        .tag-input-row input { flex: 1; border: none; outline: none; font-family: inherit; font-size: 0.875rem; background: transparent; color: var(--text-primary); }
        .tag-add-btn { background: var(--accent-color); color: #fff; border: none; border-radius: var(--radius-sm); width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .htag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .htag button { background: none; border: none; cursor: pointer; display: flex; align-items: center; opacity: 0.7; }
        .htag button:hover { opacity: 1; }
        .htag-red { background: #fee2e2; color: #b91c1c; }
        .htag-blue { background: #dbeafe; color: #1d4ed8; }
        .htag-purple { background: #f3e8ff; color: #7e22ce; }
        .htag-orange { background: #ffedd5; color: #c2410c; }
        .habitos-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .habito-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 999px; border: 1.5px solid var(--border-color); font-size: 0.85rem; cursor: pointer; transition: all 0.2s; background: var(--bg-primary); color: var(--text-secondary); user-select: none; }
        .habito-chip input { display: none; }
        .habito-chip.active { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; font-weight: 600; }
        .habito-chip:hover { border-color: var(--accent-color); }
        .hce-save-bar { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; padding: 1.25rem 0; border-top: 1px solid var(--border-color); }
        .hce-saved-msg { font-size: 0.875rem; color: #16a34a; font-weight: 500; }
        .hce-save-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--accent-color); color: #fff; border: none; border-radius: var(--radius-md); font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: inherit; }
        .hce-save-btn:hover { background: #1d4ed8; }
      `}</style>
    </div>
  );
};

export default ClinicalHistoryEditor;
