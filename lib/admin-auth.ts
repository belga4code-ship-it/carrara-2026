import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

function readServerEnv(name: string): string | undefined {
  // Keep server secrets as runtime reads so the Next.js build doesn't inline them.
  return process.env[name];
}

export function hasAdminAuthConfig(): boolean {
  return Boolean(readServerEnv("ADMIN_PASSWORD"));
}

export function verifyAdminPassword(value: unknown): boolean {
  const expected = readServerEnv("ADMIN_PASSWORD");
  if (typeof value !== "string" || !expected) return false;
  const suppliedBuffer = Buffer.from(value, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export function createAdminSessionToken(): string | null {
  // Reuse the configured admin password as the signing key so hosting needs
  // only one credential and no extra secret that can be copied into build output.
  const secret = readServerEnv("ADMIN_PASSWORD");
  if (!secret) return null;
  const expiresAt = String(Math.floor(Date.now() / 1000) + 60 * 60 * 8);
  const signature = createHmac("sha256", secret).update(expiresAt).digest("hex");
  return expiresAt + "." + signature;
}

export function verifyAdminSession(token: string | undefined): boolean {
  const secret = readServerEnv("ADMIN_PASSWORD");
  if (!secret || !token) return false;
  const [expiresAt, signature, extra] = token.split(".");
  if (!expiresAt || !signature || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(expiresAt).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
