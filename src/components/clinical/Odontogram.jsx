import React, { useState } from 'react';
import { Eraser, Info, ChevronDown, ChevronUp, Stethoscope, Printer, Eye, EyeOff, Trash2, X, ArrowLeft } from 'lucide-react';
import { getUserEmail } from '../../utils/auth';

/* ── Condition palette (condiciones por superficie) ─ */
const CONDITIONS = [
  { id: 'caries',  label: 'Caries',        color: '#ef4444', light: '#fee2e2' },
  { id: 'filling', label: 'Restauración',  color: '#3b82f6', light: '#dbeafe' },
  { id: 'crown',   label: 'Corona',        color: '#8b5cf6', light: '#ede9fe' },
  { id: 'planned', label: 'Plan de Tx',    color: '#f59e0b', light: '#fef3c7' },
  { id: 'absent',  label: 'Ausente/Ext.',  color: '#374151', light: '#f3f4f6' },
  { id: 'eraser',  label: 'Borrador',      color: '#94a3b8', light: '#f1f5f9', isEraser: true },
];
const CONDITION_BY_ID = Object.fromEntries(CONDITIONS.map(c => [c.id, c]));

// "Ver sólo diagnóstico" muestra estas condiciones y oculta los tratamientos.
const DIAGNOSIS_IDS = ['caries', 'absent'];

/* ── Catálogo de diagnóstico (Opciones) ──────────── */
const CATALOG = {
  preexistencias: {
    title: 'Agregar preexistencia', color: '#2563eb',
    items: [
      ['corona', 'Corona'], ['corona_prov', 'Corona provisoria'], ['endodoncia', 'Endodoncia'],
      ['restauracion', 'Restauración'], ['implante', 'Implante'], ['perno', 'Perno muñón'],
      ['protesis', 'Prótesis removible'], ['amalgama', 'Amalgama'], ['sellante', 'Sellante'],
      ['corona_mal', 'Corona (mal estado)'], ['corona_prov_mal', 'Corona provisoria (mal estado)'],
      ['endo_mal', 'Endodoncia (mal estado)'], ['perno_mal', 'Perno muñón (mal estado)'],
      ['restauracion_mal', 'Restauración (mal estado)'], ['amalgama_mal', 'Amalgama (mal estado)'],
      ['implante_mal', 'Implante (mal estado)'], ['otro_pre', 'Otro'],
    ],
  },
  lesiones: {
    title: 'Definir lesión', color: '#dc2626',
    items: [
      ['caries_les', 'Caries'], ['pulpar', 'Infección pulpar'], ['fractura', 'Fractura'],
      ['movilidad', 'Movilidad'], ['residuo', 'Residuo radicular'], ['erosion', 'Erosión'],
      ['atricion', 'Atrición'], ['abfraccion', 'Abfracción'], ['otro_les', 'Otro'],
    ],
  },
  otros: {
    title: 'Otros diagnósticos', color: '#7c3aed',
    items: [
      ['incluido', 'Incluido'], ['rotado', 'Rotado'], ['maloclusion', 'Maloclusión'],
      ['indicado_extraccion', 'Indicado a extracción'], ['supernumerario', 'Supernumerario'], ['agenesia', 'Agenesia'],
    ],
  },
};
// Estados exclusivos de la pieza (no pueden combinarse con otros).
const EXCLUSIVE = [
  { id: 'sin_erupcionar', label: 'Sin erupcionar', color: '#16a34a' },
  { id: 'diente_sano',    label: 'Diente sano',    color: '#16a34a' },
];
const ITEM_META = {};
Object.values(CATALOG).forEach(cat => cat.items.forEach(([id, label]) => { ITEM_META[id] = { label, color: cat.color }; }));
EXCLUSIVE.forEach(e => { ITEM_META[e.id] = { label: e.label, color: e.color }; });
const EXCLUSIVE_IDS = EXCLUSIVE.map(e => e.id);

/* ── Surfaces (5-surface occlusal ring) ──────────── */
const SURFACES = [
  { id: 'top',    label: 'Vestibular' },
  { id: 'bottom', label: 'Lingual/Palatino' },
  { id: 'left',   label: 'Mesial' },
  { id: 'right',  label: 'Distal' },
  { id: 'center', label: 'Oclusal' },
];

/* ── Tooth layout (FDI) ──────────────────────────── */
const LAYOUT = {
  permanente: {
    upper: [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28],
    lower: [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38],
  },
  temporal: {
    upper: [55,54,53,52,51, 61,62,63,64,65],
    lower: [85,84,83,82,81, 71,72,73,74,75],
  },
};

