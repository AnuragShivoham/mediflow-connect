import crypto from "node:crypto";
import { sql } from "./db";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

export type OtpPurpose = "signup" | "login";

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function generateOTP(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export async function storeOTP(
  email: string,
  otp: string,
  purpose: OtpPurpose,
  payload: Record<string, string> | null = null
): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS);
  await sql`
    INSERT INTO email_otps (email, otp_hash, purpose, payload, expires_at)
    VALUES (
      ${email.toLowerCase()},
      ${hashOtp(otp)},
      ${purpose},
      ${payload ? sql.json(payload as Record<string, never>) : null},
      ${expiresAt.toISOString()}
    )
  `;
}

export async function consumeOTP(
  email: string,
  otp: string,
  purpose: OtpPurpose
): Promise<{ id: string; payload: Record<string, string> | null } | null> {
  const result = await sql<{ id: string; payload: Record<string, string> | null }[]>`
    UPDATE email_otps
       SET consumed_at = now()
     WHERE email = ${email.toLowerCase()}
       AND purpose = ${purpose}
       AND otp_hash = ${hashOtp(otp)}
       AND consumed_at IS NULL
       AND expires_at > now()
     RETURNING id, payload
  `;
  if (result.length === 0) return null;
  return { id: result[0].id, payload: result[0].payload };
}
