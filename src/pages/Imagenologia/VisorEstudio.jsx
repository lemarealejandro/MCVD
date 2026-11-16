import React, { useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Move, Contrast, Ruler, RotateCcw } from 'lucide-react';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

const VisorEstudio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { estudios } = useOutletContext();
  const estudio = estudios.find(e => String(e.id) === id);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [contrast, setContrast] = useState(1.25);
  const [moveMode, setMoveMode] = useState(false);
  const [corte, setCorte] = useState(1);
  const dragStart = useRef(null);

  const changeZoom = (delta) => setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))));
  const cycleContrast = () => setContrast(c => (c >= 1.75 ? 1 : +(c + 0.25).toFixed(2)));
  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); setContrast(1.25); setMoveMode(false); };

  const handlePointerDown = (e) => {
    if (!moveMode) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handlePointerMove = (e) => {
    if (!dragStart.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handlePointerUp = () => { dragStart.current = null; };

  const herramientas = [
    { icon: ZoomIn, label: 'Acercar', onClick: () => changeZoom(0.25) },
    { icon: ZoomOut, label: 'Alejar', onClick: () => changeZoom(-0.25) },
    { icon: Move, label: 'Mover', onClick: () => setMoveMode(m => !m), active: moveMode },
    { icon: Contrast, label: 'Contraste', onClick: cycleContrast },
    { icon: Ruler, label: 'Medir (próximamente)', disabled: true },
    { icon: RotateCcw, label: 'Restablecer', onClick: reset },
  ];

  return (
    <div className="visor-page">
      <div className="visor-topbar">
        <div className="visor-title">
          <button onClick={() => navigate('/admin/imagenologia')} className="visor-tool" aria-label="Volver a estudios">
            <ArrowLeft size={20} />
          </button>
          <div className="visor-title-text">
            <h2>Estudio #{id} - {estudio?.tipo || 'Estudio no encontrado'}</h2>
            <p>Paciente: {estudio?.paciente || '—'}</p>
          </div>
        </div>

        <div className="visor-tools">
          {herramientas.map(({ icon: Icon, label, onClick, active, disabled }) => (
            <button key={label} className={`visor-tool ${active ? 'active' : ''}`} title={label} aria-label={label} onClick={onClick} disabled={disabled}>
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="visor-body">
        <div className="visor-thumbs">
          {[1, 2, 3, 4, 5].map((item) => (
            <button key={item} className={`visor-thumb ${corte === item ? 'active' : ''}`} onClick={() => setCorte(item)}>
              Corte {item}
            </button>
          ))}
        </div>

        <div
          className={`visor-stage ${moveMode ? 'moving' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src="/assets/dental_pano.png"
            alt={`Imagen del estudio ${id}`}
            draggable={false}
            style={{
              filter: `contrast(${contrast}) brightness(1.1)`,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          />
          <div className="visor-overlay">
            <p>Contraste: {contrast}x</p>
            <p>Zoom: {zoom}x</p>
            <p>Corte: {corte}</p>
          </div>
        </div>
      </div>

      <style>{`
        .visor-page { display: flex; flex-direction: column; height: calc(100dvh - 70px); margin: calc(var(--content-pad) * -1); }
        .visor-topbar { background-color: #1a1a1a; color: white; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem 1rem; }
        .visor-title { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .visor-title-text { min-width: 0; }
        .visor-title-text h2 { font-size: 1rem; font-weight: 600; margin: 0; }
        .visor-title-text p { font-size: 0.75rem; color: #9ca3af; margin: 0; }
        .visor-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem; background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 0.25rem; }
        .visor-tool { padding: 0.5rem; border-radius: 6px; background-color: transparent; border: none; color: #d1d5db; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .visor-tool:hover:not(:disabled) { background-color: rgba(255,255,255,0.1); }
        .visor-tool.active { background-color: var(--accent-color); color: white; }
        .visor-tool:disabled { opacity: 0.35; cursor: not-allowed; }
        .visor-body { flex: 1; min-height: 0; display: flex; background-color: black; overflow: hidden; }
        .visor-thumbs { width: 12rem; flex-shrink: 0; background-color: #121212; border-right: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
        .visor-thumb { aspect-ratio: 1 / 1; flex-shrink: 0; background-color: #1f2937; border-radius: 6px; border: 2px solid transparent; color: #9ca3af; font-size: 0.75rem; font-family: inherit; cursor: pointer; }
        .visor-thumb:hover, .visor-thumb.active { border-color: var(--accent-color); }
        .visor-stage { flex: 1; min-width: 0; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 1rem; background-color: #0a0a0a; touch-action: pan-y; }
        .visor-stage.moving { cursor: grab; touch-action: none; }
        .visor-stage img { max-width: 100%; max-height: 100%; object-fit: contain; user-select: none; }
        .visor-overlay { position: absolute; top: 0.75rem; left: 0.75rem; font-size: 0.75rem; color: #00ff00; opacity: 0.8; font-family: monospace; background-color: rgba(0,0,0,0.4); padding: 0.5rem; border-radius: 4px; pointer-events: none; }
        .visor-overlay p { margin: 0; }
        @media (max-width: 1024px) {
          .visor-page { height: calc(100dvh - 60px); }
        }
        @media (max-width: 768px) {
          .visor-body { flex-direction: column-reverse; }
          .visor-thumbs { width: 100%; flex-direction: row; overflow-x: auto; overflow-y: hidden; border-right: none; border-top: 1px solid rgba(255,255,255,0.1); }
          .visor-thumb { width: 64px; }
          .visor-tools { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

export default VisorEstudio;
