import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Activity, Boxes, MessageSquare, ShieldCheck, Stethoscope, Truck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedFlow — Healthcare workflow for Doctors & M.R.s" },
      { name: "description", content: "A secure platform for Doctors and Medical Representatives to manage orders, inventory, deliveries and chat." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">MedFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Secure healthcare workflow
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Orders, inventory and delivery — between Doctors and M.R.s.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              MedFlow gives medical representatives and doctors one calm place to coordinate stock,
              orders and deliveries — with built-in chat and role-based access.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/signup">Create account</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Boxes, label: "Inventory", desc: "Stock & expiry alerts" },
              { icon: Truck, label: "Deliveries", desc: "Status & timeline" },
              { icon: Stethoscope, label: "Doctors & M.R.s", desc: "Verified contacts" },
              { icon: MessageSquare, label: "Chat", desc: "Linked to orders" },
            ].map((f) => (
              <div key={f.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-display text-sm font-semibold">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
