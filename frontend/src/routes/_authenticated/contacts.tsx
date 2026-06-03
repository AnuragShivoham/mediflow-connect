import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserPlus, Users, Trash2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Contacts — MedFlow" }] }),
  component: ContactsPage,
});

const phoneSchema = z.string().trim().min(7).max(20).regex(/^[+0-9\s\-()]+$/, "Invalid phone");

function ContactsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isMR = profile?.role === "mr";
  const wantRole: "doctor" | "mr" = isMR ? "doctor" : "mr";
  const wantLabel = isMR ? "Doctor" : "M.R.";

  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ id: string; full_name: string; phone: string; role: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Fetch current contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          id,
          contact:profiles!contact_id(id, full_name, phone, role)
        `)
        .eq("user_id", profile!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const search = async () => {
    setSearchResult(null); setNotFound(false);
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { toast.error("Enter a valid phone number"); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("phone", parsed.data)
      .eq("role", wantRole)
      .maybeSingle();
    setSearching(false);
    if (error) { toast.error(error.message); return; }
    if (!data) { setNotFound(true); return; }
    setSearchResult(data);
  };

  const addMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("contacts")
        .insert({ user_id: profile!.id, contact_id: contactId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added successfully");
      setSearchResult(null);
      setPhone("");
    },
    onError: (error: any) => {
      if (error.code === "23505") toast.error("Contact already exists");
      else toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact removed");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Connect with {wantLabel}s to start managing orders and inventory tracking.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="phone">Search {wantLabel} by phone</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <Button onClick={search} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        {searchResult && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {searchResult.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  {searchResult.full_name || searchResult.phone || "User"}
                  <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize whitespace-nowrap">
                    {searchResult.role === "mr" ? "M.R." : "Doctor"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{searchResult.phone}</div>
              </div>
            </div>
            <Button size="sm" onClick={() => addMutation.mutate(searchResult.id)} disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Connect
            </Button>
          </div>
        )}

        {notFound && (
          <p className="mt-5 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
            No {wantLabel} found with that phone number. Ask them to sign up on MedFlow first.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Your {wantLabel}s
          </h2>
          <Badge variant="secondary">{contacts?.length || 0} total</Badge>
        </div>

        {contactsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="grid gap-3">
            {contacts.map((c: any) => {
              if (!c.contact) return null;
              return (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
                      {(c.contact.full_name?.[0] || c.contact.phone?.[0])?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {c.contact.full_name || c.contact.phone || "User"}
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {c.contact.role === "mr" ? "M.R." : "Doctor"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{c.contact.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="mr-2 hidden sm:inline-flex">
                      <UserCheck className="mr-1 h-3 w-3" /> Connected
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-10 shadow-soft">
            <div className="mx-auto max-w-md text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-display font-semibold">No contacts yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search for an {wantLabel} by phone number to start connecting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

