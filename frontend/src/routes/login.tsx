import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Activity, ArrowLeft, Loader2, Mail, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParticleField } from "@/components/particle-field";
import { GlassCard } from "@/components/glass-card";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MedFlow" }] }),
  component: LoginPage,
});

type Step = "email" | "otp";

function LoginPage() {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onSendCode = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/login", { email: trimmed });
      setStep("otp");
      toast.success("Sign-in code sent to your email.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.post<{ access_token: string; profile: any }>("/auth/verify-otp", {
        email: email.trim(),
        otp,
      });
      setSession(data.access_token, data.profile);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/send-otp", { email: email.trim() });
      toast.success("A new code was sent.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 dark:bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 aurora opacity-80 dark:opacity-50" />
      <div className="pointer-events-none absolute inset-0">
        <ParticleField density={55} className="h-full w-full" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <GlassCard className="p-8 md:p-10">
          <Link to="/" className="mb-6 flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Activity className="h-5 w-5" />
            </motion.div>
            <span className="font-display text-lg font-semibold">
              <span className="gradient-text">MedFlow</span>
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <Sparkles className="h-3 w-3" /> Welcome back
                </div>
                <h1 className="mt-2 font-display text-2xl font-semibold">Sign in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we'll send you a one-time code.
                </p>
                <form onSubmit={onSendCode} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="h-11 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95 transition-all"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send sign-in code
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link to="/signup" className="font-medium text-primary hover:underline">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <KeyRound className="h-3 w-3" /> Check your inbox
                </div>
                <h1 className="mt-2 font-display text-2xl font-semibold">Enter verification code</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. It expires in 10 minutes.
                </p>
                <form onSubmit={onVerifyOtp} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">6-digit code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(next);
                        if (next.length === 6) {
                          setTimeout(() => onVerifyOtp(), 50);
                        }
                      }}
                      required
                      autoFocus
                      className="text-center text-lg tracking-[0.5em] font-mono h-12 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95"
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Verify &amp; Sign in
                  </Button>
                </form>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); }}
                    className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-primary"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resending}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          <ShieldCheck className="h-3 w-3" /> Passwordless, end-to-end encrypted
        </motion.div>
      </motion.div>
    </div>
  );
}
