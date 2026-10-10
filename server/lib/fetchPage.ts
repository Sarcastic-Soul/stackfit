// Downloads a public hackathon page and strips it to plain text.
// The URL comes from the user, so every hop (including redirects) is checked:
// only http/https, and never localhost or a private network address.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const MAX_CHARS = 30_000;
const MIN_CHARS = 500; // less than this is usually a JS-only shell

export type PageResult = { ok: true; text: string; url: string } | { ok: false; reason: string };

export class UnsafeUrlError extends Error {}

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIP(ip: string) {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIPv4(v6.slice(7));
  return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

async function assertSafe(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https links are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new UnsafeUrlError("Local addresses are not allowed.");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.some((a) => isPrivateIP(a.address))) {
    throw new UnsafeUrlError("Private network addresses are not allowed.");
  }
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// Throws UnsafeUrlError for blocked URLs; returns ok: false when the page can't be read.
export async function fetchPage(rawUrl: string): Promise<PageResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a link.");
  }

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertSafe(url);
      const res = await fetch(url, {
        redirect: "manual",
        signal,
        headers: { "user-agent": "StackFit/0.1 (+hackathon stack helper)", accept: "text/html" },
      });
      const next = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && next) {
        url = new URL(next, url);
        continue;
      }
      if (res.status !== 200) return { ok: false, reason: `status ${res.status}` };
      const text = htmlToText(await res.text()).slice(0, MAX_CHARS);
      if (text.length < MIN_CHARS) return { ok: false, reason: "too little text" };
      return { ok: true, text, url: url.toString() };
    }
    return { ok: false, reason: "too many redirects" };
  } catch (err) {
    if (err instanceof UnsafeUrlError) throw err;
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// Backup for sites that block cloud servers (Devpost answers 403 to Vercel):
// Exa's crawler fetches the page text instead. Same safety check first.
export async function fetchViaExa(rawUrl: string): Promise<PageResult> {
  const key = process.env.EXA_API_KEY;
  if (!key) return { ok: false, reason: "no EXA_API_KEY" };
  const url = new URL(rawUrl);
  await assertSafe(url);
  try {
    const res = await fetch("https://api.exa.ai/contents", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({ urls: [url.toString()], text: { maxCharacters: MAX_CHARS } }),
    });
    if (!res.ok) return { ok: false, reason: `exa status ${res.status}` };
    const data = (await res.json()) as { results?: { url?: string; text?: string }[] };
    const text = (data.results?.[0]?.text ?? "").trim().slice(0, MAX_CHARS);
    if (text.length < MIN_CHARS) return { ok: false, reason: "exa: too little text" };
    return { ok: true, text, url: url.toString() };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
