import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Boxes, 
  CalendarClock, 
  CheckCircle2, 
  ClipboardList, 
  MessageSquare, 
  Truck,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

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

function Stat({ label, value, hint, Icon, tone = "primary", isLoading }: {
  label: string; value: string | number; hint?: string; Icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "warning" | "destructive";
  isLoading?: boolean;
}) {
  const toneClass = {
    primary: "bg-secondary text-primary",
    success: "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success-foreground)]",
    warning: "bg-[color-mix(in_oklab,var(--warning)_22%,transparent)] text-[var(--warning-foreground)]",
    destructive: "bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)] text-destructive",
  }[tone];
  
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="mt-4 font-display text-3xl font-semibold">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Dashboard() {
  const { profile } = useAuth();
  const isMR = profile?.role === "mr";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats"),
    enabled: !!profile?.id,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">
            Welcome back{firstName ? `, ${firstName}` : ""}
            <span className="ml-2 text-sm font-medium text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full align-middle">
              {isMR ? "Medical Representative" : "Doctor"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isMR ? "Manage your inventory, orders and deliveries." : "Place orders and track deliveries from your M.R.s."}
          </p>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-95"
        >
          New order <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total orders" value={stats?.totalOrders ?? 0} hint="all time" Icon={ClipboardList} isLoading={isLoading} />
        <Stat label="Pending" value={stats?.pendingOrders ?? 0} hint="awaiting action" Icon={CalendarClock} tone="warning" isLoading={isLoading} />
        <Stat label="Delivered" value={stats?.deliveredOrders ?? 0} hint="this month" Icon={CheckCircle2} tone="success" isLoading={isLoading} />
        <Stat label="Low stock" value={stats?.lowStockCount ?? 0} hint="needs reorder" Icon={AlertTriangle} tone="destructive" isLoading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="md:col-span-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link to="/orders" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-border py-12 text-center">
            <Boxes className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No orders yet</p>
            <p className="text-xs text-muted-foreground">Your recent order activity will appear here.</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Delivery status</h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">No deliveries in progress.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Recent chats</h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Conversations with your contacts will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

