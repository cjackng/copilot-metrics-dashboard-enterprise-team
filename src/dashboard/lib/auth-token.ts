export const COOKIE_NAME = "dash_auth";

const HMAC_PAYLOAD = "authenticated";

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

/** Generate a token signed with the stored password hash. */
export async function generateToken(passwordHash: string): Promise<string> {
  const key = await getKey(passwordHash);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(HMAC_PAYLOAD));
  return bufferToHex(sig);
}

/** Verify a token against the stored password hash. Auto-invalidates on password change. */
export async function verifyToken(token: string, passwordHash: string): Promise<boolean> {
  try {
    const key = await getKey(passwordHash);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBuffer(token),
      new TextEncoder().encode(HMAC_PAYLOAD)
    );
  } catch {
    return false;
  }
}