const pos        = n => n % 10;
const quadrant   = n => Math.floor(n / 10);
const isTemporal = n => quadrant(n) >= 5;
const isUpper    = n => [1, 2, 5, 6].includes(quadrant(n));
const isRight    = n => [1, 4, 5, 8].includes(quadrant(n));
const typeOf = n => {
  const p = pos(n);
  if (p <= 2) return 'incisor';
  if (p === 3) return 'canine';
  if (isTemporal(n) || p >= 6) return 'molar';
  return 'premolar';
};
const TYPE_LABEL = { incisor: 'Incisivo', canine: 'Canino', premolar: 'Premolar', molar: 'Molar' };
const toothName = n => {
  const side = isRight(n) ? 'derecho' : 'izquierdo';
  const arch = isUpper(n) ? 'superior' : 'inferior';
  const prefix = isTemporal(n) ? 'temporal ' : '';
  return `${TYPE_LABEL[typeOf(n)]} ${prefix}${arch} ${side}`;
};

/* ── Sextantes y arcadas (selección de zona) ─────── */
const REGIONS = [
  { id: 'S1', label: 'Sextante 1', teeth: [18,17,16,15,14] },
  { id: 'S2', label: 'Sextante 2', teeth: [13,12,11,21,22,23] },
  { id: 'S3', label: 'Sextante 3', teeth: [24,25,26,27,28] },
  { id: 'S4', label: 'Sextante 4', teeth: [38,37,36,35,34] },
  { id: 'S5', label: 'Sextante 5', teeth: [33,32,31,41,42,43] },
  { id: 'S6', label: 'Sextante 6', teeth: [44,45,46,47,48] },
  { id: 'SUP', label: 'Arcada Superior' },
  { id: 'INF', label: 'Arcada Inferior' },
];
const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));

// Iconos aproximados de la referencia (viewBox 60×50).
const REGION_ICONS = {
  S1:  <path d="M14,6 L44,44 M4,44 L44,44"/>,
  S2:  <path d="M6,6 L28,44 L50,6"/>,
  S3:  <path d="M46,6 L14,44 M14,44 L50,44"/>,
  S4:  <path d="M6,8 L50,8 M6,8 L28,44"/>,
  S5:  <path d="M4,44 L30,6 L56,44"/>,
  S6:  <path d="M4,8 L46,8 L14,44"/>,
  SUP: <path d="M8,44 A22,22 0 0 1 52,44" strokeWidth="4"/>,
  INF: <path d="M8,6 A22,22 0 0 0 52,6" strokeWidth="4"/>,
};

const regionTeethFor = (id, dent) => {
  if (id === 'SUP') return LAYOUT[dent].upper;
  if (id === 'INF') return LAYOUT[dent].lower;
  return REGION_BY_ID[id].teeth;
};
const regionsFor = dent => (dent === 'permanente' ? REGIONS : REGIONS.filter(r => r.id === 'SUP' || r.id === 'INF'));

/* ── Tooth silhouettes (vista vestibular) ────────── */
// Canónico en viewBox 40×90 para arcada superior: corona abajo (y≈58–89), raíz arriba.
// La arcada inferior es el mismo dibujo espejado verticalmente.
const TOOTH_PATHS = {
  incisor: [
    'M11,58 L29,58 C30,66 30,78 27,84 Q22,89 20,89 Q18,89 13,84 C10,78 10,66 11,58Z',
    'M13,58 C14,40 15,20 17,8 Q20,0 23,8 C25,20 26,40 27,58Z',
  ],
  canine: [
    'M10,58 L30,58 C31,68 27,80 22,86 Q20,90 18,86 C13,80 9,68 10,58Z',
    'M12,58 C13,40 16,18 18,2 Q20,-1 22,2 C24,18 27,40 28,58Z',
  ],
  premolar: [
    'M7,58 L33,58 C35,68 33,80 28,85 Q24,89 20,88 Q16,89 12,85 C7,80 5,68 7,58Z',
    'M9,58 C9,40 10,22 12,8 Q14,2 16,8 C17,22 17,40 17,58Z',
    'M23,58 C23,40 23,22 24,8 Q26,2 28,8 C30,22 31,40 31,58Z',
  ],
  molar: [
    'M5,60 L35,60 C37,68 36,80 32,85 Q28,89 24,86 Q20,84 16,86 Q12,89 8,85 C4,80 3,68 5,60Z',
    'M6,60 C6,44 7,24 9,8 Q12,2 14,8 C15,24 16,40 17,60Z',
    'M19,60 C19,44 20,30 21,20 Q22,16 24,20 C26,30 28,44 29,60Z',
    'M24,60 C25,44 27,26 29,10 Q31,4 33,10 C34,26 34,44 35,60Z',
  ],
};

