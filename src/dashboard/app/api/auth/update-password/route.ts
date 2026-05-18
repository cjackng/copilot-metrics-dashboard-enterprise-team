import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setPasswordHash } from "@/lib/auth-db";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await setPasswordHash(hash);

  return NextResponse.json({ ok: true });
}
