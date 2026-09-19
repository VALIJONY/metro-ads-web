"use client";

import type { StatusStyle } from "@/lib/status";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Badge({ style, small }: { style: StatusStyle; small?: boolean }) {
  const { t } = useLanguage();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifySelf: "start",
        padding: small ? "3px 8px" : "5px 10px",
        borderRadius: 7,
        background: style.hatched
          ? `repeating-linear-gradient(45deg, ${style.bg}, ${style.bg} 5px, #e4e4e7 5px, #e4e4e7 10px)`
          : style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
        fontWeight: 700,
        fontSize: small ? 11 : 11.5,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {t(style.labelKey)}
    </span>
  );
}
