import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ArrowLeft, Download, FileText, GripVertical, Sparkles, ImagePlus, X, 
  Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, User, Calendar, Stethoscope
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/* =============================================
   SORTABLE BLOCK COMPONENT
   ============================================= */
const SortableBlock = ({ id, title, content, onContentChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [collapsed, setCollapsed] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="informe-block">
      <div className="informe-block-header">
        <div className="informe-block-drag" {...attributes} {...listeners}>
          <GripVertical size={18} />
        </div>
        <span className="informe-block-title">{title}</span>
        <div className="informe-block-actions">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="icon-btn"
            style={{ padding: '0.3rem', border: 'none', backgroundColor: 'transparent' }}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={() => onRemove(id)}
            className="icon-btn"
            style={{ padding: '0.3rem', border: 'none', backgroundColor: 'transparent', color: '#ef4444' }}
            title="Eliminar bloque"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="informe-block-body">
          <textarea
            className="form-input"
            style={{ minHeight: '90px', resize: 'vertical', width: '100%', lineHeight: '1.6' }}
            value={content}
            onChange={(e) => onContentChange(id, e.target.value)}
            placeholder={`Ingresa el contenido de: ${title}...`}
          />
        </div>
      )}
    </div>
  );
};

/* =============================================
   IMAGE UPLOAD ZONE
   ============================================= */
