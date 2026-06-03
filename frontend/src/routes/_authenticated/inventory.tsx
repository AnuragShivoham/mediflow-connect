import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Boxes, 
  Loader2, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Edit2 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — MedFlow" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Use a unique key 'inventory-list' to avoid collision with 'inventory-mr-lookup'
  const { data: items, isLoading, error } = useQuery({
    queryKey: ["inventory-list", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", profile!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  if (error) {
    toast.error("Failed to load inventory: " + error.message);
  }

  const filteredItems = items?.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.batch_number?.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Inventory</h1>
          <p className="text-sm text-muted-foreground">Track stock levels, batches and expiry alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Add item</Button>
            </DialogTrigger>
            <InventoryForm onSuccess={() => setIsAddOpen(false)} />
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems && filteredItems.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
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
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.name}
                    {item.quantity <= item.low_stock_threshold && (
                      <Badge variant="destructive" className="ml-2 scale-90">Low Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.batch_number || "-"}</TableCell>
                  <TableCell>
                    <span className={item.quantity <= item.low_stock_threshold ? "text-destructive font-semibold" : ""}>
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(item.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-10 shadow-soft">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
              <Boxes className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">No inventory found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "No items match your search." : "Add your first item to start tracking quantity, batch numbers and expiry dates."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      user_id: profile!.id,
      name: formData.get("name") as string,
      quantity: parseInt(formData.get("quantity") as string),
      batch_number: formData.get("batch") as string || null,
      expiry_date: formData.get("expiry") as string || null,
      low_stock_threshold: parseInt(formData.get("threshold") as string) || 10,
    };

    const { error } = await supabase.from("inventory_items").insert(payload);
    
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Item added successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      onSuccess();
    }
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Enter the details of the medical product or stock item.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" name="name" placeholder="e.g. Paracetamol 500mg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" defaultValue="0" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="batch">Batch Number</Label>
              <Input id="batch" name="batch" placeholder="BH-12345" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" name="expiry" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="threshold">Low Stock Alert at</Label>
              <Input id="threshold" name="threshold" type="number" defaultValue="10" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Item
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

