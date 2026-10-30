import React, { useState } from 'react';
import { Eraser, Info } from 'lucide-react';

/* ── Condition palette ───────────────────────────── */
const CONDITIONS = [
  { id: 'caries',  label: 'Caries',        color: '#ef4444', light: '#fee2e2' },
  { id: 'filling', label: 'Restauración',  color: '#3b82f6', light: '#dbeafe' },
  { id: 'crown',   label: 'Corona',        color: '#8b5cf6', light: '#ede9fe' },
  { id: 'planned', label: 'Plan de Tx',    color: '#f59e0b', light: '#fef3c7' },
  { id: 'absent',  label: 'Ausente/Ext.',  color: '#374151', light: '#f3f4f6' },
  { id: 'eraser',  label: 'Borrador',      color: '#94a3b8', light: '#f1f5f9', isEraser: true },
];

/* ── Tooth layout ────────────────────────────────── */
const UPPER = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
const LOWER = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];

const pos   = n => n % 10;
const isUpper = n => Math.floor(n/10) <= 2;
const typeOf  = n => {
  const p = pos(n);
  if (p <= 2) return 'incisor';
  if (p === 3) return 'canine';
  if (p <= 5) return 'premolar';
  return 'molar';
};

/* ── SVG tooth silhouettes ───────────────────────── */
// Each tooth lives in a 36×80 viewBox.
// Upper teeth: root at top, crown at bottom (pointing toward bite line).
// Lower teeth: crown at top, root at bottom.

