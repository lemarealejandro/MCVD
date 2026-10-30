import React, { useRef, useState, useEffect } from 'react';
import { Pen, Trash2, Check, X } from 'lucide-react';

const SignatureCanvas = ({ onSave, onCancel, existingSignature = null, label = 'Firma del Paciente' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPos, setLastPos] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (existingSignature) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = existingSignature;
      setIsEmpty(false);
    }
  }, [existingSignature]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setLastPos(pos);
    setIsEmpty(false);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, new Date().toISOString());
  };

  return (
    <div className="signature-wrapper">
      <label className="signature-label">
        <Pen size={15} />
        {label}
      </label>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <p className="canvas-hint">Firma aquí con el mouse o dedo</p>
      </div>
      <div className="signature-actions">
        <button className="sig-btn sig-btn-danger" onClick={clearCanvas}>
          <Trash2 size={15} /> Limpiar
        </button>
        {onCancel && (
          <button className="sig-btn sig-btn-outline" onClick={onCancel}>
            <X size={15} /> Cancelar
          </button>
        )}
        <button
          className="sig-btn sig-btn-primary"
          onClick={handleSave}
          disabled={isEmpty}
        >
          <Check size={15} /> Guardar Firma
        </button>
      </div>

      <style>{`
        .signature-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .signature-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .canvas-container {
          position: relative;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          background: #fff;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .canvas-container:hover {
          border-color: var(--accent-color);
        }
        .signature-canvas {
          display: block;
          width: 100%;
          height: 160px;
          cursor: crosshair;
          touch-action: none;
        }
        .canvas-hint {
          position: absolute;
          bottom: 0.5rem;
          right: 0.75rem;
          font-size: 0.75rem;
          color: #ccc;
          pointer-events: none;
        }
        .signature-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        .sig-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .sig-btn-primary {
          background: var(--accent-color);
          color: #fff;
        }
        .sig-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .sig-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .sig-btn-danger {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .sig-btn-danger:hover { background: #fecaca; }
        .sig-btn-outline {
          background: transparent;
          border-color: var(--border-color);
          color: var(--text-primary);
        }
        .sig-btn-outline:hover { background: var(--bg-secondary); }
      `}</style>
    </div>
  );
};

export default SignatureCanvas;
