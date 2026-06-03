import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Truck,
  Loader2,
  TrendingUp,
  Package,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { GlassCard } from "@/components/glass-card";
import { FadeIn } from "@/components/fade-in";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MedFlow" }] }),
  component: Dashboard,
});

type DashboardStats = {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockCount: number;
  recentOrders: any[];
  upcomingDeliveries: any[];
  inventoryAlerts: any[];
};

const STAT_VARIANTS = {
  primary: "from-primary/15 to-violet-500/15 text-primary",
  success: "from-emerald-400/20 to-cyan-400/20 text-emerald-600 dark:text-emerald-400",
  warning: "from-amber-400/20 to-orange-400/20 text-amber-600 dark:text-amber-400",
  destructive: "from-rose-400/20 to-pink-400/20 text-rose-600 dark:text-rose-400",
};

function Stat({
  label,
  value,
  hint,
  Icon,
  tone = "primary",
  isLoading,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "warning" | "destructive";
  isLoading?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <GlassCard delay={0} className="p-5 h-full">
        <div className="flex items-center justify-between">
          <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${STAT_VARIANTS[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{hint}</span>
        </div>
        <div className="mt-4 font-display text-3xl font-semibold">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </GlassCard>
    </motion.div>
  );
}

function Dashboard() {
  const { profile } = useAuth();
  const isMR = profile?.role === "mr";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", profile?.id],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats"),
    enabled: !!profile?.id,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              <span className="gradient-text">Welcome back{firstName ? `, ${firstName}` : ""}</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isMR
                ? "Manage your inventory, orders and deliveries."
                : "Place orders and track deliveries from your M.R.s."}
            </p>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-primary to-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:opacity-95 transition"
          >
            New order <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeIn>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total orders" value={stats?.totalOrders ?? 0} hint="all time" Icon={ClipboardList} isLoading={isLoading} delay={0.05} />
        <Stat label="Pending" value={stats?.pendingOrders ?? 0} hint="awaiting action" Icon={CalendarClock} tone="warning" isLoading={isLoading} delay={0.1} />
        <Stat label="Delivered" value={stats?.deliveredOrders ?? 0} hint="completed" Icon={CheckCircle2} tone="success" isLoading={isLoading} delay={0.15} />
        <Stat label="Low stock" value={stats?.lowStockCount ?? 0} hint="needs reorder" Icon={AlertTriangle} tone="destructive" isLoading={isLoading} delay={0.2} />
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <FadeIn delay={0.25} className="md:col-span-4">
          <GlassCard delay={0} className="p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Recent orders</h2>
              </div>
              <Link to="/orders" className="text-sm font-bold text-primary hover:underline">View all</Link>
            </div>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="mt-4 space-y-2">
                {stats.recentOrders.slice(0, 5).map((o: any, idx: number) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-center justify-between rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3 backdrop-blur"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Order #{o.id.slice(0, 6)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {isMR ? `Dr. ${o.doctor_name}` : `M.R. ${o.mr_name}`} · {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{o.status}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-white/60 dark:border-white/10 bg-white/30 dark:bg-white/5 py-12 text-center backdrop-blur">
                <Boxes className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No orders yet</p>
                <p className="text-xs text-muted-foreground">Your recent order activity will appear here.</p>
              </div>
            )}
          </GlassCard>
        </FadeIn>

        <div className="md:col-span-2 space-y-4">
          <FadeIn delay={0.3}>
            <GlassCard delay={0} className="p-6 h-full">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">Delivery status</h3>
              </div>
              {stats?.upcomingDeliveries && stats.upcomingDeliveries.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {stats.upcomingDeliveries.slice(0, 3).map((d: any) => (
                    <div key={d.id} className="rounded-xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2 text-xs">
                      <div className="font-bold">{d.id.slice(0, 6)}</div>
                      <div className="text-muted-foreground text-[10px]">Out for delivery</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No deliveries in progress.</p>
              )}
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.35}>
            <GlassCard delay={0} className="p-6 h-full">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">Recent chats</h3>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Conversations with your contacts will appear here.</p>
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
