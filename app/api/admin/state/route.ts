import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import {
  getTournamentState,
  isValidState,
  resetTournamentState,
  saveTournamentState,
} from "@/lib/store";

const MAX_BODY_BYTES = 1_000_000;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function requireAuth(request: NextRequest): NextResponse | null {
  if (!verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return unauthorized();
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;
  return NextResponse.json(await getTournamentState());
}

export async function PUT(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Unsupported media type." },
      { status: 415 },
    );
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isValidState(body)) {
    return NextResponse.json(
      { error: "Invalid tournament state." },
      { status: 400 },
    );
  }
  await saveTournamentState(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;
  return NextResponse.json(await resetTournamentState());
}
