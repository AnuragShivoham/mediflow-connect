import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MedFlow" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

type Step = "credentials" | "otp";

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const onSubmitCredentials = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      await api.post("/auth/login", parsed.data);
      setStep("otp");
      toast.success("Verification code sent to your email.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOtp = async (e: FormEvent) => {
    e.preventDefault();
    const token = code.trim();
    if (!/^\d{6}$/.test(token)) { toast.error("Enter the 6-digit code from your email."); return; }
    setSubmitting(true);
    try {
      const data = await api.post<{ access_token: string; profile: any }>("/auth/verify-otp", { email, token });
      api.setToken(data.access_token);
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
      await api.post("/auth/send-otp", { email });
      toast.success("A new code was sent.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">MedFlow</span>
        </Link>

        {step === "credentials" ? (
          <>
            <h1 className="font-display text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back. We'll email you a one-time code after you sign in.
            </p>
            <form onSubmit={onSubmitCredentials} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Continue
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">Enter verification code</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a 6-digit code to <strong>{email}</strong>. It expires in a few minutes.
            </p>
            <form onSubmit={onSubmitOtp} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className="text-center text-lg tracking-[0.5em] font-mono"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify &amp; Sign in
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-xs">
              <button type="button" onClick={() => { setStep("credentials"); setCode(""); }} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <button type="button" onClick={onResend} disabled={resending} className="font-medium text-primary hover:underline disabled:opacity-50">
                {resending ? "Sending…" : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
