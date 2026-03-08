"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "ja" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ja",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");

  useEffect(() => {
    const saved = localStorage.getItem("mariko_lang") as Lang | null;
    if (saved === "en" || saved === "ja") setLangState(saved);
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("mariko_lang", newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