function ToothShape({ num, absent }) {
  const paths = TOOTH_PATHS[typeOf(num)];
  const transform = isUpper(num) ? undefined : 'translate(0,90) scale(1,-1)';

  return (
    <svg viewBox="0 0 40 90" width="30" height="68" aria-hidden="true" style={{ overflow:'visible' }}>
      <g transform={transform}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="#fbfbfb" stroke="#9ca3af" strokeWidth="1" strokeLinejoin="round"/>
        ))}
      </g>
      {absent && <>
        <line x1="6" y1="6"  x2="34" y2="84" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="34" y1="6" x2="6"  y2="84" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
      </>}
    </svg>
  );
}

/* ── Vista oclusal en anillo (5 superficies) ─────── */
const C = 20, R_OUT = 18, R_IN = 8.5;
const polar = (r, deg) => {
  const rad = deg * Math.PI / 180;
  return [(C + r * Math.cos(rad)).toFixed(2), (C + r * Math.sin(rad)).toFixed(2)];
};
const sectorPath = (a1, a2) => {
  const [x1, y1] = polar(R_OUT, a1), [x2, y2] = polar(R_OUT, a2);
  const [x3, y3] = polar(R_IN, a2),  [x4, y4] = polar(R_IN, a1);
  return `M${x1},${y1} A${R_OUT},${R_OUT} 0 0 1 ${x2},${y2} L${x3},${y3} A${R_IN},${R_IN} 0 0 0 ${x4},${y4} Z`;
};
const RING = [
  { id: 'top',    d: sectorPath(-135, -45), title: 'Vestibular' },
  { id: 'right',  d: sectorPath(-45, 45),   title: 'Distal' },
  { id: 'bottom', d: sectorPath(45, 135),   title: 'Lingual/Palatino' },
  { id: 'left',   d: sectorPath(135, 225),  title: 'Mesial' },
];

function OcclusalView({ data = {}, onSurface, absent, num }) {
  if (absent) return (
    <div style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:'0.65rem' }}>—</div>
  );

  const fill = s => CONDITION_BY_ID[data[s]]?.color ?? '#ffffff';
  const click = s => e => { e.stopPropagation(); onSurface(s); };

  return (
    <svg viewBox="0 0 40 40" width="26" height="26" style={{ cursor:'pointer', display:'block' }} role="group" aria-label={`Caras del diente ${num}`}>
      {RING.map(seg => (
        <path key={seg.id} d={seg.d} fill={fill(seg.id)} stroke="#374151" strokeWidth="1" strokeLinejoin="round"
              onClick={click(seg.id)}>
          <title>{seg.title}</title>
        </path>
      ))}
      <circle cx={C} cy={C} r={R_IN} fill={fill('center')} stroke="#374151" strokeWidth="1" onClick={click('center')}>
        <title>Oclusal</title>
      </circle>
    </svg>
  );
}