function ToothShape({ num, surfaceData = {}, absent }) {
  const upper = isUpper(num);
  const type  = typeOf(num);
  const sc    = '#4b5563';  // stroke colour
  const sw    = 1.2;

  const surfFill = s => CONDITIONS.find(c => c.id === (surfaceData[s] || 'none'))?.color ?? 'none';

  // ── Buccal-view SVG paths (crown + roots) ──────────
  const shapes = {
    // UPPER incisors  (crown bottom, root top)
    incisor_upper: <>
      <path d="M13,35 C12,20 12,8 13,2 Q15,0 18,2 Q21,0 23,2 C24,8 24,20 23,35Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M7,56 C7,44 8,37 9,35 L27,35 C28,37 29,44 29,56 Q28,66 18,68 Q8,66 7,56Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <line x1="8"  y1="66" x2="28" y2="66" stroke={sc} strokeWidth="0.6" opacity="0.5"/>
    </>,
    // UPPER canine
    canine_upper: <>
      <path d="M15,35 C14,20 13,8 14,2 Q16,0 18,0 Q20,0 22,2 C23,8 22,20 21,35Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M7,55 C7,44 8,37 9,35 L27,35 C28,37 29,44 29,55 Q22,72 18,74 Q14,72 7,55Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
    </>,
    // UPPER premolar
    premolar_upper: <>
      <path d="M10,35 C9,22 9,10 10,3 C11,0 14,0 15,3 C16,6 16,20 15,35Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M20,35 C19,22 19,10 20,3 C21,0 24,0 25,3 C26,6 26,20 25,35Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M6,55 C6,44 7,37 8,35 L28,35 C29,37 30,44 30,55 Q29,66 18,68 Q7,66 6,55Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <line x1="18" y1="35" x2="18" y2="45" stroke={sc} strokeWidth="0.8"/>
    </>,
    // UPPER molar
    molar_upper: <>
      <path d="M5,35 C5,24 6,12 7,5 C8,1 11,0 13,2 C14,5 14,20 14,35Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M22,35 C22,20 22,5 23,2 C25,0 28,1 29,5 C30,12 31,24 31,35Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M4,52 C4,41 4,37 6,35 L30,35 C32,37 32,41 32,52 Q31,65 18,67 Q5,65 4,52Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <line x1="5"  y1="48" x2="31" y2="48" stroke={sc} strokeWidth="0.7" opacity="0.5"/>
    </>,

    // LOWER incisors  (crown top, root bottom)
    incisor_lower: <>
      <path d="M7,24 C7,14 8,8 9,6 Q14,0 18,0 Q22,0 27,6 C28,8 29,14 29,24Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <line x1="8"  y1="5" x2="28" y2="5" stroke={sc} strokeWidth="0.6" opacity="0.5"/>
      <path d="M13,24 C12,40 12,55 13,68 Q15,72 18,72 Q21,72 23,68 C24,55 24,40 23,24Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
    </>,
    // LOWER canine
    canine_lower: <>
      <path d="M7,25 C7,16 10,6 14,2 Q16,0 18,0 Q20,0 22,2 C26,6 29,16 29,25Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M15,25 C14,40 13,55 14,68 Q16,72 18,72 Q20,72 22,68 C23,55 22,40 21,25Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
    </>,
    // LOWER premolar
    premolar_lower: <>
      <path d="M6,26 C6,16 7,8 9,5 Q14,0 18,0 Q22,0 27,5 C29,8 30,16 30,26Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <line x1="18" y1="1" x2="18" y2="14" stroke={sc} strokeWidth="0.8"/>
      <path d="M10,26 C9,40 9,55 10,68 C11,72 14,73 16,70 C17,60 17,40 16,26Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M20,26 C19,40 19,60 20,70 C22,73 25,72 26,68 C27,55 27,40 26,26Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
    </>,
    // LOWER molar
    molar_lower: <>
      <path d="M4,24 C4,14 4,8 6,5 Q12,0 18,0 Q24,0 30,5 C32,8 32,14 32,24Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <line x1="5"  y1="17" x2="31" y2="17" stroke={sc} strokeWidth="0.7" opacity="0.5"/>
      <path d="M5,24 C5,38 5,52 6,65 C7,70 10,72 13,70 C14,58 14,38 13,24Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
      <path d="M23,24 C22,38 22,58 23,70 C26,72 29,70 30,65 C31,52 31,38 31,24Z"
            fill="white" stroke={sc} strokeWidth={sw}/>
    </>,
  };

  const key = `${type}_${upper ? 'upper' : 'lower'}`;

  if (absent) {
    return (
      <svg viewBox="0 0 36 80" width="36" height="80">
        {shapes[key]}
        <line x1="4" y1="4"  x2="32" y2="76" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="32" y1="4" x2="4"  y2="76" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 80" width="36" height="80">
      {shapes[key]}
    </svg>
  );
}

/* ── 5-surface occlusal view ─────────────────────── */
// Pentagon divided into 5 triangles: top(vestibular), bottom(lingual/palatal),
// left(mesial), right(distal), center(oclusal).
function OcclusalView({ data = {}, onSurface, absent }) {
  if (absent) return (
    <div style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:'0.7rem' }}>---</div>
  );

  const fill = s => CONDITIONS.find(c => c.id === (data[s]||'none'))?.color ?? '#f1f5f9';

  return (
    <svg viewBox="0 0 34 34" width="34" height="34" style={{ cursor:'pointer' }}>
      <rect x="0" y="0" width="34" height="34" rx="3" fill="#e5e7eb"/>
      {/* Top - Vestibular */}
      <polygon points="0,0 34,0 24,10 10,10" fill={fill('top')}
               onClick={() => onSurface('top')} style={{ cursor:'pointer' }}>
        <title>Vestibular</title>
      </polygon>
      {/* Bottom - Lingual/Palatine */}
      <polygon points="0,34 34,34 24,24 10,24" fill={fill('bottom')}
               onClick={() => onSurface('bottom')} style={{ cursor:'pointer' }}>
        <title>Lingual/Palatino</title>
      </polygon>
      {/* Left - Mesial */}
      <polygon points="0,0 0,34 10,24 10,10" fill={fill('left')}
               onClick={() => onSurface('left')} style={{ cursor:'pointer' }}>
        <title>Mesial</title>
      </polygon>
      {/* Right - Distal */}
      <polygon points="34,0 34,34 24,24 24,10" fill={fill('right')}
               onClick={() => onSurface('right')} style={{ cursor:'pointer' }}>
        <title>Distal</title>
      </polygon>
      {/* Center - Occlusal */}
      <rect x="10" y="10" width="14" height="14" fill={fill('center')}
            onClick={() => onSurface('center')} style={{ cursor:'pointer' }}>
        <title>Oclusal</title>
      </rect>
      <rect x="0" y="0" width="34" height="34" rx="3" fill="none" stroke="#d1d5db" strokeWidth="1"/>
    </svg>
  );
}

