"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import en from "@/config/locales/en.json";
import vi from "@/config/locales/vi.json";

export type Language = "en" | "vi";
export type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "app-language";
const translations = {
  en,
  vi,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const savedLang = Cookies.get(STORAGE_KEY) as Language;
    if (savedLang && (savedLang === "en" || savedLang === "vi")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    Cookies.set(STORAGE_KEY, lang);
  };

  const t = (path: string, params?: Record<string, string>): string => {
    const keys = path.split(".");
    let current: any = translations[language];

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to key if not found
        console.warn(`Translation missing for key: ${path}`);
        return path;
      }
    }

    if (typeof current === "string" && params) {
      let result = current;
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`{{${key}}}`, value);
      });
      return result;
    }

    return typeof current === "string" ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
