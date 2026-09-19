"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const isCyrillic = lang === "cyrillic";

  return (
    <div
      role="group"
      aria-label="Til / Тил"
      className={cn(
        "relative inline-grid grid-cols-2 rounded-full border border-border bg-muted p-[3px]",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-y-[3px] left-[3px] w-9 rounded-full bg-[var(--navy)] shadow-sm transition-transform duration-200 ease-out"
        style={{ transform: isCyrillic ? "translateX(100%)" : "translateX(0)" }}
      />
      <button
        type="button"
        onClick={() => setLang("latin")}
        aria-pressed={!isCyrillic}
        className={cn(
          "relative z-10 w-9 rounded-full py-1.5 font-mono text-[11px] font-bold tracking-wide transition-colors",
          !isCyrillic ? "text-white" : "text-muted-foreground hover:text-foreground"
        )}
      >
        UZ
      </button>
      <button
        type="button"
        onClick={() => setLang("cyrillic")}
        aria-pressed={isCyrillic}
        className={cn(
          "relative z-10 w-9 rounded-full py-1.5 font-mono text-[11px] font-bold tracking-wide transition-colors",
          isCyrillic ? "text-white" : "text-muted-foreground hover:text-foreground"
        )}
      >
        ЎЗ
      </button>
    </div>
  );
}
