"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toCyrillic } from "./transliterate";
import { dictionary } from "./dictionary";

export type Lang = "latin" | "cyrillic";

const STORAGE_KEY = "metro_ads_lang";
const MARK = "";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Interfeys matni: lug'at kaliti orqali (`dictionary.ts`). */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Backenddan kelgan erkin matn (nom, manzil, izoh...) — kod/identifikatorlar uchun ishlatilmaydi. */
  td: (text: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("latin");

  useEffect(() => {
    // localStorage faqat clientda mavjud — SSR/hydration mos kelishi uchun shu yerda o'qiladi.
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "latin" || saved === "cyrillic") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const td = useCallback((text: string | null | undefined) => (lang === "cyrillic" ? toCyrillic(text ?? "") : (text ?? "")), [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const template = dictionary[key] ?? key;
      let rendered = template;
      const values: string[] = [];
      if (params) {
        rendered = rendered.replace(/\{(\w+)\}/g, (_, k: string) => {
          values.push(String(params[k] ?? ""));
          return `${MARK}${values.length - 1}${MARK}`;
        });
      }
      if (lang === "cyrillic") rendered = toCyrillic(rendered);
      if (params) {
        rendered = rendered.replace(new RegExp(`${MARK}(\\d+)${MARK}`, "g"), (_, idx: string) => values[Number(idx)]);
      }
      return rendered;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, td }), [lang, setLang, t, td]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak");
  return ctx;
}
