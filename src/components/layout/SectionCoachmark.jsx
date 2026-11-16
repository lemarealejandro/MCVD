import React, { useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { SECTION_HELP, COACH_SEEN_KEY } from '../../data/sectionHelp';
import './SectionCoachmark.css';

// Se guarda en sessionStorage: dura lo que la sesión y se limpia al iniciar sesión (ver auth.js).
const readSeen = () => {
  try {
    return JSON.parse(sessionStorage.getItem(COACH_SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};

const markSeen = (section) => {
  try {
    const seen = readSeen();
    if (!seen.includes(section)) sessionStorage.setItem(COACH_SEEN_KEY, JSON.stringify([...seen, section]));
  } catch {
    // sessionStorage no disponible: el coachmark volverá a mostrarse en la siguiente visita
  }
};

const sectionFromPath = (pathname) => pathname.split('/')[2] || 'dashboard';

const SectionCoachmark = () => {
  const { pathname } = useLocation();
  const [, rerender] = useReducer(n => n + 1, 0);
  const section = sectionFromPath(pathname);
  const help = SECTION_HELP[section];

  if (!help || readSeen().includes(section)) return null;

  const close = () => {
    markSeen(section);
    rerender();
  };

  return (
    <div className="coachmark" role="dialog" aria-labelledby="coachmark-title" aria-live="polite">
      <div className="coachmark-header">
        <h4 id="coachmark-title">{help.title}</h4>
        <button className="coachmark-close" onClick={close} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
      <p>{help.text}</p>
      <button className="btn btn-primary coachmark-action" onClick={close}>Entendido</button>
    </div>
  );
};

export default SectionCoachmark;