/* ── Single tooth cell ───────────────────────────── */
function ToothCell({ num, data = {}, shown = {}, selectedCondition, onChange, onTap, selected, dimmed }) {
  const upper  = isUpper(num);
  const absent = shown.whole === 'absent';
  const hasData = absent || SURFACES.some(s => shown[s.id]);
  const items = data.items || [];
  const itemColor = items.length ? ITEM_META[items[0]]?.color : null;

  const handleSurface = s => {
    if (onTap) return onTap(num);
    if (selectedCondition === 'absent') return;
    const next = { ...data };
    if (selectedCondition === 'eraser') { delete next[s]; }
    else { next[s] = selectedCondition; delete next.whole; }
    onChange(num, next);
  };

  const handleTooth = () => {
    if (onTap) return onTap(num);
    if (selectedCondition === 'absent') onChange(num, data.whole === 'absent' ? {} : { whole: 'absent' });
    else if (selectedCondition === 'eraser' && data.whole === 'absent') onChange(num, {});
  };

  const numLabel = (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, color: hasData ? '#1f2937' : '#6b7280',
      lineHeight: 1, textAlign: 'center', userSelect: 'none', fontVariantNumeric: 'tabular-nums'
    }}>{num}</span>
  );

  return (
    <div
      onClick={handleTooth}
      title={toothName(num)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        width: 36, padding: '4px 0', borderRadius: 8,
        cursor: onTap || selectedCondition === 'absent' || selectedCondition === 'eraser' ? 'pointer' : 'default',
        background: absent ? '#f3f4f6' : hasData ? '#f0f9ff' : 'transparent',
        boxShadow: selected ? 'inset 0 0 0 2px #55b5d9' : 'none',
        opacity: dimmed ? 0.3 : 1,
        transition: 'background 0.15s, opacity 0.15s',
      }}
    >
      {itemColor && (
        <span aria-hidden="true" style={{ position:'absolute', top:2, right:2, width:7, height:7, borderRadius:'50%', background:itemColor }}/>
      )}
      {upper ? (
        <>
          {numLabel}
          <OcclusalView data={shown} onSurface={handleSurface} absent={absent} num={num}/>
          <ToothShape num={num} absent={absent}/>
        </>
      ) : (
        <>
          <ToothShape num={num} absent={absent}/>
          <OcclusalView data={shown} onSurface={handleSurface} absent={absent} num={num}/>
          {numLabel}
        </>
      )}
    </div>
  );
}

/* ── Helpers de registro ─────────────────────────── */
function describeTooth(data) {
  const items = (data.items || []).filter(id => ITEM_META[id]).map(id => ({ id, ...ITEM_META[id] }));
  if (data.whole === 'absent') return { caras: '—', conditions: ['absent'], items };
  const entries = SURFACES.filter(s => data[s.id]).map(s => ({ surface: s.label, cond: data[s.id] }));
  if (entries.length === 0 && items.length === 0) return null;
  const caras = entries.length
    ? entries.map(e => `${e.surface}: ${CONDITION_BY_ID[e.cond]?.label ?? e.cond}`).join(' · ')
    : '—';
  return { caras, conditions: [...new Set(entries.map(e => e.cond))], items };
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Quién registra el hallazgo: el correo del usuario con sesión iniciada.
const creadorLabel = () => getUserEmail() || '—';

// Aplica o quita un ítem del catálogo a una pieza y devuelve el nuevo registro.
function nextForTooth(cur, id) {
  const next = { ...cur };
  if (id === 'ausente') {
    if (next.whole === 'absent') delete next.whole; else next.whole = 'absent';
    return next;
  }
  const items = new Set(next.items || []);
  if (EXCLUSIVE_IDS.includes(id)) {
    const wasOn = items.has(id);
    items.clear();
    if (!wasOn) items.add(id);
  } else {
    EXCLUSIVE_IDS.forEach(e => items.delete(e));
    if (items.has(id)) items.delete(id); else items.add(id);
  }
  if (items.size) next.items = [...items]; else delete next.items;
  return next;
}

/* ── Información del diente ──────────────────────── */
function ToothInfo({ num, data, onAnular }) {
  if (!num) return (
    <div style={{ fontSize:'0.875rem', color:'#9ca3af', padding:'0.5rem 0' }}>
      Haga clic en un diente para ver su información.
    </div>
  );
  const d = data[String(num)] || {};
  const info = describeTooth(d);
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:16, alignItems:'flex-start', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#111827' }}>Diente {num}</div>
        <div style={{ fontSize:'0.8rem', color:'#6b7280', marginBottom:8 }}>{toothName(num)}</div>
        {info ? (
          <>
            <div style={{ fontSize:'0.875rem', color:'#1f2937' }}>{info.caras}</div>
            {info.items.length > 0 && (
              <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:4 }}>
                {info.items.map(it => <ItemChip key={it.id} item={it}/>)}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize:'0.875rem', color:'#9ca3af' }}>Sin hallazgos registrados.</div>
        )}
        <div style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:6 }}>
          Fecha: {formatDate(d.fecha)} · Creador: {d.creador || '—'}
        </div>
      </div>
      {info && (
        <button onClick={() => onAnular(num)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', color:'#b91c1c', fontFamily:'inherit', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
          <Trash2 size={13}/> Anular registro
        </button>
      )}
    </div>
  );
}

function ItemChip({ item }) {
  return (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:'0.75rem', fontWeight:600,
      background: `${item.color}1a`, color: item.color,
    }}>{item.label}</span>
  );
}

