import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Plus, Loader2, Truck, XCircle, User, Info,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/routes/_authenticated";
import { GlassCard } from "@/components/glass-card";
import { FadeIn } from "@/components/fade-in";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders — MedFlow" }] }),
  component: OrdersPage,
});

const statuses = ["Pending", "Accepted", "Packed", "Out for Delivery", "Delivered", "Rejected"] as const;
type OrderStatus = (typeof statuses)[number];

function OrdersPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { unreadOrderIds, clearUnreadOrder } = useNotifications();
  const isMR = profile?.role === "mr";
  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", profile?.id],
    queryFn: () => api.get<any[]>("/orders"),
    enabled: !!profile?.id,
  });

  const filteredOrders = useMemo(() => {
    if (filter === "All") return orders;
    return orders?.filter((o) => o.status.toLowerCase() === filter.toLowerCase());
  }, [orders, filter]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch("/orders/" + id + "/status", {
        status: status.toLowerCase().replace(/ /g, "_"),
      });
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      if (data.status.toLowerCase() === "delivered") queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
      if (data.status !== "Rejected") toast.success(`Order status updated to ${data.status}`);
    },
    onError: (error) => toast.error((error as Error).message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              <span className="gradient-text">Orders</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Track and fulfill medical requests in real-time.</p>
          </div>
          {!isMR && (
            <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95">
                  <Plus className="mr-2 h-5 w-5" /> New Order
                </Button>
              </DialogTrigger>
              <NewOrderForm onSuccess={() => setIsNewOrderOpen(false)} />
            </Dialog>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button variant={filter === "All" ? "default" : "outline"} size="sm" onClick={() => setFilter("All")} className={cn("rounded-full px-5", filter === "All" && "bg-gradient-to-r from-primary to-violet-500 shadow-md")}>
            All
          </Button>
          {statuses.map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className={cn("rounded-full px-5", filter === s && "bg-gradient-to-r from-primary to-violet-500 shadow-md")}
            >
              {s}
            </Button>
          ))}
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence>
            {filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                layout
              >
                <OrderCard
                  order={order}
                  isMR={isMR}
                  hasUnread={unreadOrderIds.includes(order.id)}
                  onSeen={() => clearUnreadOrder(order.id)}
                  onStatusUpdate={(status: string) => updateStatusMutation.mutate({ id: order.id, status })}
                  isUpdating={updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <FadeIn delay={0.1}>
          <GlassCard delay={0} className="p-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">No matching orders</h2>
            <p className="mt-1 text-sm text-muted-foreground">Orders matching your filters will appear here.</p>
          </GlassCard>
        </FadeIn>
      )}
    </div>
  );
}

