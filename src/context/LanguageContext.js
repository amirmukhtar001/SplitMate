import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSelectedLanguage, setSelectedLanguage } from "../storage/languageStorage";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from "../i18n/translations";

const RTL_LANGUAGES = ["urdu", "sindhi", "arabic"];

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  isRTL: false,
  hasSelectedLanguage: false,
  isLanguageReady: false,
  setLanguage: async () => {},
  t: (key) => key
});

function formatTemplate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, token) => {
    return Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : `{${token}}`;
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const saved = await getSelectedLanguage();
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        setLanguageState(saved);
        setHasSelectedLanguage(true);
      }
      setIsLanguageReady(true);
    };
    loadLanguage();
  }, []);

  const setLanguage = async (nextLanguage) => {
    const safeLanguage = SUPPORTED_LANGUAGES.includes(nextLanguage) ? nextLanguage : DEFAULT_LANGUAGE;
    setLanguageState(safeLanguage);
    setHasSelectedLanguage(true);
    await setSelectedLanguage(safeLanguage);
  };

  const t = (key, params) => {
    const value = translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
    return formatTemplate(value, params);
  };

  const contextValue = useMemo(
    () => ({
      language,
      isRTL: RTL_LANGUAGES.includes(language),
      hasSelectedLanguage,
      isLanguageReady,
      setLanguage,
      t
    }),
    [language, hasSelectedLanguage, isLanguageReady]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
