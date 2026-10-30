import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar as CalendarIcon, Printer, Activity, User, PenTool, Mail, Send } from 'lucide-react';
import Odontogram from '../../components/clinical/Odontogram';
import TreatmentsTab from '../../components/clinical/TreatmentsTab';
import ClinicalHistoryEditor from '../../components/clinical/ClinicalHistoryEditor';
import Periodontodiagrama from '../../components/clinical/Periodontodiagrama';
import SignatureCanvas from '../../components/clinical/SignatureCanvas';
import { sendPatientFormLink } from '../../utils/emailService';

const PatientHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, setPatients } = useOutletContext();

  const patient = patients[id];
  const [activeTab, setActiveTab] = useState('ficha');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  if (!patient) {
    return (
      <div className="cms-page">
        <p>Paciente no encontrado.</p>
        <button className="btn btn-outline" onClick={() => navigate('/admin/patients')}>Volver</button>
      </div>
    );
  }

  const handleOdontogramChange = (newData) => {
    setPatients({ ...patients, [id]: { ...patient, odontogramData: newData } });
  };

  const handleConsentSig = (dataUrl, date) => {
    setPatients({ ...patients, [id]: { ...patient, firmaConsentimiento: dataUrl, firmaFecha: date, consentimientoFirmado: true } });
  };

  const handleSendFormEmail = async () => {
    if (!patient.email) return;
    setSendingEmail(true);
    const result = await sendPatientFormLink({ patientName: patient.name, patientEmail: patient.email, patientId: id });
    setSendingEmail(false);
    if (result.success) setEmailSent(true);
  };

  const tabs = [
    { key: 'ficha',       label: 'Historia Clínica',    icon: FileText },
    { key: 'odontograma', label: 'Odontograma',          icon: Activity },
    { key: 'perio',       label: 'Periodontodiagrama',   icon: Activity },
    { key: 'treatments',  label: 'Tratamientos',         icon: CalendarIcon },
    { key: 'consent',     label: 'Consentimiento',       icon: PenTool },
  ];

  return (
    <div className="cms-page">
      {/* Header */}
      <div className="page-header history-header">
        <div className="history-header-left">
          <button className="btn-icon" onClick={() => navigate('/admin/patients')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="dashboard-title">{patient.name}</h2>
            <p className="text-secondary">
              {patient.rut && `RUT: ${patient.rut} · `}
              {patient.age && `${patient.age} años · `}
              {patient.bloodType && <span style={{ color: '#dc2626', fontWeight: 700 }}>{patient.bloodType}</span>}
              {patient.status && <span className={`ml-2 status-pill ${patient.status === 'Activo' ? 'pill-green' : 'pill-gray'}`}>{patient.status}</span>}
            </p>
          </div>
        </div>
        <div className="header-actions">
          {patient.email && (
            <button
              className="btn btn-outline"
              onClick={handleSendFormEmail}
              disabled={sendingEmail || emailSent}
              title="Enviar enlace al paciente para que llene su historia"
            >
              {emailSent ? <><Send size={16}/> Enviado</> : sendingEmail ? 'Enviando...' : <><Mail size={16}/> Enviar Formulario</>}
            </button>
          )}
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={18} />
            <span className="desktop-only">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'ficha' && (
        <ClinicalHistoryEditor
          patient={patient}
          patients={patients}
          patientId={id}
          setPatients={setPatients}
        />
      )}

      {activeTab === 'odontograma' && (
        <div className="info-card">
          <div className="card-header"><h3>Odontograma Interactivo</h3></div>
          <div className="card-body">
            <Odontogram data={patient.odontogramData || {}} onChange={handleOdontogramChange} />
          </div>
        </div>
      )}

      {activeTab === 'perio' && (
        <div className="info-card">
          <div className="card-header">
            <h3>Periodontodiagrama</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              Registre el sondaje en 6 puntos por diente · Haga clic en los puntos rojo/morado para sangrado/supuración
            </p>
          </div>
          <div className="card-body">
            <Periodontodiagrama
              patient={patient}
              patients={patients}
              patientId={id}
              setPatients={setPatients}
            />
          </div>
        </div>
      )}

      {activeTab === 'treatments' && (
        <TreatmentsTab
          patient={patient}
          patients={patients}
          patientId={id}
          setPatients={setPatients}
        />
      )}

      {activeTab === 'consent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Consent Document */}
          <div className="info-card">
            <div className="card-header"><h3>Consentimiento Informado</h3></div>
            <div className="card-body">
              <div className="consent-doc">
                <h4>CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ODONTOLÓGICO</h4>
                <p>Yo, <strong>{patient.name}</strong>, identificado(a) con cédula <strong>{patient.rut}</strong>, en pleno uso de mis facultades mentales, declaro que:</p>
                <ol>
                  <li>He sido informado(a) sobre mi diagnóstico dental, los tratamientos propuestos, sus riesgos, beneficios y alternativas.</li>
                  <li>He tenido la oportunidad de hacer preguntas y todas han sido respondidas satisfactoriamente.</li>
                  <li>Entiendo que los tratamientos odontológicos, como todo procedimiento médico, conllevan ciertos riesgos.</li>
                  <li>Autorizo al profesional tratante y a su equipo a realizarme los tratamientos necesarios según su criterio clínico.</li>
                  <li>Comprendo que puedo revocar este consentimiento en cualquier momento antes de que comience el procedimiento.</li>
                  <li>Declaro que la información médica proporcionada es verídica y completa.</li>
                </ol>
                <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Fecha: {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="info-card">
            <div className="card-header">
              <h3>Firma Digital del Paciente</h3>
              {patient.consentimientoFirmado && (
                <span className="consent-signed-badge">✓ Firmado el {new Date(patient.firmaFecha).toLocaleDateString()}</span>
              )}
            </div>
            <div className="card-body">
              {patient.firmaConsentimiento && (
                <div className="existing-sig">
                  <p className="sig-label">Firma registrada:</p>
                  <img src={patient.firmaConsentimiento} alt="Firma del paciente" className="sig-preview" />
                </div>
              )}
              <SignatureCanvas
                onSave={handleConsentSig}
                existingSignature={patient.firmaConsentimiento}
                label={patient.firmaConsentimiento ? 'Actualizar Firma' : 'Capturar Firma del Paciente'}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cms-page { display: flex; flex-direction: column; gap: 1.5rem; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .history-header { flex-wrap: wrap; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
        .history-header-left { display: flex; align-items: center; gap: 1.5rem; }
        .dashboard-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem; }
        .text-secondary { color: var(--text-secondary); font-size: 0.9rem; }
        .ml-2 { margin-left: 0.5rem; }
        .status-pill { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
        .pill-green { background: #dcfce7; color: #166534; }
        .pill-gray  { background: #f3f4f6; color: #374151; }
        .btn-icon { background: var(--bg-primary); border: 1px solid var(--border-color); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all 0.2s; }
        .btn-icon:hover { background: var(--bg-secondary); color: var(--accent-color); }
        .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1rem; border-radius: var(--radius-md); font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; font-family: inherit; }
        .btn-primary { background: var(--accent-color); color: white; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-outline { background: transparent; border-color: var(--border-color); color: var(--text-primary); }
        .btn-outline:hover:not(:disabled) { background: var(--bg-secondary); }
        .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
        .tabs-container { display: flex; gap: 0.5rem; flex-wrap: wrap; border-bottom: 1px solid var(--border-color); padding-bottom: 0; margin-bottom: 0.25rem; }
        .tab-btn { background: none; border: none; padding: 0.75rem 1.25rem; font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-bottom: 3px solid transparent; transition: all 0.2s; font-family: inherit; margin-bottom: -1px; }
        .tab-btn:hover { color: var(--accent-color); }
        .tab-btn.active { color: var(--accent-color); border-bottom-color: var(--accent-color); }
        .info-card { background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden; }
        .card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); }
        .card-header h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
        .card-body { padding: 1.5rem; }
        .consent-doc { line-height: 1.8; color: var(--text-primary); }
        .consent-doc h4 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-primary); text-align: center; }
        .consent-doc ol { padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; }
        .consent-signed-badge { font-size: 0.8rem; color: #16a34a; font-weight: 600; margin-top: 0.25rem; display: block; }
        .existing-sig { margin-bottom: 1.5rem; }
        .sig-label { font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem; }
        .sig-preview { max-width: 300px; max-height: 100px; border: 1px solid var(--border-color); border-radius: var(--radius-md); object-fit: contain; background: #fff; }
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .history-header-left { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .tab-label { display: none; }
          .tab-btn { padding: 0.75rem; }
        }
      `}</style>
    </div>
  );
};

export default PatientHistory;
