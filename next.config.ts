import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Dev-server ngrok orqali tashqariga chiqarilganda HMR (hot-reload) WebSocket
   * ulanishi "cross-origin" deb bloklanmasligi uchun — Next.js xavfsizlik
   * maqsadida standart holatda faqat localhost'dan kelgan so'rovlarga ruxsat beradi.
   * "*" — ngrok'ning bepul tarifida har safar tasodifiy subdomen berilishi mumkinligi
   * uchun barcha variantlarni qamrab oladi.
   */
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],

  // `/api/*` so'rovlarini backendga proksi qilish `src/app/api/[...path]/route.ts`
  // orqali amalga oshiriladi (`rewrites()` ishlatilmadi — u oxiridagi "/" belgisini
  // proksidan oldin olib tashlab, Django'ning yo'l shabloniga mos kelmay qolardi).
  //
  // `trailingSlash: true` — shart: aks holda Next.js `/api/.../login/` kabi
  // so'rovlarni proksi ishga tushishidan OLDIN "/" siz shaklga 308 bilan
  // yo'naltiradi; Django esa POST so'rovni "/" siz qabul qilganda APPEND_SLASH
  // orqali avtomatik qayta yo'naltira olmaydi (ma'lumot yo'qolishidan saqlanish
  // uchun) va xato beradi. API yo'llarimiz allaqachon barchasi "/" bilan
  // tugagani uchun bu sozlash ularga mos, faqat sahifa yo'llariga bittagina
  // qo'shimcha (zararsiz) yo'naltirish qo'shadi.
  trailingSlash: true,
};

export default nextConfig;
