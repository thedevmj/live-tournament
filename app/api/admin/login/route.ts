import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
} from "@/lib/admin-auth";

const MAX_FAILS = 5;
const LOCK_MS = 30_000;
const MAX_BODY_BYTES = 4_096;
const MAX_TRACKED_KEYS = 500;

type Attempt = { fails: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return "local";
}

function jsonWithStatus(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonWithStatus({ error: "Unsupported media type." }, 415);
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return jsonWithStatus({ error: "Payload too large." }, 413);
  }

  const key = clientKey(request);
  const entry = attempts.get(key) ?? { fails: 0, lockedUntil: 0 };

  if (Date.now() < entry.lockedUntil) {
    return jsonWithStatus(
      { error: "Too many attempts — try again in a moment." },
      429,
    );
  }

  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;

  if (!checkPassword(body?.password)) {
    entry.fails += 1;
    if (entry.fails >= MAX_FAILS) {
      entry.fails = 0;
      entry.lockedUntil = Date.now() + LOCK_MS;
    }
    if (attempts.size > MAX_TRACKED_KEYS) attempts.clear();
    attempts.set(key, entry);
    return jsonWithStatus({ error: "Invalid password." }, 401);
  }

  attempts.delete(key);
  const { value, maxAge } = createSessionToken();
  const secure =
    request.headers.get("x-forwarded-proto") === "https" ||
    request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge,
  });
  return response;
}
