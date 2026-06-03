import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Activity, Boxes, MessageSquare, ShieldCheck, Stethoscope, Truck, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ParticleField } from "@/components/particle-field";
import { SmoothScroll } from "@/components/smooth-scroll";
import { GlassCard } from "@/components/glass-card";
import { ThemeToggle } from "@/components/theme-toggle";

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

  const features = [
    { icon: Boxes, label: "Inventory", desc: "Stock & expiry alerts" },
    { icon: Truck, label: "Deliveries", desc: "Status & timeline" },
    { icon: Stethoscope, label: "Doctors & M.R.s", desc: "Verified contacts" },
    { icon: MessageSquare, label: "Chat", desc: "Linked to orders" },
  ];

  return (
    <SmoothScroll>
      <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="pointer-events-none fixed inset-0 aurora opacity-60 dark:opacity-40" />
        <div className="pointer-events-none fixed inset-0">
          <ParticleField density={45} className="h-full w-full" />
        </div>

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 group">
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="rounded-xl"><Link to="/login">Sign in</Link></Button>
            <Button asChild className="rounded-xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-12">
          <section className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Secure healthcare workflow
              </div>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Orders, inventory and delivery — <span className="gradient-text">between Doctors and M.R.s.</span>
              </h1>
              <p className="mt-4 max-w-lg text-base text-muted-foreground">
                MedFlow gives medical representatives and doctors one calm place to coordinate stock,
                orders and deliveries — with built-in chat and role-based access.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-2xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95">
                  <Link to="/signup">Create account <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl backdrop-blur bg-white/40 dark:bg-white/10 border-white/60 dark:border-white/20">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                End-to-end encrypted · Real-time delivery tracking · Audit-grade logs
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon: Icon, label, desc }, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <GlassCard delay={0} className="p-5 h-full">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 font-display text-sm font-semibold">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </SmoothScroll>
  );
}
