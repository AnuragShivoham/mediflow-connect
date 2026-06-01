import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ClipboardList, Plus, Loader2, Truck, Package, CheckCircle2, 
  XCircle, Clock, FileText, User, ChevronRight, Info 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/routes/_authenticated";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, doctor:profiles!doctor_id(full_name, phone), mr:profiles!mr_id(full_name, phone), order_items(id, quantity, item:inventory_items(name))`)
        .or(`doctor_id.eq.${profile!.id},mr_id.eq.${profile!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const filteredOrders = useMemo(() => {
    if (filter === "All") return orders;
    return orders?.filter(o => o.status.toLowerCase() === filter.toLowerCase());
  }, [orders, filter]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ 
          status: status.toLowerCase().replace(/ /g, "_") as any,
          delivery_timestamp: status.toLowerCase() === "delivered" ? new Date().toISOString() : undefined
      }).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (data.status.toLowerCase() === "delivered") queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
      if (data.status !== "Rejected") toast.success(`Order status updated to ${data.status}`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl text-slate-800">Orders</h1>
          <p className="text-sm font-medium text-slate-400">Track and fulfill medical requests in real-time.</p>
        </div>
        {!isMR && (
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-5 w-5" /> New Order
              </Button>
            </DialogTrigger>
            <NewOrderForm onSuccess={() => setIsNewOrderOpen(false)} />
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button variant={filter === "All" ? "default" : "outline"} size="sm" onClick={() => setFilter("All")} className="rounded-full px-5">All</Button>
        {statuses.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="rounded-full px-5">{s}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-200" /></div>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              isMR={isMR} 
              hasUnread={unreadOrderIds.includes(order.id)}
              onSeen={() => clearUnreadOrder(order.id)}
              onStatusUpdate={(status: string) => updateStatusMutation.mutate({ id: order.id, status })}
              isUpdating={updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-200" />
          <h2 className="mt-4 font-bold text-slate-800">No matching orders</h2>
          <p className="text-sm text-slate-400 mt-1">Orders matching your filters will appear here.</p>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, isMR, hasUnread, onSeen, onStatusUpdate, isUpdating }: any) {
  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    accepted: "bg-blue-50 text-blue-700 border-blue-100",
    packed: "bg-indigo-50 text-indigo-700 border-indigo-100",
    out_for_delivery: "bg-purple-50 text-purple-700 border-purple-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const statusLabel = order.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

  return (
    <div 
      onMouseEnter={() => hasUnread && onSeen()}
      className={cn(
        "group relative rounded-3xl border p-5 transition-all",
        hasUnread ? "border-rose-300 bg-rose-50/20 shadow-lg shadow-rose-100 ring-1 ring-rose-100 animate-in zoom-in-95" : "border-slate-100 bg-white hover:border-primary/20 shadow-sm"
      )}
    >
      {hasUnread && (
        <div className="absolute -right-2 -top-2 px-3 py-1 rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xl animate-bounce tracking-widest">
          NEW
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1.5 text-left">
          <Badge className={cn("px-2 py-0.5 font-bold border", statusColors[order.status as keyof typeof statusColors])}>{statusLabel}</Badge>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
               <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 leading-none">{isMR ? order.doctor.full_name : order.mr.full_name}</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight mt-1">{isMR ? "Practitioner" : "Med Rep"}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</div>
          <div className="text-[10px] font-bold text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-left">
        <div className="rounded-2xl bg-slate-50/50 border border-slate-100 p-3 space-y-2">
          {order.order_items.map((oi: any) => (
            <div key={oi.id} className="flex justify-between text-xs">
              <span className="font-bold text-slate-600">{oi.item.name}</span>
              <span className="text-slate-400 font-medium">x{oi.quantity}</span>
            </div>
          ))}
        </div>
        {order.special_instructions && (
          <div className="flex gap-2 p-2 bg-slate-50 rounded-xl">
             <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
             <p className="text-[10px] text-slate-500 italic">"{order.special_instructions}"</p>
          </div>
        )}
      </div>

      {isMR && order.status !== "delivered" && order.status !== "rejected" && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {order.status === "pending" && <Button size="sm" className="rounded-xl px-4" onClick={() => onStatusUpdate("Accepted")} disabled={isUpdating}>Accept</Button>}
          {order.status === "accepted" && <Button size="sm" className="rounded-xl px-4" onClick={() => onStatusUpdate("Packed")} disabled={isUpdating}>Mark Packed</Button>}
          {order.status === "packed" && <Button size="sm" className="rounded-xl px-4" onClick={() => onStatusUpdate("Out for Delivery")} disabled={isUpdating}>Out for Delivery</Button>}
          {order.status === "out_for_delivery" && (
            <Button size="sm" onClick={() => onStatusUpdate("Delivered")} disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4">
              <Truck className="mr-2 h-4 w-4" /> Mark Delivered
            </Button>
          )}
          {order.status === "pending" && (
             <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => onStatusUpdate("Rejected")} disabled={isUpdating}>Reject</Button>
          )}
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-slate-300" />}
        </div>
      )}
    </div>
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
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select(`contact:profiles!contact_id(id, full_name, phone)`).eq("user_id", profile!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ["inventory-lookup", selectedMR],
    queryFn: async () => {
      if (!selectedMR) return [];
      const { data, error } = await supabase.from("inventory_items").select("id, name, quantity, batch_number").eq("user_id", selectedMR);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMR,
  });

  const addItem = (itemId: string) => {
    if (!itemId || itemId === "placeholder") return;
    const item = items?.find(i => i.id === itemId);
    if (!item || selectedItems.find(si => si.id === itemId)) return;
    setSelectedItems([...selectedItems, { id: item.id, name: item.name, quantity: 1 }]);
  };

  const removeItem = (id: string) => setSelectedItems(selectedItems.filter(si => si.id !== id));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMR || selectedItems.length === 0) return toast.error("Select MR and items");
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { data: order, error: orderError } = await supabase.from("orders").insert({
        doctor_id: profile!.id,
        mr_id: selectedMR,
        preferred_delivery_date: formData.get("date") as string || null,
        special_instructions: formData.get("instructions") as string || null,
    }).select().single();

    if (orderError) {
      toast.error(orderError.message);
      setLoading(false);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(selectedItems.map(si => ({
        order_id: order.id,
        inventory_item_id: si.id,
        quantity: si.quantity
    })));

    setLoading(false);
    if (itemsError) toast.error(itemsError.message);
    else {
      toast.success("Order placed");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onSuccess();
    }
  };

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Medical Order</DialogTitle>
          <DialogDescription>Request supplies from your registered representatives.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Choose Medical Representative</Label>
            <Select onValueChange={(val) => { setSelectedMR(val); setSelectedItems([]); }}>
              <SelectTrigger className="rounded-2xl h-12"><SelectValue placeholder="Select an MR..." /></SelectTrigger>
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
                  <SelectTrigger className="rounded-2xl h-12"><SelectValue placeholder={loadingItems ? "Fetching stock..." : "Select medicine..."} /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {items?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name} ({item.quantity} in stock)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItems.length > 0 && (
                <div className="space-y-2">
                  {selectedItems.map((si) => (
                    <div key={si.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="flex-1 text-sm font-bold text-slate-700">{si.name}</span>
                      <Input type="number" className="w-20 rounded-xl" value={si.quantity} onChange={(e) => setSelectedItems(selectedItems.map(i => i.id === si.id ? {...i, quantity: parseInt(e.target.value)} : i))} />
                      <Button type="button" variant="ghost" size="icon" className="text-rose-500" onClick={() => removeItem(si.id)}><XCircle className="h-5 w-5" /></Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Additional Instructions</Label>
                <Textarea name="instructions" placeholder="Any delivery notes..." className="rounded-2xl border-slate-100" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20" disabled={loading || !selectedMR || selectedItems.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Order
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