function OrderCard({ order, isMR, hasUnread, onSeen, onStatusUpdate, isUpdating }: any) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    accepted: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
    packed: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
    out_for_delivery: "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    rejected: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
  };

  const statusLabel = order.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

  return (
    <motion.div
      onMouseEnter={() => hasUnread && onSeen()}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "group relative rounded-3xl border p-5 transition-all",
        hasUnread
          ? "border-rose-300 bg-gradient-to-br from-rose-50/60 to-white/60 dark:from-rose-950/30 dark:to-slate-900/60 shadow-xl shadow-rose-100/40 dark:shadow-rose-950/30 ring-1 ring-rose-100 dark:ring-rose-900"
          : "border-white/60 dark:border-white/10 glass shadow-soft",
      )}
    >
      {hasUnread && (
        <div className="absolute -right-2 -top-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-black text-white shadow-xl animate-bounce tracking-widest">
          NEW
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1.5 text-left">
          <Badge className={cn("px-2 py-0.5 font-bold border rounded-full", statusColors[order.status as keyof typeof statusColors])}>{statusLabel}</Badge>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 grid place-items-center text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-none">{isMR ? order.doctor.full_name : order.mr.full_name}</h3>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight mt-1">{isMR ? "Practitioner" : "Med Rep"}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</div>
          <div className="text-[10px] font-bold text-muted-foreground">{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-left">
        <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 space-y-2 backdrop-blur">
          {order.order_items.map((oi: any) => (
            <div key={oi.id} className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">{oi.item.name}</span>
              <span className="text-muted-foreground font-medium">x{oi.quantity}</span>
            </div>
          ))}
        </div>
        {order.special_instructions && (
          <div className="flex gap-2 p-2 bg-white/30 dark:bg-white/5 rounded-xl border border-white/40 dark:border-white/10">
            <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 dark:text-slate-300 italic">"{order.special_instructions}"</p>
          </div>
        )}
      </div>

      {isMR && order.status !== "delivered" && order.status !== "rejected" && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/60 dark:border-white/10 pt-4">
          {order.status === "pending" && <Button size="sm" className="rounded-xl px-4 shadow-md" onClick={() => onStatusUpdate("Accepted")} disabled={isUpdating}>Accept</Button>}
          {order.status === "accepted" && <Button size="sm" className="rounded-xl px-4 shadow-md" onClick={() => onStatusUpdate("Packed")} disabled={isUpdating}>Mark Packed</Button>}
          {order.status === "packed" && <Button size="sm" className="rounded-xl px-4 shadow-md" onClick={() => onStatusUpdate("Out for Delivery")} disabled={isUpdating}>Out for Delivery</Button>}
          {order.status === "out_for_delivery" && (
            <Button size="sm" onClick={() => onStatusUpdate("Delivered")} disabled={isUpdating} className="rounded-xl px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md">
              <Truck className="mr-2 h-4 w-4" /> Mark Delivered
            </Button>
          )}
          {order.status === "pending" && (
            <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl" onClick={() => onStatusUpdate("Rejected")} disabled={isUpdating}>Reject</Button>
          )}
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}
    </motion.div>
  );
}

function NewOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedMR, setSelectedMR] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ id: string; quantity: number; name: string }[]>([]);

  const { data: contacts } = useQuery({
    queryKey: ["contacts", profile?.id],
    queryFn: () => api.get<any[]>("/contacts"),
    enabled: !!profile?.id,
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ["inventory-lookup", selectedMR],
    queryFn: () => api.get<any[]>("/inventory/mr/" + selectedMR),
    enabled: !!selectedMR,
  });

  const addItem = (itemId: string) => {
    if (!itemId || itemId === "placeholder") return;
    const item = items?.find((i) => i.id === itemId);
    if (!item || selectedItems.find((si) => si.id === itemId)) return;
    setSelectedItems([...selectedItems, { id: item.id, name: item.name, quantity: 1 }]);
  };

  const removeItem = (id: string) => setSelectedItems(selectedItems.filter((si) => si.id !== id));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMR || selectedItems.length === 0) return toast.error("Select MR and items");

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await api.post("/orders", {
        mr_id: selectedMR,
        items: selectedItems.map((si) => ({ inventory_item_id: si.id, quantity: si.quantity })),
        preferred_delivery_date: (formData.get("date") as string) || null,
        special_instructions: (formData.get("instructions") as string) || null,
      });
      toast.success("Order placed");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Medical Order</DialogTitle>
          <DialogDescription>Request supplies from your registered representatives.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Choose Medical Representative</Label>
            <Select onValueChange={(val) => { setSelectedMR(val); setSelectedItems([]); }}>
              <SelectTrigger className="rounded-2xl h-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10"><SelectValue placeholder="Select an MR..." /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                {contacts?.map((c: any) => (
                  <SelectItem key={c.contact.id} value={c.contact.id}>{c.contact.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMR && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Products</Label>
                <Select onValueChange={addItem}>
                  <SelectTrigger className="rounded-2xl h-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10"><SelectValue placeholder={loadingItems ? "Fetching stock..." : "Select medicine..."} /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {items?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name} ({item.quantity} in stock)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence>
                {selectedItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {selectedItems.map((si) => (
                      <motion.div
                        key={si.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="flex items-center gap-3 bg-white/40 dark:bg-white/5 p-3 rounded-2xl border border-white/60 dark:border-white/10 backdrop-blur"
                      >
                        <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">{si.name}</span>
                        <Input type="number" className="w-20 rounded-xl bg-white/60 dark:bg-slate-900/60" value={si.quantity} onChange={(e) => setSelectedItems(selectedItems.map((i) => (i.id === si.id ? { ...i, quantity: parseInt(e.target.value) || 1 } : i)))} />
                        <Button type="button" variant="ghost" size="icon" className="text-rose-500" onClick={() => removeItem(si.id)}>
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Preferred Delivery Date</Label>
                <Input name="date" type="date" className="rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Additional Instructions</Label>
                <Textarea name="instructions" placeholder="Any delivery notes..." className="rounded-2xl border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95" disabled={loading || !selectedMR || selectedItems.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Order
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
