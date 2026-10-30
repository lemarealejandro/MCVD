import React, { useState, useCallback } from 'react';
import { Save, Info } from 'lucide-react';

// Teeth: 18 upper right to 11, 21 to 28, 38 lower left to 31, 41 to 48
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [38, 37, 36, 35, 34, 33, 32, 31];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

const POINTS_LABELS = ['DB', 'B', 'MB', 'DL', 'L', 'ML'];
const POINT_COLORS = { 0: '#22c55e', 1: '#86efac', 2: '#fbbf24', 3: '#f97316', 4: '#ef4444', 5: '#b91c1c', 6: '#7f1d1d' };

const defaultTooth = () => ({
  sondaje: [0, 0, 0, 0, 0, 0],
  sangrado: [false, false, false, false, false, false],
  supuracion: [false, false, false, false, false, false],
  recesion: [0, 0, 0, 0, 0, 0],
  movilidad: 0,
  furcacion: 0,
  implante: false,
  ausente: false,
  placa: false,
});

const ToothColumn = ({ num, data, onChange }) => {
  const d = data || defaultTooth();
  const update = (key, val) => onChange(num, { ...d, [key]: val });
  const updateArr = (key, idx, val) => {
    const arr = [...d[key]];
    arr[idx] = val;
    onChange(num, { ...d, [key]: arr });
  };

  const getColor = (v) => POINT_COLORS[Math.min(v, 6)] || '#22c55e';

  return (
    <div className={`pdt-col ${d.ausente ? 'pdt-absent' : ''} ${d.implante ? 'pdt-implant' : ''}`}>
      {/* Tooth number */}
      <div className="pdt-tooth-num">{num}</div>

      {/* Furcación */}
      <div className="pdt-cell pdt-center">
        <select className="pdt-micro-select" value={d.furcacion} onChange={e => update('furcacion', +e.target.value)} title="Furcación">
          {[0,1,2,3].map(v => <option key={v} value={v}>{v === 0 ? '-' : `F${v}`}</option>)}
        </select>
      </div>

      {/* Movilidad */}
      <div className="pdt-cell pdt-center">
        <select className="pdt-micro-select" value={d.movilidad} onChange={e => update('movilidad', +e.target.value)} title="Movilidad">
          {[0,1,2,3].map(v => <option key={v} value={v}>{v === 0 ? '-' : `M${v}`}</option>)}
        </select>
      </div>

      {/* Placa */}
      <div className="pdt-cell pdt-center">
        <input type="checkbox" checked={d.placa} onChange={e => update('placa', e.target.checked)} title="Placa" className="pdt-check" />
      </div>

      {/* Sondaje (6 puntos) */}
      <div className="pdt-sondaje-grid">
        {d.sondaje.map((v, i) => (
          <div key={i} className="pdt-sondaje-cell">
            <div className="pdt-sangrado-dot" style={{ background: d.sangrado[i] ? '#ef4444' : 'transparent', border: '1.5px solid #e5e7eb' }} onClick={() => updateArr('sangrado', i, !d.sangrado[i])} title="Sangrado" />
            <input
              type="number" min={0} max={12}
              className="pdt-sondaje-input"
              style={{ borderColor: getColor(v) }}
              value={v}
              onChange={e => updateArr('sondaje', i, +e.target.value)}
            />
            <input
              type="number" min={-5} max={10}
              className="pdt-rec-input"
              value={d.recesion[i]}
              onChange={e => updateArr('recesion', i, +e.target.value)}
              title="Recesión"
            />
            <div className="pdt-supuracion-dot" style={{ background: d.supuracion[i] ? '#a855f7' : 'transparent', border: '1.5px solid #e5e7eb' }} onClick={() => updateArr('supuracion', i, !d.supuracion[i])} title="Supuración" />
          </div>
        ))}
      </div>

      {/* Absent / Implant toggles */}
      <div className="pdt-toggles">
        <button className={`pdt-tiny-btn ${d.ausente ? 'active-red' : ''}`} onClick={() => update('ausente', !d.ausente)} title="Ausente">A</button>
        <button className={`pdt-tiny-btn ${d.implante ? 'active-blue' : ''}`} onClick={() => update('implante', !d.implante)} title="Implante">I</button>
      </div>
    </div>
  );
};

