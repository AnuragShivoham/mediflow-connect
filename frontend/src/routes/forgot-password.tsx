import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recover Access — MedFlow" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Do NOT pass redirectTo — we use the 6-digit OTP code from the email
    // instead of the link, which avoids Gmail's link-prefetching that
    // consumes single-use recovery tokens before the user clicks.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    sessionStorage.setItem("recovery_email", email);
    toast.success("Recovery code sent to your email.");
    setTimeout(() => navigate({ to: "/reset-password" }), 800);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-md z-10 glass-card p-10 medical-shadow rounded-3xl animate-in fade-in zoom-in duration-500">
        {!sent ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-4">
                <KeyRound className="h-8 w-8" />
              </div>
              <h1 className="font-display text-2xl font-bold">Recover Access</h1>
              <p className="text-sm text-muted-foreground mt-2 text-center">Enter your registered email to receive a 6-digit recovery code.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-border/50 bg-background/50 focus:ring-primary/20 transition-all"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Recovery Code"}
              </Button>

              <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </Link>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="h-20 w-20 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center">
              <Activity className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Code Sent</h2>
              <p className="text-sm text-muted-foreground">A 6-digit recovery code was sent to <strong>{email}</strong>. Redirecting you to enter it…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
