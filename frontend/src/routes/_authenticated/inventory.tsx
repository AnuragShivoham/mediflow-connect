import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Boxes, Loader2, MoreHorizontal, Plus, Search, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/glass-card";
import { FadeIn } from "@/components/fade-in";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — MedFlow" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["inventory-list", profile?.id],
    queryFn: () => api.get<any[]>("/inventory"),
    enabled: !!profile?.id,
  });

  if (error) {
    toast.error("Failed to load inventory: " + (error as Error).message);
  }

  const filteredItems = items?.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.batch_number?.toLowerCase().includes(search.toLowerCase()),
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete("/inventory/" + id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item deleted");
    },
    onError: (error) => toast.error((error as Error).message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              <span className="gradient-text">Inventory</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Track stock levels, batches and expiry alerts.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-9 h-11 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-2xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500 hover:opacity-95">
                  <Plus className="h-4 w-4" /> Add item
                </Button>
              </DialogTrigger>
              <InventoryForm onSuccess={() => setIsAddOpen(false)} />
            </Dialog>
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems && filteredItems.length > 0 ? (
        <FadeIn delay={0.1}>
          <GlassCard delay={0} className="overflow-hidden !p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredItems.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="border-b border-white/40 dark:border-white/10 last:border-0 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/10 to-violet-500/10 text-primary">
                            <Boxes className="h-4 w-4" />
                          </div>
                          {item.name}
                          {item.quantity <= item.low_stock_threshold && (
                            <Badge variant="destructive" className="ml-2 scale-90 rounded-full">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.batch_number || "-"}</TableCell>
                      <TableCell>
                          <span className={item.quantity <= item.low_stock_threshold ? "text-rose-600 dark:text-rose-400 font-bold" : "font-semibold"}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl">
                            <DropdownMenuItem onClick={() => setEditing(item)} className="rounded-xl">
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-destructive rounded-xl">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </GlassCard>
        </FadeIn>
      ) : (
        <FadeIn delay={0.15}>
          <GlassCard delay={0} className="p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10">
              <Boxes className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">No inventory found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "No items match your search." : "Add your first item to start tracking quantity, batch numbers and expiry dates."}
            </p>
          </GlassCard>
        </FadeIn>
      )}

      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <InventoryForm
            initialData={editing}
            onSuccess={() => setEditing(null)}
          />
        </Dialog>
      )}
    </div>
  );
}

function InventoryForm({ onSuccess, initialData }: { onSuccess: () => void; initialData?: any }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get("name") as string,
      quantity: parseInt(formData.get("quantity") as string),
      batch_number: (formData.get("batch") as string) || null,
      expiry_date: (formData.get("expiry") as string) || null,
      low_stock_threshold: parseInt(formData.get("threshold") as string) || 10,
    };

    try {
      if (isEdit) {
        await api.patch("/inventory/" + initialData.id, payload);
        toast.success("Item updated");
      } else {
        await api.post("/inventory", payload);
        toast.success("Item added successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="rounded-3xl">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details of this medical product or stock item." : "Enter the details of the medical product or stock item."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" name="name" defaultValue={initialData?.name} placeholder="e.g. Paracetamol 500mg" required className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" defaultValue={initialData?.quantity ?? 0} required className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="batch">Batch Number</Label>
              <Input id="batch" name="batch" defaultValue={initialData?.batch_number ?? ""} placeholder="BH-12345" className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" name="expiry" type="date" defaultValue={initialData?.expiry_date?.slice(0, 10) ?? ""} className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="threshold">Low Stock Alert at</Label>
              <Input id="threshold" name="threshold" type="number" defaultValue={initialData?.low_stock_threshold ?? 10} className="rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="rounded-xl shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-violet-500" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Save Item"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
