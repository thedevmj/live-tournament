import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "ot_admin";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

let warned = false;
function warnMissingPassword() {
  if (warned) return;
  warned = true;
  console.warn(
    "[admin] ADMIN_PASSWORD is not set — admin login is disabled. Configure it in .env.local.",
  );
}

function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  if (typeof value === "string" && value.length > 0) return value;
  warnMissingPassword();
  return null;
}

function sessionSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (typeof explicit === "string" && explicit.length > 0) return explicit;
  const password = adminPassword();
  return password === null ? null : `overtime-session::${password}`;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function sign(exp: number): string | null {
  const secret = sessionSecret();
  if (secret === null) return null;
  return createHmac("sha256", secret).update(String(exp)).digest("hex");
}

export function checkPassword(candidate: unknown): boolean {
  const password = adminPassword();
  if (password === null || typeof candidate !== "string") return false;
  return safeEqual(candidate, password);
}

export function createSessionToken(): { value: string; maxAge: number } {
  const exp = Date.now() + SESSION_TTL_MS;
  const sig = sign(exp);
  return {
    value: sig === null ? "" : `${exp}.${sig}`,
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  if (!expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = sign(exp);
  return expected !== null && safeEqual(sig, expected);
}
