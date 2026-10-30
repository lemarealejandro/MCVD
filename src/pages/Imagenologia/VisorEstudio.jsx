import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Move, Contrast, Ruler, Save } from 'lucide-react';

const VisorEstudio = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const herramientas = [
    { icon: ZoomIn, label: 'Zoom In' },
    { icon: ZoomOut, label: 'Zoom Out' },
    { icon: Move, label: 'Mover' },
    { icon: Contrast, label: 'Contraste' },
    { icon: Ruler, label: 'Medir' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', margin: '-2rem' }}>
      {/* Topbar del visor */}
      <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/admin/imagenologia')}
            className="icon-btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Estudio #{id} - Tomografía CBCT</h2>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Paciente: Juan Pérez</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem' }}>
          {herramientas.map((Tool, index) => (
            <button 
              key={index}
              style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: '#d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={Tool.label}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Tool.icon size={20} />
            </button>
          ))}
        </div>

        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          <Save size={16} />
          Guardar Estado
        </button>
      </div>

      {/* Main viewer area */}
      <div style={{ flex: 1, display: 'flex', backgroundColor: 'black', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar Miniaturas */}
        <div style={{ width: '12rem', backgroundColor: '#121212', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', overflowY: 'auto' }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} style={{ marginBottom: '0.5rem', cursor: 'pointer', position: 'relative' }}>
              <div style={{ aspectRatio: '1/1', backgroundColor: '#1f2937', borderRadius: '6px', border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'border-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Corte {item}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Visor Principal (DICOM / Imagen) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <img 
              src="/assets/dental_pano.png" 
              alt="Estudio Dental Pano" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'contrast(1.25) brightness(1.1)', transform: 'scale(1.1)' }}
            />
          </div>
          
          {/* Overlay info */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.75rem', color: '#00ff00', opacity: 0.8, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>WL: 400</p>
            <p style={{ margin: 0 }}>WW: 2000</p>
            <p style={{ margin: 0 }}>Zoom: 1.1x</p>
            <p style={{ margin: 0 }}>Corte: Panorámica</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisorEstudio;
