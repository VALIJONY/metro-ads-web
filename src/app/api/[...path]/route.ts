import { NextRequest } from "next/server";

/**
 * Backend'ga qo'lda proksi — `next.config.ts`dagi `rewrites()` yetarli emas edi,
 * chunki Next.js `/api/.../login/` kabi oxiridagi "/" ni proksidan OLDIN avtomatik
 * olib tashlab (308 redirect) yuborar edi, Django esa aynan "/" bilan tugaydigan
 * yo'lni kutadi. Bu route handler Next'ning sahifa-marshrutlash/normallashtirish
 * bosqichini butunlay chetlab o'tadi va so'rovni aynan kelgan holicha (query,
 * headers, body, trailing slash) backendga uzatadi.
 */
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000";

async function proxy(req: NextRequest) {
  const incoming = new URL(req.url);
  const target = `${BACKEND}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const res = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  const resHeaders = new Headers(res.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("content-length");

  return new Response(res.body, { status: res.status, headers: resHeaders });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as OPTIONS,
  proxy as HEAD,
};
