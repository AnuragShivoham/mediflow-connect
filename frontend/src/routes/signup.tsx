import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Stethoscope, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — MedFlow" }] }),
  component: SignupPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20).regex(/^[+0-9\s\-()]+$/, "Phone has invalid characters"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["doctor", "mr"]),
});

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "", role: "doctor" as "doctor" | "mr" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          role: parsed.data.role,
        },
      },
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created. Check your email to verify, then sign in.");
    navigate({ to: "/login" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">MedFlow</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose your role to get a tailored dashboard.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: "doctor", label: "Doctor", Icon: Stethoscope },
              { v: "mr", label: "M.R.", Icon: Briefcase },
            ] as const).map(({ v, label, Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => update("role", v)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
                  form.role === v
                    ? "border-primary bg-secondary text-foreground shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <Icon className={cn("h-5 w-5", form.role === v ? "text-primary" : "text-muted-foreground")} />
                <div className="font-display text-sm font-semibold">{label}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" inputMode="tel" placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
