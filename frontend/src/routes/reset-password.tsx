import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Update Password — MedFlow" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("recovery_email");
    if (cached) setEmail(cached);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }

    setLoading(true);

    // Exchange the OTP code for a session (works even if Gmail prefetched the link,
    // because the code in the email body is independent of the link's token).
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });

    if (otpError) {
      setLoading(false);
      toast.error(otpError.message || "Invalid or expired code");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    sessionStorage.removeItem("recovery_email");
    toast.success("Password updated successfully");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">MedFlow</span>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Create new password</h1>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code from your email.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">6-digit recovery code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              className="rounded-xl h-11 tracking-widest text-center text-lg"
              placeholder="••••••"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="rounded-xl h-11"
            />
          </div>

          <Button type="submit" className="w-full mt-2 rounded-xl h-12" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update password
          </Button>

          <Link to="/forgot-password" className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-3 w-3" />
            Request a new code
          </Link>
        </form>
      </div>
    </div>
  );
}
