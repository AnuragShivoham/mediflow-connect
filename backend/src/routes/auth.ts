import { Router, Request, Response } from 'express';
import { supabaseAuth } from '../lib/auth';
import { sql } from '../lib/db';
import { requireAuth } from '../middleware/requireAuth';

export const authRoutes = Router();

// POST /api/auth/signup
authRoutes.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    if (!email || !password || !full_name || !phone || !role) {
      res.status(400).json({ error: 'email, password, full_name, phone and role are required' });
      return;
    }
    if (!['doctor', 'mr'].includes(role)) {
      res.status(400).json({ error: 'role must be doctor or mr' });
      return;
    }

    // 1. Create auth user
    const { data, error } = await supabaseAuth.auth.signUp({ email, password });
    if (error) { res.status(400).json({ error: error.message }); return; }
    if (!data.user) { res.status(400).json({ error: 'Signup failed' }); return; }

    // 2. Insert into profiles table
    await sql`
      INSERT INTO profiles (id, email, full_name, phone, role)
      VALUES (${data.user.id}, ${email}, ${full_name}, ${phone}, ${role})
      ON CONFLICT (id) DO NOTHING
    `;

    res.status(201).json({ message: 'Account created. Check your email to verify, then sign in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — verify password, then send OTP
authRoutes.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    // Step 1: Verify credentials
    const { error: pwError } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (pwError) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    // Step 2: Drop that session immediately — we require OTP before granting access
    await supabaseAuth.auth.signOut();

    // Step 3: Send OTP
    const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) { res.status(500).json({ error: `Could not send OTP: ${otpError.message}` }); return; }

    res.json({ message: 'otp_sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/send-otp — resend OTP
authRoutes.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'email is required' }); return; }

    const { error } = await supabaseAuth.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) { res.status(500).json({ error: error.message }); return; }

    res.json({ message: 'otp_sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp — verify OTP, return JWT + profile
authRoutes.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      res.status(400).json({ error: 'email and token are required' });
      return;
    }

    const { data, error } = await supabaseAuth.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error || !data.session) {
      res.status(401).json({ error: error?.message ?? 'Invalid OTP' });
      return;
    }

    // Fetch profile from DB
    const profiles = await sql`
      SELECT id, email, full_name, phone, role FROM profiles WHERE id = ${data.user!.id}
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: 'Profile not found. Please sign up first.' });
      return;
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      profile: profiles[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await supabaseAuth.auth.signOut();
    res.json({ message: 'Signed out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password — send recovery OTP
authRoutes.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'email is required' }); return; }

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email);
    if (error) { res.status(500).json({ error: error.message }); return; }

    res.json({ message: 'Recovery code sent to your email' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password — verify recovery OTP + set new password
authRoutes.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      res.status(400).json({ error: 'email, token and password are required' });
      return;
    }

    // Step 1: Verify recovery OTP
    const { data, error: otpError } = await supabaseAuth.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (otpError || !data.session) {
      res.status(401).json({ error: otpError?.message ?? 'Invalid or expired code' });
      return;
    }

    // Step 2: Update password using the session from verified OTP
    const { error: updateError } = await supabaseAuth.auth.updateUser({ password });
    if (updateError) { res.status(500).json({ error: updateError.message }); return; }

    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — get current user profile
authRoutes.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await sql`
      SELECT id, email, full_name, phone, role FROM profiles WHERE id = ${req.userId}
    `;
    if (profiles.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({ profile: profiles[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
