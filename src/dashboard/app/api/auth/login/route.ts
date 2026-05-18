import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, generateToken } from "@/lib/auth-token";
import { getPasswordHash } from "@/lib/auth-db";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  let storedHash: string | null = null;
  try {
    storedHash = await getPasswordHash();
  } catch {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  if (!storedHash) {
    return NextResponse.json({ error: "No password configured" }, { status: 503 });
  }

  const valid = await bcrypt.compare(password, storedHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await generateToken(storedHash);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // No maxAge — session cookie, expires when browser closes
    path: "/",
  });
  return response;
}

