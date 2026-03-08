"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center bg-secondary rounded-lg p-0.5">
      <button
        onClick={() => setLang("ja")}
        className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
          lang === "ja"
            ? "bg-card text-foreground font-semibold shadow-sm"
            : "text-muted-foreground font-medium"
        }`}
      >
        JP
      </button>
      <button
        onClick={() => setLang("en")}
        className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
          lang === "en"
            ? "bg-card text-foreground font-semibold shadow-sm"
            : "text-muted-foreground font-medium"
        }`}
      >
        EN
      </button>
    </div>
  );
}