const ImageUploadZone = ({ images, onAddImages, onRemoveImage, onCaptionChange }) => {
  const fileInputRef = useRef(null);
  const [draggingOver, setDraggingOver] = useState(false);

  const processFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddImages({
          id: `img-${Date.now()}-${Math.random()}`,
          src: reader.result,
          caption: file.name.replace(/\.[^.]+$/, ''),
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  }, [onAddImages]);

  const handleFileChange = (e) => processFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`upload-zone ${draggingOver ? 'upload-zone--active' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
      >
        <ImagePlus size={28} style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }} />
        <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
          Arrastra imágenes aquí
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          o haz clic para seleccionar archivos (JPG, PNG, TIFF)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {images.length > 0 && (
        <div className="image-gallery">
          {images.map((img) => (
            <div key={img.id} className="image-thumb">
              <img src={img.src} alt={img.caption} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
              <button
                onClick={() => onRemoveImage(img.id)}
                className="image-thumb-remove"
                title="Eliminar"
              >
                <X size={12} />
              </button>
              <input
                type="text"
                value={img.caption}
                onChange={(e) => onCaptionChange(img.id, e.target.value)}
                placeholder="Descripción..."
                style={{
                  width: '100%', border: 'none', borderTop: '1px solid var(--border-color)',
                  padding: '0.3rem 0.4rem', fontSize: '0.72rem', fontFamily: 'inherit',
                  color: 'var(--text-secondary)', background: 'transparent',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =============================================
   MAIN CONSTRUCTOR COMPONENT
   ============================================= */
const ConstructorInformeMejorado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  const [patientInfo] = useState({
    name: 'Juan Pérez', rut: '12.345.678-9',
    date: new Date().toLocaleDateString('es-CL'), study: 'Tomografía CBCT Maxilar',
    doctor: 'Dr. Carlos Rodríguez', clinic: 'Clínica Dental Integral',
  });

  const [blocks, setBlocks] = useState([
    { id: 'motivo', title: 'Motivo de Consulta', content: 'Evaluación pre-implantológica en zona 2.1-2.3.' },
    { id: 'tecnica', title: 'Técnica Utilizada', content: 'Tomografía computarizada de haz cónico (CBCT), maxilar superior e inferior, con resolución de 0.2mm por vóxel.' },
    { id: 'hallazgos', title: 'Hallazgos Radiográficos', content: '' },
    { id: 'anatomia', title: 'Evaluación Anatómica', content: '' },
    { id: 'diagnostico', title: 'Diagnóstico Presuntivo', content: '' },
    { id: 'conclusion', title: 'Conclusión y Recomendaciones', content: '' },
  ]);

  const [images, setImages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setBlocks(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleContentChange = (blockId, value) =>
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content: value } : b));

  const handleRemoveBlock = (blockId) =>
    setBlocks(blocks.filter(b => b.id !== blockId));

  const handleAddBlock = () => {
    const title = prompt('Nombre del nuevo bloque:');
    if (title) {
      setBlocks([...blocks, { id: `custom-${Date.now()}`, title, content: '' }]);
    }
  };

  const handleAddImage = (img) => setImages(prev => [...prev, img]);
  const handleRemoveImage = (imgId) => setImages(images.filter(i => i.id !== imgId));
  const handleCaptionChange = (imgId, caption) =>
    setImages(images.map(i => i.id === imgId ? { ...i, caption } : i));

  const handleExportPDF = () => {
    const element = document.getElementById('informe-pdf-preview');
    html2pdf().set({
      margin: 12,
      filename: `Informe_${id || 'nuevo'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  };

  /* ---- PREVIEW CONTENT ---- */
  const PreviewDocument = () => (
    <div id="informe-pdf-preview" style={{
      backgroundColor: 'white', width: '100%', minHeight: '297mm',
      padding: '18mm 20mm', fontFamily: 'Georgia, serif', color: '#1a1a1a', fontSize: '10pt',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2.5px solid var(--accent-color)', paddingBottom: '12px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '18pt', fontWeight: '700', color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif' }}>{patientInfo.clinic}</div>
          <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2px' }}>Informe Radiológico Digital</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '9pt', lineHeight: '1.6' }}>
          <div><strong>Folio:</strong> INF-{id || '0001'}</div>
          <div><strong>Fecha:</strong> {patientInfo.date}</div>
        </div>
      </div>

      {/* Patient data box */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px', marginBottom: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '9pt' }}>
        <div><strong>Paciente:</strong> {patientInfo.name}</div>
        <div><strong>RUT:</strong> {patientInfo.rut}</div>
        <div><strong>Estudio:</strong> {patientInfo.study}</div>
        <div><strong>Médico Solicitante:</strong> {patientInfo.doctor}</div>
      </div>

      {/* Content Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {blocks.map(block => block.content.trim() && (
          <div key={`prev-${block.id}`}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-color)', marginBottom: '4px', borderBottom: '1px solid #e5e7eb', paddingBottom: '2px' }}>
              {block.title}
            </div>
            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>
              {block.content}
            </p>
          </div>
        ))}
      </div>

      {/* Image Annex */}
      {images.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-color)', marginBottom: '12px' }}>
            Anexo Imagenológico
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {images.map(img => (
              <div key={`prev-img-${img.id}`} style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={img.src} alt={img.caption} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                {img.caption && (
                  <div style={{ padding: '4px 6px', fontSize: '7.5pt', textAlign: 'center', color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature */}
      <div style={{ marginTop: '40px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <div style={{ width: '160px', borderBottom: '1px solid #374151', margin: '0 auto 6px auto' }}></div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '10pt' }}>{patientInfo.doctor}</div>
        <div style={{ fontSize: '8pt', color: '#6b7280', marginTop: '2px' }}>Especialista en Radiología Oral y Maxilofacial</div>
      </div>
    </div>
  );

  return (
    <div className="constructor-page">
      {/* Top Action Bar */}
      <div className="constructor-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <button onClick={() => navigate('/admin/informes')} className="icon-btn" style={{ border: 'none', backgroundColor: 'transparent', flexShrink: 0 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Editor de Informe
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {patientInfo.name} · {patientInfo.study}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Tab switcher — always visible */}
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'editor' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <Eye size={14} /> <span className="tab-label">Editor</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'preview' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <FileText size={14} /> <span className="tab-label">Vista Previa</span>
            </button>
          </div>

          <button className="btn-small" style={{ gap: '0.4rem', backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#e9d5ff' }}>
            <Sparkles size={14} />
            <span className="tab-label">IA</span>
          </button>
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={handleExportPDF}>
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      {/* Main Content — tab-based layout */}
      <div className="constructor-body">

        {/* LEFT: Editor Panel */}
        <div className={`constructor-editor ${activeTab !== 'editor' ? 'panel-hidden' : ''}`}>
          
          {/* Patient Info Card */}
          <div className="info-card">
            <div className="info-card-row">
              <User size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <span><strong>Paciente:</strong> {patientInfo.name}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{patientInfo.rut}</span>
            </div>
            <div className="info-card-row">
              <Stethoscope size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <span><strong>Estudio:</strong> {patientInfo.study}</span>
            </div>
            <div className="info-card-row">
              <Calendar size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
              <span><strong>Fecha:</strong> {patientInfo.date}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{patientInfo.doctor}</span>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="editor-section">
            <div className="editor-section-header">
              <span className="editor-section-label">Imágenes Adjuntas</span>
              <span className="badge badge-blue">{images.length} imagen{images.length !== 1 ? 'es' : ''}</span>
            </div>
            <ImageUploadZone
              images={images}
              onAddImages={handleAddImage}
              onRemoveImage={handleRemoveImage}
              onCaptionChange={handleCaptionChange}
            />
          </div>

          {/* Text Blocks */}
          <div className="editor-section">
            <div className="editor-section-header">
              <span className="editor-section-label">Bloques del Informe</span>
              <button className="btn-small" onClick={handleAddBlock} style={{ gap: '0.35rem' }}>
                <Plus size={14} />
                Añadir Bloque
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                {blocks.map(block => (
                  <SortableBlock
                    key={block.id}
                    id={block.id}
                    title={block.title}
                    content={block.content}
                    onContentChange={handleContentChange}
                    onRemove={handleRemoveBlock}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* RIGHT: Preview Panel */}
        <div className={`constructor-preview ${activeTab !== 'preview' ? 'panel-hidden' : ''}`}>
          <div className="preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <FileText size={18} style={{ color: 'var(--accent-color)' }} />
              Vista Previa · A4
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {blocks.filter(b => b.content.trim()).length} bloques · {images.length} imgs
              </span>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.82rem' }} onClick={handleExportPDF}>
                <Download size={15} />
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="preview-scroll">
            <div className="preview-paper-wrap">
              <PreviewDocument />
            </div>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT (only on very wide screens: >1400px viewport) */}
        <style>{`
          @media (min-width: 1400px) {
            .constructor-body {
              flex-direction: row;
            }
            .constructor-editor.panel-hidden,
            .constructor-preview.panel-hidden {
              display: flex !important;
            }
            .constructor-preview {
              width: 48%;
              flex-shrink: 0;
            }
            .tab-switcher {
              display: none !important;
            }
          }
        `}</style>
      </div>

      {/* Component styles */}
      <style>{`
        .constructor-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 70px);
          margin: -2rem;
          background-color: var(--bg-secondary);
          overflow: hidden;
        }

        .constructor-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          gap: 0.75rem;
        }

        .constructor-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        /* By default (single-column / tab mode) */
        .constructor-editor {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background-color: var(--bg-secondary);
        }

        .constructor-preview {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
        }

        /* Hidden panel in tab mode */
        .panel-hidden {
          display: none !important;
        }

        /* Preview internals */
        .preview-header {
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-primary);
          flex-shrink: 0;
        }

        .preview-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          background-color: #dce2e8;
        }

        .preview-paper-wrap {
          max-width: 100%;
          margin: 0 auto;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        }

        /* Patient info card */
        .info-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .info-card-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.6rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .info-card-row:last-child { border-bottom: none; }

        /* Editor sections */
        .editor-section {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .editor-section-header {
          padding: 0.65rem 1rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-secondary);
        }

        .editor-section-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Blocks */
        .informe-block {
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }

        .informe-block:last-child { border-bottom: none; }

        .informe-block-header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.875rem;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .informe-block-drag {
          cursor: grab;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          touch-action: none;
        }

        .informe-block-drag:active { cursor: grabbing; }
        .informe-block-drag:hover { color: var(--accent-color); }

        .informe-block-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .informe-block-actions {
          display: flex;
          gap: 0.2rem;
        }

        .informe-block-body {
          padding: 0.75rem 0.875rem;
        }

        /* Upload Zone */
        .upload-zone {
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin: 0.875rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }

        .upload-zone:hover, .upload-zone--active {
          border-color: var(--accent-color);
          background-color: rgba(85, 181, 217, 0.04);
        }

        /* Image gallery */
        .image-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.625rem;
          padding: 0 0.875rem 0.875rem 0.875rem;
        }

        .image-thumb {
          position: relative;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background-color: #000;
        }

        .image-thumb img { display: block; }

        .image-thumb-remove {
          position: absolute;
          top: 3px;
          right: 3px;
          background-color: rgba(239, 68, 68, 0.92);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
        }

        /* Tab switcher */
        .tab-switcher {
          display: flex;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 3px;
          gap: 2px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.65rem;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .tab-btn--active {
          background-color: var(--bg-primary);
          color: var(--accent-color);
          box-shadow: var(--shadow-sm);
          font-weight: 600;
        }

        /* On wide screens — split view */
        @media (min-width: 1400px) {
          .constructor-body { flex-direction: row; }
          .constructor-preview { border-top: none; border-left: 1px solid var(--border-color); }
        }

        @media (max-width: 600px) {
          .tab-label { display: none; }
          .constructor-topbar { padding: 0.6rem 0.875rem; }
        }
      `}</style>
    </div>
  );
};

export default ConstructorInformeMejorado;

