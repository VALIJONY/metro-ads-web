export function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return "—";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Narx kiritish maydonlari uchun: "1500000" -> "1 500 000" (faqat ko'rsatish uchun).
 * Backenddan "1500000.00" ko'rinishida kelgan qiymatlar ham to'g'ri ishlashi uchun
 * kasr qismi (agar bo'lsa) formatlashdan oldin kesib tashlanadi — aks holda nuqta
 * raqamlar bilan birlashib ketib, narx noto'g'ri (masalan 10x katta) ko'rinadi.
 */
export function formatThousands(value: string): string {
  const digits = value.split(".")[0].replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Formatlangan matndan orqaga — faqat raqamlarni qoldiradi (backendga shu ko'rinishda yuboriladi). */
export function unformatThousands(value: string): string {
  return value.replace(/\D/g, "");
}
