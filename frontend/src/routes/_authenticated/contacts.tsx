import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserPlus, Users, Trash2, UserCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/glass-card";
import { FadeIn } from "@/components/fade-in";

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

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", profile?.id],
    queryFn: () => api.get<any[]>("/contacts"),
    enabled: !!profile?.id,
  });

  const search = async () => {
    setSearchResult(null);
    setNotFound(false);
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { toast.error("Enter a valid phone number"); return; }
    setSearching(true);
    try {
      const result = await api.post<{ id: string; full_name: string; phone: string; role: string } | null>(
        "/contacts/search",
        { phone: parsed.data, role: wantRole },
      );
      if (!result) { setNotFound(true); return; }
      setSearchResult(result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await api.post("/contacts", { contact_id: contactId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added successfully");
      setSearchResult(null);
      setPhone("");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete("/contacts/" + id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact removed");
    },
    onError: (error: any) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            <span className="gradient-text">Contacts</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect with {wantLabel}s to start managing orders and inventory tracking.
          </p>
        </div>
      </FadeIn>

      <GlassCard delay={0.05} className="p-6 md:p-8">
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
              className="h-12 rounded-2xl border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur"
            />
          </div>
          <Button onClick={search} disabled={searching} className="h-12 rounded-2xl px-6 shadow-lg shadow-primary/20">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2">Search</span>
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {searchResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 dark:bg-primary/15 p-4 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-sm font-semibold text-primary-foreground shadow-lg">
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
              <Button size="sm" onClick={() => addMutation.mutate(searchResult.id)} disabled={addMutation.isPending} className="rounded-xl shadow-md">
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span className="ml-2">Connect</span>
              </Button>
            </motion.div>
          )}

          {notFound && (
            <motion.p
              key="notfound"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 rounded-2xl border border-dashed border-border/60 bg-white/40 dark:bg-white/5 p-4 text-sm text-muted-foreground backdrop-blur"
            >
              No {wantLabel} found with that phone number. Ask them to sign up on MedFlow first.
            </motion.p>
          )}
        </AnimatePresence>
      </GlassCard>

      <div className="space-y-4">
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your {wantLabel}s
            </h2>
            <Badge variant="secondary" className="rounded-full">{contacts?.length || 0} total</Badge>
          </div>
        </FadeIn>

        {contactsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="grid gap-3">
            {contacts.map((c: any, idx: number) => {
              if (!c.contact) return null;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                >
                  <GlassCard delay={0} className="flex items-center justify-between p-4 hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)] transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary/10 to-violet-500/10 text-sm font-semibold text-primary border border-primary/20 dark:border-primary/30">
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
                      <Badge variant="outline" className="mr-2 hidden sm:inline-flex rounded-full">
                        <UserCheck className="mr-1 h-3 w-3" /> Connected
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive dark:hover:text-rose-400" onClick={() => deleteMutation.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <FadeIn delay={0.15}>
            <GlassCard className="p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display font-semibold">No contacts yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search for an {wantLabel} by phone number to start connecting.
              </p>
            </GlassCard>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
