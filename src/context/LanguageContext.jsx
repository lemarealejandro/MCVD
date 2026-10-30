import React, { createContext, useState, useContext } from 'react';
import { content } from '../data/content';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es'); // Default Spanish

  // Helper to optionally toggle language
  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'es' ? 'en' : 'es'));
  };

  // Translation function: looks up path in content JSON
  // Example usage: t('hero.headline')
  const t = (path) => {
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), content[language]) || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