const QuadrantRow = ({ teeth, data, onChange, label }) => (
  <div className="pdt-quadrant">
    <div className="pdt-quad-label">{label}</div>
    <div className="pdt-teeth-row">
      {teeth.map(num => (
        <ToothColumn key={num} num={num} data={data[num]} onChange={onChange} />
      ))}
    </div>
  </div>
);

const Periodontodiagrama = ({ patient, patients, patientId, setPatients }) => {
  const [data, setData] = useState(patient.perioData || {});
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((num, toothData) => {
    setData(prev => ({ ...prev, [num]: toothData }));
  }, []);

  const handleSave = () => {
    setPatients({ ...patients, [patientId]: { ...patient, perioData: data } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Calculate indices
  const allTeeth = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT];
  const present = allTeeth.filter(n => !data[n]?.ausente);
  const withBleeding = allTeeth.filter(n => data[n]?.sangrado?.some(Boolean));
  const ibs = present.length > 0 ? ((withBleeding.length / present.length) * 100).toFixed(1) : 0;

  const allSondajes = allTeeth.flatMap(n => data[n]?.sondaje || []).filter(v => v > 0);
  const avgSondaje = allSondajes.length > 0 ? (allSondajes.reduce((a, b) => a + b, 0) / allSondajes.length).toFixed(1) : 0;
  const maxSondaje = allSondajes.length > 0 ? Math.max(...allSondajes) : 0;

  return (
    <div className="pdt-root">
      <div className="pdt-indices-bar">
        <div className="pdt-index-card">
          <span className="pdt-idx-label">Dientes Presentes</span>
          <span className="pdt-idx-value">{present.length}</span>
        </div>
        <div className="pdt-index-card">
          <span className="pdt-idx-label">Índice de Sangrado</span>
          <span className="pdt-idx-value" style={{ color: +ibs > 30 ? '#ef4444' : '#16a34a' }}>{ibs}%</span>
        </div>
        <div className="pdt-index-card">
          <span className="pdt-idx-label">Sondaje Promedio</span>
          <span className="pdt-idx-value" style={{ color: +avgSondaje > 4 ? '#f97316' : '#16a34a' }}>{avgSondaje} mm</span>
        </div>
        <div className="pdt-index-card">
          <span className="pdt-idx-label">Sondaje Máximo</span>
          <span className="pdt-idx-value" style={{ color: +maxSondaje > 5 ? '#ef4444' : '#16a34a' }}>{maxSondaje} mm</span>
        </div>
      </div>

      <div className="pdt-legend">
        <div className="pdt-legend-item"><div className="pdt-dot" style={{ background: '#ef4444' }} /> Sangrado al sondaje (click en punto rojo)</div>
        <div className="pdt-legend-item"><div className="pdt-dot" style={{ background: '#a855f7' }} /> Supuración (click en punto morado)</div>
        <div className="pdt-legend-item"><span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', border: '1px solid', borderRadius: 3, padding: '0 4px' }}>A</span> Ausente</div>
        <div className="pdt-legend-item"><span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0891b2', border: '1px solid', borderRadius: 3, padding: '0 4px' }}>I</span> Implante</div>
        <div className="pdt-legend-item"><div style={{ display: 'flex', gap: 3 }}>{Object.entries(POINT_COLORS).map(([k, c]) => <div key={k} style={{ width: 14, height: 14, background: c, borderRadius: 3 }} title={`${k}mm`} />)}</div> Profundidad</div>
      </div>

      <div className="pdt-labels-row">
        {POINTS_LABELS.map(l => <div key={l} className="pdt-pt-label-global">{l}</div>)}
      </div>

      <div className="pdt-scroll-wrapper">
        <div className="pdt-arch">
          <div className="pdt-arch-label">SUPERIOR</div>
          <div className="pdt-arch-row">
            <QuadrantRow teeth={UPPER_RIGHT} data={data} onChange={handleChange} label="DR" />
            <div className="pdt-arch-divider" />
            <QuadrantRow teeth={UPPER_LEFT} data={data} onChange={handleChange} label="DI" />
          </div>
        </div>

        <div className="pdt-arch-separator" />

        <div className="pdt-arch">
          <div className="pdt-arch-label">INFERIOR</div>
          <div className="pdt-arch-row">
            <QuadrantRow teeth={LOWER_LEFT} data={data} onChange={handleChange} label="II" />
            <div className="pdt-arch-divider" />
            <QuadrantRow teeth={LOWER_RIGHT} data={data} onChange={handleChange} label="ID" />
          </div>
        </div>
      </div>

      <div className="pdt-save-bar">
        {saved && <span className="pdt-saved">✓ Periodontodiagrama guardado</span>}
        <button className="pdt-save-btn" onClick={handleSave}>
          <Save size={16} /> Guardar Periodontodiagrama
        </button>
      </div>

      <style>{`
        .pdt-root { display: flex; flex-direction: column; gap: 1rem; }
        .pdt-indices-bar { display: flex; gap: 1rem; flex-wrap: wrap; }
        .pdt-index-card { flex: 1; min-width: 120px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; box-shadow: var(--shadow-sm); }
        .pdt-idx-label { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 500; text-transform: uppercase; }
        .pdt-idx-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
        .pdt-legend { display: flex; flex-wrap: wrap; gap: 1rem; padding: 0.75rem 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
        .pdt-legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-secondary); }
        .pdt-dot { width: 12px; height: 12px; border-radius: 50%; }
        .pdt-scroll-wrapper { overflow-x: auto; padding-bottom: 1rem; }
        .pdt-arch { display: flex; flex-direction: column; gap: 0.5rem; }
        .pdt-arch-label { font-size: 0.75rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; text-align: center; padding: 0.25rem 0; }
        .pdt-arch-row { display: flex; align-items: flex-start; gap: 0; }
        .pdt-arch-divider { width: 2px; background: var(--border-color); margin: 0 4px; align-self: stretch; }
        .pdt-arch-separator { height: 24px; border-top: 2px dashed var(--border-color); margin: 8px 0; }
        .pdt-quadrant { display: flex; gap: 2px; }
        .pdt-quad-label { writing-mode: vertical-rl; font-size: 0.65rem; color: var(--text-tertiary); font-weight: 700; padding: 0 2px; }
        .pdt-teeth-row { display: flex; gap: 2px; }
        .pdt-labels-row { display: none; }
        .pdt-col { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 52px; padding: 2px; border-radius: 4px; transition: background 0.2s; }
        .pdt-col:hover { background: rgba(37,99,235,0.04); }
        .pdt-absent { opacity: 0.35; }
        .pdt-implant { background: rgba(8,145,178,0.05); }
        .pdt-tooth-num { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); height: 18px; display: flex; align-items: center; }
        .pdt-cell { height: 20px; display: flex; align-items: center; justify-content: center; }
        .pdt-center { justify-content: center; }
        .pdt-micro-select { width: 42px; height: 18px; font-size: 0.65rem; border: 1px solid var(--border-color); border-radius: 3px; text-align: center; background: var(--bg-primary); color: var(--text-primary); }
        .pdt-check { width: 14px; height: 14px; accent-color: var(--accent-color); cursor: pointer; }
        .pdt-sondaje-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; width: 100%; }
        .pdt-sondaje-cell { display: flex; flex-direction: column; align-items: center; gap: 1px; }
        .pdt-sangrado-dot, .pdt-supuracion-dot { width: 8px; height: 8px; border-radius: 50%; cursor: pointer; transition: background 0.15s; }
        .pdt-sondaje-input { width: 100%; height: 22px; text-align: center; font-size: 0.75rem; font-weight: 700; border: 1.5px solid; border-radius: 3px; background: var(--bg-primary); color: var(--text-primary); padding: 0; }
        .pdt-rec-input { width: 100%; height: 18px; text-align: center; font-size: 0.65rem; border: 1px solid #e5e7eb; border-radius: 3px; color: #6b7280; padding: 0; background: transparent; }
        .pdt-toggles { display: flex; gap: 2px; margin-top: 2px; }
        .pdt-tiny-btn { font-size: 0.6rem; font-weight: 700; width: 20px; height: 16px; border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; background: var(--bg-primary); color: var(--text-secondary); transition: all 0.15s; }
        .active-red { background: #fee2e2 !important; color: #b91c1c !important; border-color: #fca5a5 !important; }
        .active-blue { background: #cffafe !important; color: #0891b2 !important; border-color: #67e8f9 !important; }
        .pdt-save-bar { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
        .pdt-saved { font-size: 0.875rem; color: #16a34a; font-weight: 500; }
        .pdt-save-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; background: var(--accent-color); color: #fff; border: none; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .pdt-save-btn:hover { background: #1d4ed8; }
      `}</style>
    </div>
  );
};

export default Periodontodiagrama;
