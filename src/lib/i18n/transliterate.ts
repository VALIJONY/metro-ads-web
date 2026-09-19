/**
 * O'zbek lotin -> kirill transliteratsiyasi. Ikkala yozuv ham bir xil til bo'lgani
 * uchun (faqat skript farqli), lug'atni ikki marta yozish o'rniga shu algoritm bilan
 * avtomatik hosil qilinadi.
 */

const DIGRAPHS: [string, string][] = [
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["sh", "ш"],
  ["ch", "ч"],
  ["ng", "нг"],
  ["o'", "ў"],
  ["oʻ", "ў"],
  ["o‘", "ў"],
  ["o’", "ў"],
  ["g'", "ғ"],
  ["gʻ", "ғ"],
  ["g‘", "ғ"],
  ["g’", "ғ"],
];

const SINGLE: Record<string, string> = {
  a: "а",
  b: "б",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "ҳ",
  i: "и",
  j: "ж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "қ",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  x: "х",
  y: "й",
  z: "з",
  "'": "ъ",
  "ʼ": "ъ",
  "‘": "ъ",
  "’": "ъ",
};

function matchCase(cyr: string, original: string): string {
  const isAllUpper = original === original.toUpperCase() && original !== original.toLowerCase();
  if (isAllUpper) return cyr.toUpperCase();
  const first = original[0];
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return cyr[0].toUpperCase() + cyr.slice(1);
  }
  return cyr;
}

const LETTER_RE = /[a-zA-Z]/;

export function toCyrillic(text: string): string {
  let result = "";
  const lower = text.toLowerCase();
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const [lat, cyr] of DIGRAPHS) {
      const len = lat.length;
      if (lower.slice(i, i + len) === lat) {
        result += matchCase(cyr, text.slice(i, i + len));
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = text[i];
    const lch = ch.toLowerCase();
    if (lch === "e") {
      // So'z boshida "e" -> "э" (masalan "eski" -> "эски"), boshqa joyda "е"
      const prev = text[i - 1];
      const wordStart = !prev || !LETTER_RE.test(prev);
      result += matchCase(wordStart ? "э" : "е", ch);
    } else if (SINGLE[lch]) {
      result += matchCase(SINGLE[lch], ch);
    } else {
      result += ch;
    }
    i += 1;
  }
  return result;
}
