import { createContext, useContext, useState, useEffect } from 'react';
import fr from '../translations/fr.json';
import en from '../translations/en.json';

const translations = { fr, en };
const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sos_lang') || 'fr');
  const t = translations[lang] || fr;

  const toggle = () => {
    const next = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    localStorage.setItem('sos_lang', next);
  };

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