/* ── Registro de hallazgos (tabla) ───────────────── */
function FindingsTable({ rows, onAnular, title }) {
  const th = { textAlign: 'left', padding: '10px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const td = { padding: '10px 12px', fontSize: '0.875rem', color: '#1f2937', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };

  return (
    <div>
      <h4 style={{ fontSize:'0.9rem', fontWeight:600, color:'#1f2937', marginBottom:8 }}>
        Registro de hallazgos{title && <span style={{ fontWeight:400, color:'#6b7280' }}> · {title}</span>}
      </h4>
      {rows.length === 0 ? (
        <div style={{ textAlign:'center', padding:'1.5rem', color:'#9ca3af', fontSize:'0.875rem', border:'1px dashed #e5e7eb', borderRadius:10 }}>
          Sin hallazgos registrados. Elija una condición y haga clic en las caras de un diente, o use Diagnóstico.
        </div>
      ) : (
        <div style={{ overflowX:'auto', border:'1px solid #e5e7eb', borderRadius:10 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Pieza</th>
                <th style={th}>Caras</th>
                <th style={th}>Estado</th>
                <th style={th}>Creador</th>
                <th style={th}>Anular</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.num}>
                  <td style={{ ...td, whiteSpace:'nowrap', color:'#6b7280' }}>{formatDate(r.fecha)}</td>
                  <td style={td}>
                    <strong>{r.num}</strong>
                    <div style={{ fontSize:'0.75rem', color:'#6b7280' }}>{toothName(r.num)}</div>
                  </td>
                  <td style={td}>{r.caras}</td>
                  <td style={td}>
                    {r.conditions.map(c => (
                      <span key={c} style={{
                        display:'inline-block', margin:'0 4px 4px 0', padding:'2px 8px', borderRadius:999,
                        fontSize:'0.75rem', fontWeight:600,
                        background: CONDITION_BY_ID[c]?.light, color: CONDITION_BY_ID[c]?.color,
                      }}>{CONDITION_BY_ID[c]?.label ?? c}</span>
                    ))}
                    {r.items.map(it => <span key={it.id} style={{ display:'inline-block', margin:'0 4px 4px 0' }}><ItemChip item={it}/></span>)}
                  </td>
                  <td style={{ ...td, color:'#6b7280', whiteSpace:'nowrap' }}>{r.creador}</td>
                  <td style={td}>
                    <button onClick={() => onAnular(r.num)} title="Anular registro" aria-label={`Anular diente ${r.num}`}
                      style={{ background:'none', border:'none', color:'#b91c1c', cursor:'pointer', padding:4 }}>
                      <Trash2 size={15}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Resumen por condición ───────────────────────── */
function Summary({ teeth }) {
  const counts = Object.fromEntries(CONDITIONS.filter(c => !c.isEraser).map(c => [c.id, 0]));
  teeth.forEach(d => {
    if (!d) return;
    const ids = new Set(d.whole === 'absent' ? ['absent'] : SURFACES.map(s => d[s.id]).filter(Boolean));
    ids.forEach(id => { if (counts[id] !== undefined) counts[id] += 1; });
  });
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:8 }}>
      {CONDITIONS.filter(c => !c.isEraser).map(c => (
        <div key={c.id} style={{ background:'white', border:'1px solid #e5e7eb', borderLeft:`4px solid ${c.color}`, borderRadius:8, padding:'8px 10px' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'#111827', lineHeight:1.1 }}>{counts[c.id]}</div>
          <div style={{ fontSize:'0.75rem', color:'#6b7280' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Modal de Opciones de diagnóstico ────────────── */
// menu = { num, view: 'options' | 'pre' | 'les' | 'info' }
function DiagnosisModal({ menu, data, onClose, onView, onApply, onAnular }) {
  const { num, view } = menu;
  const isInfo = view === 'info';
  const catalog = view === 'pre' ? CATALOG.preexistencias
    : view === 'les' ? CATALOG.lesiones
    : view === 'otros' ? CATALOG.otros
    : null;
  const headerBg = catalog || isInfo ? '#111827' : '#2563eb';

  const optionBtn = (label, onClick, color) => (
    <button key={label} onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', background:'white',
      border:'none', borderBottom:'1px solid #f1f5f9', textAlign:'left', fontFamily:'inherit', fontSize:'0.9rem',
      color:'#1f2937', cursor:'pointer',
    }}>
      <span style={{ width:10, height:10, borderRadius:'50%', background: color, flexShrink:0 }}/>
      {label}
    </button>
  );

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(17,24,39,0.35)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'min(380px, 100%)', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column',
        background:'white', borderRadius:14, boxShadow:'0 20px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{ background: headerBg, color:'white', padding:'12px 16px', display:'flex', alignItems:'center', gap:8 }}>
          {(catalog || isInfo) && (
            <button onClick={() => onView('options')} aria-label="Volver" style={{ background:'none', border:'none', color:'white', cursor:'pointer', padding:0, display:'flex' }}>
              <ArrowLeft size={18}/>
            </button>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:'0.95rem', textTransform: catalog ? 'uppercase' : 'none' }}>
              {catalog ? catalog.title : isInfo ? `Diente ${num}` : 'Opciones'}
            </div>
            {!catalog && !isInfo && (
              <div style={{ fontSize:'0.75rem', opacity:0.85 }}>Aplicar estos cambios a 1 pieza ({num})</div>
            )}
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ background:'none', border:'none', color:'white', cursor:'pointer', padding:0, display:'flex' }}>
            <X size={18}/>
          </button>
        </div>

        <div style={{ overflowY:'auto' }}>
          {view === 'options' && <>
            {optionBtn('Agregar preexistencia', () => onView('pre'), CATALOG.preexistencias.color)}
            {optionBtn('Definir lesión', () => onView('les'), CATALOG.lesiones.color)}
            {optionBtn('Otros diagnósticos', () => onView('otros'), CATALOG.otros.color)}
            {EXCLUSIVE.map(e => optionBtn(e.label, () => onApply(num, e.id), e.color))}
            <button onClick={() => onView('info')} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px', background:'white',
              border:'none', textAlign:'left', fontFamily:'inherit', fontSize:'0.9rem', color:'#4b5563', cursor:'pointer',
            }}><Info size={15}/> Ver información</button>
          </>}

          {catalog && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, padding:8 }}>
              {catalog.items.map(([id, label]) => {
                const applied = (data[String(num)]?.items || []).includes(id);
                return (
                  <button key={id} onClick={() => onApply(num, id)} style={{
                    padding:'10px 8px', borderRadius:8, fontFamily:'inherit', fontSize:'0.8rem', textAlign:'center', cursor:'pointer',
                    border:`1.5px solid ${applied ? catalog.color : '#e5e7eb'}`,
                    background: applied ? `${catalog.color}1a` : 'white', color:'#1f2937',
                  }}>{label}</button>
                );
              })}
            </div>
          )}

          {isInfo && (
            <div style={{ padding:16 }}>
              <ToothInfo num={num} data={data} onAnular={n => onAnular(n)}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Odontogram component ───────────────────── */
const Odontogram = ({ data = {}, onChange }) => {
  const [dent, setDent] = useState('permanente');
  const [selectedCondition, setSelectedCondition] = useState('caries');
  const [region, setRegion] = useState(null);
  const [regionsOpen, setRegionsOpen] = useState(true);
  const [soloDiagnostico, setSoloDiagnostico] = useState(false);
  const [mode, setMode] = useState(null); // null | 'diagnostico' | 'informacion'
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [menu, setMenu] = useState(null);

  const regionTeeth = region ? regionTeethFor(region, dent) : null;
  const isDimmed = n => regionTeeth !== null && !regionTeeth.includes(n);

  // Vista: en modo "sólo diagnóstico" se ocultan los tratamientos (sin tocar los datos).
  const shownFor = n => {
    const d = data[String(n)] || {};
    if (!soloDiagnostico || d.whole === 'absent') return d;
    const out = {};
    SURFACES.forEach(s => { if (DIAGNOSIS_IDS.includes(d[s.id])) out[s.id] = d[s.id]; });
    return out;
  };

  const handleChange = (num, toothData) => {
    const hasContent = Object.keys(toothData).length > 0;
    const next = hasContent
      ? { ...toothData, fecha: new Date().toISOString(), creador: creadorLabel() }
      : {};
    onChange({ ...data, [String(num)]: next });
  };

  const handleApply = (num, id) => {
    handleChange(num, nextForTooth(data[String(num)] || {}, id));
    setMenu(null);
  };

  const handleAnular = num => {
    if (!window.confirm(`¿Anular el registro del diente ${num}?`)) return;
    handleChange(num, {});
    if (selectedTooth === num) setSelectedTooth(null);
    setMenu(null);
  };

  // Clic en un diente según el modo activo.
  const onTap = mode === 'diagnostico'
    ? num => setMenu({ num, view: 'options' })
    : mode === 'informacion'
      ? num => setSelectedTooth(num)
      : null;

  const toggleRegion = id => setRegion(prev => (prev === id ? null : id));
  const switchDent = d => { setDent(d); setRegion(null); setSelectedTooth(null); setMenu(null); };
  const toggleMode = m => {
    setMode(prev => (prev === m ? null : m));
    setSelectedTooth(null);
    setMenu(null);
  };

  const teethFor = arr => {
    const half = arr.length / 2;
    const cell = n => (
      <ToothCell
        key={n}
        num={n}
        data={data[String(n)] || {}}
        shown={shownFor(n)}
        selectedCondition={selectedCondition}
        onChange={handleChange}
        onTap={onTap}
        selected={mode === 'informacion' && selectedTooth === n}
        dimmed={isDimmed(n)}
      />
    );
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
        {arr.slice(0, half).map(cell)}
        <div style={{ width:2, alignSelf:'stretch', background:'#9ca3af', margin:'0 8px', borderRadius:1 }}/>
        {arr.slice(half).map(cell)}
      </div>
    );
  };

  // Registros visibles en la tabla: dientes del tipo activo, zona y vista filtrados.
  const numericKeys = Object.keys(data).filter(k => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
  const rows = numericKeys
    .filter(n => isTemporal(n) === (dent === 'temporal'))
    .filter(n => !regionTeeth || regionTeeth.includes(n))
    .map(n => {
      const info = describeTooth(shownFor(n));
      const raw = data[String(n)] || {};
      return info ? { num: n, fecha: raw.fecha, creador: raw.creador || '—', ...info } : null;
    })
    .filter(Boolean);

  const summaryTeeth = numericKeys
    .filter(n => isTemporal(n) === (dent === 'temporal'))
    .map(n => shownFor(n));

  const teethOfDent = LAYOUT[dent];
  const regionTitle = region ? REGION_BY_ID[region].label : null;
  const sectionLabel = { fontSize:'0.65rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center' };

  const toggleBtn = (active, onClick, icon, label) => (
    <button onClick={onClick} aria-pressed={active} style={{
      display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, fontFamily:'inherit',
      fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s',
      border:`1.5px solid ${active ? '#55b5d9' : '#e2e8f0'}`,
      background: active ? '#e8f6fb' : 'white', color: active ? '#1f2937' : '#4b5563',
    }}>
      {icon}{label}
    </button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* Permanente / Temporal + acciones */}
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:10 }}>
        <div style={{ display:'flex', gap:4 }}>
          {[['permanente','Permanente'],['temporal','Temporal']].map(([k, label]) => (
            <button key={k} onClick={() => switchDent(k)} aria-pressed={dent === k} style={{
              background:'none', border:'none', borderBottom:`2px solid ${dent === k ? '#55b5d9' : 'transparent'}`,
              padding:'6px 12px', fontFamily:'inherit', fontSize:'0.9rem', fontWeight: dent === k ? 600 : 400,
              color: dent === k ? '#1f2937' : '#6b7280', cursor:'pointer',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {toggleBtn(mode === 'diagnostico', () => toggleMode('diagnostico'), <Stethoscope size={14}/>, 'Diagnóstico')}
          {toggleBtn(mode === 'informacion', () => toggleMode('informacion'), <Info size={14}/>, 'Información')}
          {toggleBtn(soloDiagnostico, () => setSoloDiagnostico(v => !v), soloDiagnostico ? <EyeOff size={14}/> : <Eye size={14}/>, 'Ver sólo diagnóstico')}
          <button onClick={() => window.print()} title="Imprimir" aria-label="Imprimir odontograma" style={{
            display:'flex', alignItems:'center', padding:'7px 10px', borderRadius:8, border:'1px solid #e2e8f0',
            background:'white', color:'#4b5563', cursor:'pointer',
          }}><Printer size={15}/></button>
        </div>
      </div>

      {/* Aviso del modo activo */}
      {mode === 'diagnostico' && (
        <div style={{ fontSize:'0.8rem', color:'#1e40af', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 12px' }}>
          Modo diagnóstico: haga clic en un diente para agregar preexistencias, lesiones o estados.
        </div>
      )}
      {mode === 'informacion' && (
        <div style={{ fontSize:'0.8rem', color:'#1e40af', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 12px' }}>
          Modo información: haga clic en un diente para ver su registro.
        </div>
      )}

      {/* Toolbar de condiciones (caras) */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, background:'white', padding:'10px 12px', borderRadius:10, border:'1px solid #e5e7eb' }}>
        <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#6b7280', marginRight:4 }}>Condición:</span>
        {CONDITIONS.map(c => {
          const active = selectedCondition === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedCondition(c.id); setMode(null); setMenu(null); }}
              aria-pressed={active}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'5px 10px', borderRadius:8, fontFamily:'inherit',
                fontSize:'0.8125rem', fontWeight:600, cursor:'pointer',
                border:`1.5px solid ${active ? c.color : '#e2e8f0'}`,
                background: active ? c.light : 'white',
                color: active ? c.color : '#4b5563',
                transition:'all 0.15s',
              }}
            >
              {c.isEraser ? <Eraser size={13}/> : <span style={{ width:10, height:10, borderRadius:'50%', background:c.color, display:'inline-block'}}/>}
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Resumen */}
      <Summary teeth={summaryTeeth}/>

      {/* Tablero */}
      <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12, padding:'16px 8px', overflowX:'auto' }}>
        <div style={{ width:'max-content', margin:'0 auto', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'0 8px' }}>
            <span style={sectionLabel}>Derecha</span>
            <span style={sectionLabel}>Odontograma FDI · {dent === 'permanente' ? 'Permanente' : 'Temporal'}</span>
            <span style={sectionLabel}>Izquierda</span>
          </div>
          {teethFor(teethOfDent.upper)}
          <div style={{ height:1, background:'#d1d5db', margin:'6px 0' }}/>
          {teethFor(teethOfDent.lower)}
          <div style={{ ...sectionLabel, marginTop:2 }}>Arcada inferior</div>
        </div>
      </div>

      {/* Sextantes y arcadas */}
      <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:'12px 16px' }}>
        <button
          onClick={() => setRegionsOpen(o => !o)}
          aria-expanded={regionsOpen}
          style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto', background:'none', border:'none', color:'#55b5d9', fontFamily:'inherit', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', padding:0 }}
        >
          Arcadas y Sextantes {regionsOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        {regionsOpen && (
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6, marginTop:10 }}>
            {regionsFor(dent).map(r => {
              const active = region === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRegion(r.id)}
                  aria-pressed={active}
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    width:86, padding:'8px 4px', borderRadius:10, fontFamily:'inherit', cursor:'pointer',
                    border:`1.5px solid ${active ? '#55b5d9' : 'transparent'}`,
                    background: active ? '#e8f6fb' : 'transparent', transition:'all 0.15s',
                  }}
                >
                  <svg viewBox="0 0 60 50" width="56" height="46" fill="none" stroke={r.id.startsWith('S') ? '#374151' : '#6b7280'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {REGION_ICONS[r.id]}
                  </svg>
                  <span style={{ fontSize:'0.7rem', color: active ? '#1f2937' : '#6b7280', fontWeight: active ? 600 : 400, textAlign:'center', lineHeight:1.2 }}>{r.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Información del diente (modo información) */}
      {mode === 'informacion' && (
        <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:'12px 16px' }}>
          <ToothInfo num={selectedTooth} data={data} onAnular={handleAnular}/>
        </div>
      )}

      {/* Leyenda */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:'0.75rem', color:'#6b7280', alignItems:'center' }}>
        <Info size={13}/>
        <span>Caras: {SURFACES.map(s => s.label).join(' · ')}</span>
        <span><span style={{ fontWeight:700, color:'#374151' }}>X</span> = diente ausente (clic con la condición Ausente/Ext.)</span>
        <span><span style={{ color:'#2563eb', fontWeight:700 }}>●</span> preexistencia · <span style={{ color:'#dc2626', fontWeight:700 }}>●</span> lesión · <span style={{ color:'#7c3aed', fontWeight:700 }}>●</span> otro diagnóstico · <span style={{ color:'#16a34a', fontWeight:700 }}>●</span> estado</span>
      </div>

      {/* Registro */}
      <FindingsTable rows={rows} onAnular={handleAnular} title={regionTitle}/>

      {/* Modal de opciones de diagnóstico */}
      {menu && (
        <DiagnosisModal
          menu={menu}
          data={data}
          onClose={() => setMenu(null)}
          onView={view => setMenu(m => ({ ...m, view }))}
          onApply={handleApply}
          onAnular={handleAnular}
        />
      )}
    </div>
  );
};

export default Odontogram;