/* ── Single tooth cell ───────────────────────────── */
function ToothCell({ num, data = {}, selectedCondition, onChange }) {
  const upper   = isUpper(num);
  const absent  = data.whole === 'absent';

  const handleSurface = s => {
    if (selectedCondition === 'absent') return;
    const next = { ...data };
    if (selectedCondition === 'eraser') { delete next[s]; }
    else { next[s] = selectedCondition; delete next.whole; }
    onChange(num, next);
  };

  const handleTooth = () => {
    if (selectedCondition !== 'absent') return;
    onChange(num, absent ? {} : { whole: 'absent' });
  };

  const numLabel = (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, color: '#6b7280',
      lineHeight: 1, display: 'block', textAlign: 'center', userSelect: 'none'
    }}>{num}</span>
  );

  return (
    <div
      onClick={selectedCondition === 'absent' ? handleTooth : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        cursor: selectedCondition === 'absent' ? 'pointer' : 'default',
        padding: '2px', borderRadius: 6,
        background: absent ? '#f9fafb' : 'transparent',
        border: absent ? '1px dashed #d1d5db' : '1px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      {upper ? (
        <>
          {numLabel}
          <OcclusalView data={data} onSurface={handleSurface} absent={absent}/>
          <ToothShape   num={num} surfaceData={data} absent={absent}/>
        </>
      ) : (
        <>
          <ToothShape   num={num} surfaceData={data} absent={absent}/>
          <OcclusalView data={data} onSurface={handleSurface} absent={absent}/>
          {numLabel}
        </>
      )}
    </div>
  );
}

/* ── Main Odontogram component ───────────────────── */
const Odontogram = ({ data = {}, onChange }) => {
  const [selectedCondition, setSelectedCondition] = useState('caries');

  const handleChange = (num, toothData) => {
    onChange({ ...data, [String(num)]: toothData });
  };

  const divider = () => <div style={{ height:1, background:'#e5e7eb', borderBottom:'1px dashed #d1d5db', margin:'6px 0', width:'100%'}} />;

  const renderRow = teeth => (
    <div style={{ display:'flex', alignItems:'center', gap:4, overflowX:'auto', paddingBottom:4 }}>
      {teeth.slice(0, 8).map(n => (
        <ToothCell key={n} num={n} data={data[String(n)]||{}} selectedCondition={selectedCondition} onChange={handleChange}/>
      ))}
      <div style={{ width:1, background:'#9ca3af', alignSelf:'stretch', margin:'0 6px'}}/>
      {teeth.slice(8).map(n => (
        <ToothCell key={n} num={n} data={data[String(n)]||{}} selectedCondition={selectedCondition} onChange={handleChange}/>
      ))}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

      {/* Toolbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, background:'white', padding:'10px 12px', borderRadius:10, border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#6b7280', alignSelf:'center', marginRight:4 }}>Condición:</span>
        {CONDITIONS.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCondition(c.id)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 10px', borderRadius:8, fontFamily:'inherit',
              fontSize:'0.8125rem', fontWeight:600, cursor:'pointer',
              border:`1.5px solid ${selectedCondition === c.id ? c.color : '#e2e8f0'}`,
              background: selectedCondition === c.id ? c.light : 'white',
              color: selectedCondition === c.id ? c.color : '#4b5563',
              transition:'all 0.15s',
            }}
          >
            {c.isEraser ? <Eraser size={13}/> : <span style={{ width:10, height:10, borderRadius:'50%', background:c.color, display:'inline-block'}}/>}
            {c.label}
          </button>
        ))}
      </div>

      {/* Odontogram Board */}
      <div style={{
        background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12,
        padding:'16px 12px', overflowX:'auto'
      }}>
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, textAlign:'center' }}>
          Arcada Superior
        </div>
        {renderRow(UPPER)}
        {divider()}
        {renderRow(LOWER)}
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:8, textAlign:'center' }}>
          Arcada Inferior
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:'0.75rem', color:'#6b7280', alignItems:'center' }}>
        <Info size={13}/>
        {CONDITIONS.filter(c => !c.isEraser).map(c => (
          <span key={c.id} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:c.color, display:'inline-block'}}/>
            {c.label}
          </span>
        ))}
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontWeight:700, color:'#374151' }}>X</span> Ausente
        </span>
      </div>
    </div>
  );
};

export default Odontogram;
