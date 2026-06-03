import { Router, Request, Response } from "express";
import { sql } from "../lib/db";
import { requireAuth } from "../middleware/requireAuth";
import { sendMail, smtpConfigured } from "../lib/mailer";
import { otpEmail } from "../lib/email-templates";
import { generateOTP, storeOTP, consumeOTP } from "../lib/email-otp";
import { signToken } from "../lib/jwt";

export const authRoutes = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;

async function sendOtpEmail(
  to: string,
  purpose: "signup" | "login"
): Promise<void> {
  const otp = generateOTP();
  await storeOTP(to, otp, purpose);
  const tpl = otpEmail(otp, purpose);

  if (!smtpConfigured) {
    console.warn(`[mail] SMTP not configured — ${purpose} code for ${to}: ${otp}`);
    return;
  }
  await sendMail({ to, ...tpl });
  console.log(`[mail] ${purpose} code sent to ${to}`);
}

// POST /api/auth/signup — step 1: send verification code
authRoutes.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, full_name, phone, role } = req.body ?? {};
    if (!email || !full_name || !phone || !role) {
      res.status(400).json({ error: "email, full_name, phone and role are required" });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: "invalid email" });
      return;
    }
    if (!["doctor", "mr"].includes(role)) {
      res.status(400).json({ error: "role must be doctor or mr" });
      return;
    }
    if (typeof full_name !== "string" || full_name.trim().length < 2) {
      res.status(400).json({ error: "full_name is too short" });
      return;
    }
    if (typeof phone !== "string" || phone.replace(/\D/g, "").length < 7) {
      res.status(400).json({ error: "phone is too short" });
      return;
    }

    const existing = await sql`
      SELECT id FROM profiles
      WHERE email = ${email.toLowerCase()} OR phone = ${phone}
      LIMIT 1
    `;
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email or phone already exists" });
      return;
    }

    try {
      await sendOtpEmail(email, "signup");
    } catch (mailErr: any) {
      console.error(`[mail] FAILED signup OTP to ${email}:`, mailErr?.message ?? mailErr);
      res.status(500).json({ error: `Email delivery failed: ${mailErr?.message ?? mailErr}` });
      return;
    }

    res.json({ message: "Verification code sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-signup — step 2: verify code, create profile, issue JWT
authRoutes.post("/verify-signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body ?? {};
    if (!email || !otp) {
      res.status(400).json({ error: "email and otp are required" });
      return;
    }
    if (!EMAIL_RE.test(email) || !OTP_RE.test(otp)) {
      res.status(400).json({ error: "invalid email or otp" });
      return;
    }

    // We don't have the payload in the OTP (we only stored the code),
    // so the form must re-send the signup data alongside the code.
    const { full_name, phone, role } = req.body ?? {};
    if (!full_name || !phone || !role || !["doctor", "mr"].includes(role)) {
      res.status(400).json({ error: "full_name, phone and role are required" });
      return;
    }

    const ok = await consumeOTP(email, otp, "signup");
    if (!ok) {
      res.status(401).json({ error: "Invalid or expired code" });
      return;
    }

    const existing = await sql`
      SELECT id FROM profiles
      WHERE email = ${email.toLowerCase()} OR phone = ${phone}
      LIMIT 1
    `;
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email or phone already exists" });
      return;
    }

    const profiles = await sql<{ id: string; email: string; full_name: string; phone: string; role: string }[]>`
      INSERT INTO profiles (id, email, full_name, phone, role)
      VALUES (gen_random_uuid(), ${email.toLowerCase()}, ${full_name}, ${phone}, ${role})
      RETURNING id, email, full_name, phone, role
    `;
    const profile = profiles[0];

    const access_token = signToken({
      sub: profile.id,
      email: profile.email,
      role: profile.role as "doctor" | "mr",
    });

    res.json({ access_token, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — step 1: send sign-in code
authRoutes.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body ?? {};
    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: "valid email is required" });
      return;
    }

    const profiles = await sql<{ id: string }[]>`
      SELECT id FROM profiles WHERE email = ${email.toLowerCase()} LIMIT 1
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: "No account found with this email" });
      return;
    }

    try {
      await sendOtpEmail(email, "login");
    } catch (mailErr: any) {
      console.error(`[mail] FAILED login OTP to ${email}:`, mailErr?.message ?? mailErr);
      res.status(500).json({ error: `Email delivery failed: ${mailErr?.message ?? mailErr}` });
      return;
    }

    res.json({ message: "Sign-in code sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/send-otp — resend sign-in code (same as login step 1)
authRoutes.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body ?? {};
    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: "valid email is required" });
      return;
    }

    const profiles = await sql<{ id: string }[]>`
      SELECT id FROM profiles WHERE email = ${email.toLowerCase()} LIMIT 1
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: "No account found with this email" });
      return;
    }

    try {
      await sendOtpEmail(email, "login");
    } catch (mailErr: any) {
      console.error(`[mail] FAILED resend OTP to ${email}:`, mailErr?.message ?? mailErr);
      res.status(500).json({ error: `Email delivery failed: ${mailErr?.message ?? mailErr}` });
      return;
    }

    res.json({ message: "Sign-in code sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp — step 2: verify sign-in code, issue JWT
authRoutes.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body ?? {};
    if (!email || !otp) {
      res.status(400).json({ error: "email and otp are required" });
      return;
    }
    if (!EMAIL_RE.test(email) || !OTP_RE.test(otp)) {
      res.status(400).json({ error: "invalid email or otp" });
      return;
    }

    const ok = await consumeOTP(email, otp, "login");
    if (!ok) {
      res.status(401).json({ error: "Invalid or expired code" });
      return;
    }

    const profiles = await sql<{ id: string; email: string; full_name: string; phone: string; role: string }[]>`
      SELECT id, email, full_name, phone, role
        FROM profiles
       WHERE email = ${email.toLowerCase()}
       LIMIT 1
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const profile = profiles[0];

    const access_token = signToken({
      sub: profile.id,
      email: profile.email,
      role: profile.role as "doctor" | "mr",
    });

    res.json({ access_token, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout — stateless JWT, so this is a no-op
authRoutes.post("/logout", requireAuth, (_req: Request, res: Response): void => {
  res.json({ message: "Signed out" });
});

// GET /api/auth/me — return current profile
authRoutes.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await sql<{ id: string; email: string; full_name: string; phone: string; role: string }[]>`
      SELECT id, email, full_name, phone, role FROM profiles WHERE id = ${req.userId} LIMIT 1
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json({ profile: profiles[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
