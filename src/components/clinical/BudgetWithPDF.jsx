import React, { useState, useRef } from 'react';
import { X, FileDown, Send, CheckCircle, PenTool, DollarSign, Trash2 } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';

const BudgetWithPDF = ({ patient, budgetItems, setBudgetItems, exchangeRate, setExchangeRate }) => {
  const [activeView, setActiveView] = useState('budget'); // 'budget' | 'sign'
  const [patientSig, setPatientSig] = useState(patient.firmaPresupuesto || null);
  const [sigDate, setSigDate] = useState(patient.firmaPresupuestoFecha || null);
  const [notes, setNotes] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const printRef = useRef();

  const totalUSD = budgetItems.reduce((s, i) => s + i.priceUSD * i.qty, 0);
  const totalVES = totalUSD * exchangeRate;

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setBudgetItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const handlePDF = async () => {
    setGeneratingPDF(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`Presupuesto_${patient.name?.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) { console.error(e); }
    setGeneratingPDF(false);
  };

  const handleSigSave = (dataUrl, date) => {
    setPatientSig(dataUrl);
    setSigDate(date);
    setActiveView('budget');
  };

  return (
    <div className="bdg-root">
      <div className="bdg-top-bar">
        <div className="bdg-view-tabs">
          <button className={`bdg-vtab ${activeView === 'budget' ? 'active' : ''}`} onClick={() => setActiveView('budget')}>
            <DollarSign size={15} /> Presupuesto
          </button>
          <button className={`bdg-vtab ${activeView === 'sign' ? 'active' : ''}`} onClick={() => setActiveView('sign')}>
            <PenTool size={15} /> Firma Digital
            {patientSig && <span className="bdg-check"><CheckCircle size={13} /></span>}
          </button>
        </div>
        <div className="bdg-top-actions">
          <div className="bdg-exchange">
            <span>Tasa USD/VES:</span>
            <input type="number" value={exchangeRate} onChange={e => setExchangeRate(+e.target.value)} className="bdg-rate-input" />
          </div>
          <button className="bdg-btn bdg-btn-pdf" onClick={handlePDF} disabled={generatingPDF || budgetItems.length === 0}>
            <FileDown size={15} /> {generatingPDF ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {activeView === 'sign' ? (
        <div className="bdg-sign-view">
          <div className="bdg-sign-info">
            <p>El paciente <strong>{patient.name}</strong> debe firmar para aceptar el presupuesto.</p>
            {patientSig && <p className="bdg-signed">✓ Presupuesto firmado el {new Date(sigDate).toLocaleDateString()}</p>}
          </div>
          <SignatureCanvas
            onSave={handleSigSave}
            existingSignature={patientSig}
            label="Firma de Aceptación del Paciente"
          />
          {patientSig && (
            <button className="bdg-btn bdg-btn-danger" onClick={() => { setPatientSig(null); setSigDate(null); }}>
              <Trash2 size={14} /> Eliminar Firma
            </button>
          )}
        </div>
      ) : (
        <div ref={printRef} className="bdg-printable">
          <div className="bdg-header-print">
            <div>
              <h2 className="bdg-title-print">PRESUPUESTO DENTAL</h2>
              <p className="bdg-subtitle-print">Clínica Dental MCVD</p>
            </div>
            <div className="bdg-patient-info-print">
              <p><strong>Paciente:</strong> {patient.name}</p>
              <p><strong>Cédula:</strong> {patient.rut}</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {budgetItems.length === 0 ? (
            <div className="bdg-empty">No hay procedimientos en el presupuesto</div>
          ) : (
            <table className="bdg-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Procedimiento</th>
                  <th>Diente(s)</th>
                  <th>Cant.</th>
                  <th>P. Unit. (USD)</th>
                  <th>Total (USD)</th>
                  <th className="no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td className="bdg-proc-name">{item.name}</td>
                    <td>{item.tooth || '—'}</td>
                    <td>
                      <div className="bdg-qty-ctrl no-print">
                        <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                      </div>
                      <span className="print-only">{item.qty}</span>
                    </td>
                    <td>${item.priceUSD.toFixed(2)}</td>
                    <td>${(item.priceUSD * item.qty).toFixed(2)}</td>
                    <td className="no-print">
                      <button className="bdg-del-btn" onClick={() => setBudgetItems(prev => prev.filter(i => i.id !== item.id))}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bdg-total-row">
                  <td colSpan={5} className="bdg-total-label">TOTAL</td>
                  <td className="bdg-total-usd">${totalUSD.toFixed(2)} USD</td>
                  <td className="no-print" />
                </tr>
                <tr className="bdg-total-ves-row">
                  <td colSpan={5} className="bdg-total-label">Equivalente VES (Tasa: {exchangeRate})</td>
                  <td className="bdg-total-ves">{totalVES.toLocaleString('es-VE')} VES</td>
                  <td className="no-print" />
                </tr>
              </tfoot>
            </table>
          )}

          {notes && <div className="bdg-notes"><strong>Notas:</strong> {notes}</div>}

          <div className="bdg-terms">
            <p>• Este presupuesto tiene validez de 30 días desde la fecha de emisión.</p>
            <p>• Los precios están sujetos a cambios en la tasa de cambio oficial.</p>
            <p>• Este presupuesto no incluye estudios radiográficos adicionales.</p>
          </div>

          <div className="bdg-signature-area">
            <div className="bdg-sig-box">
              {patientSig ? (
                <img src={patientSig} alt="Firma del paciente" className="bdg-sig-img" />
              ) : (
                <div className="bdg-sig-placeholder">Firma del Paciente</div>
              )}
              <div className="bdg-sig-line">
                <p>{patient.name}</p>
                <p className="bdg-sig-sub">Paciente / Representante</p>
                {sigDate && <p className="bdg-sig-sub">{new Date(sigDate).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="bdg-sig-box">
              <div className="bdg-sig-placeholder">Firma del Profesional</div>
              <div className="bdg-sig-line">
                <p>Odontólogo Tratante</p>
                <p className="bdg-sig-sub">Registro Profesional</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'budget' && (
        <div className="bdg-notes-row no-print">
          <label className="bdg-notes-label">Notas del Presupuesto</label>
          <textarea className="bdg-notes-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones, condiciones, garantías..." />
        </div>
      )}

      <style>{`
        .bdg-root { display: flex; flex-direction: column; gap: 1rem; }
        .bdg-top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
        .bdg-view-tabs { display: flex; gap: 0.5rem; }
        .bdg-vtab { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-secondary); font-size: 0.875rem; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .bdg-vtab.active { background: var(--accent-color); color: #fff; border-color: var(--accent-color); }
        .bdg-check { color: #4ade80; }
        .bdg-top-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .bdg-exchange { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
        .bdg-rate-input { width: 70px; padding: 0.35rem 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.875rem; text-align: center; }
        .bdg-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: var(--radius-md); border: none; font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .bdg-btn-pdf { background: #1d4ed8; color: #fff; }
        .bdg-btn-pdf:hover:not(:disabled) { background: #1e40af; }
        .bdg-btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; }
        .bdg-btn-danger { background: #fee2e2; color: #991b1b; margin-top: 0.5rem; }
        .bdg-sign-view { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); }
        .bdg-sign-info p { font-size: 0.9rem; color: var(--text-secondary); }
        .bdg-signed { color: #16a34a !important; font-weight: 600 !important; }
        .bdg-printable { background: #fff; padding: 2rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); color: #1a1a2e; }
        .bdg-header-print { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .bdg-title-print { font-size: 1.5rem; font-weight: 800; color: #2563eb; }
        .bdg-subtitle-print { font-size: 0.9rem; color: #6b7280; margin-top: 0.25rem; }
        .bdg-patient-info-print { text-align: right; font-size: 0.875rem; line-height: 1.8; }
        .bdg-empty { text-align: center; padding: 2rem; color: #9ca3af; font-size: 0.9rem; }
        .bdg-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .bdg-table th { background: #f3f4f6; padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border: 1px solid #e5e7eb; }
        .bdg-table td { padding: 0.7rem 1rem; border: 1px solid #e5e7eb; color: #374151; vertical-align: middle; }
        .bdg-proc-name { font-weight: 500; }
        .bdg-qty-ctrl { display: flex; align-items: center; gap: 0.25rem; }
        .bdg-qty-ctrl button { width: 22px; height: 22px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
        .bdg-qty-ctrl span { width: 24px; text-align: center; font-weight: 600; }
        .print-only { display: none; }
        .bdg-del-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.25rem; border-radius: 4px; }
        .bdg-del-btn:hover { background: #fee2e2; }
        .bdg-total-row td, .bdg-total-ves-row td { border-top: 2px solid #2563eb; }
        .bdg-total-label { text-align: right; font-weight: 700; font-size: 0.875rem; color: #374151; }
        .bdg-total-usd { font-size: 1.125rem; font-weight: 800; color: #2563eb; }
        .bdg-total-ves { font-size: 1rem; font-weight: 700; color: #059669; }
        .bdg-notes { margin-top: 1rem; padding: 0.75rem 1rem; background: #f9fafb; border-left: 3px solid #2563eb; font-size: 0.875rem; }
        .bdg-terms { margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 4px; }
        .bdg-terms p { font-size: 0.8rem; color: #6b7280; line-height: 2; }
        .bdg-signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 3rem; }
        .bdg-sig-box { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .bdg-sig-img { max-width: 200px; max-height: 80px; object-fit: contain; }
        .bdg-sig-placeholder { height: 80px; width: 100%; border-bottom: 2px solid #374151; display: flex; align-items: flex-end; justify-content: center; font-size: 0.75rem; color: #9ca3af; padding-bottom: 0.25rem; }
        .bdg-sig-line { text-align: center; font-size: 0.85rem; font-weight: 600; }
        .bdg-sig-sub { font-size: 0.75rem; color: #6b7280; font-weight: 400; }
        .bdg-notes-row { display: flex; flex-direction: column; gap: 0.35rem; }
        .bdg-notes-label { font-size: 0.8rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; }
        .bdg-notes-input { padding: 0.6rem 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: inherit; resize: vertical; font-size: 0.875rem; background: var(--bg-primary); color: var(--text-primary); }
        .bdg-notes-input:focus { outline: none; border-color: var(--accent-color); }
      `}</style>
    </div>
  );
};

export default BudgetWithPDF;
