import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Mail, Phone, ShieldCheck, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/glass-card";
import { FadeIn } from "@/components/fade-in";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — MedFlow" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile: authProfile, setProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (authProfile) {
      setFormData({
        full_name: authProfile.full_name || "",
        phone: authProfile.phone || "",
      });
    }
  }, [authProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (newData: { full_name: string; phone: string }) => {
      return api.patch<{ id: string; email: string; full_name: string; phone: string; role: string }>(
        "/profile",
        newData,
      );
    },
    onSuccess: (updated) => {
      if (authProfile) setProfile({ ...authProfile, full_name: updated.full_name, phone: updated.phone });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <FadeIn>
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            <span className="gradient-text">Account Settings</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your personal information and preferences.</p>
        </div>
      </FadeIn>

      <GlassCard delay={0.05} className="overflow-hidden !p-0">
        <CardHeader className="border-b border-white/40 dark:border-white/10 bg-gradient-to-br from-primary/5 to-violet-500/5 p-6">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-4"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
              {authProfile?.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <CardTitle className="font-display text-xl">
                {authProfile?.full_name || authProfile?.email?.split("@")[0] || "User"}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize bg-white/60 dark:bg-white/5 backdrop-blur">
                  {authProfile?.role === "mr" ? "Medical Representative" : "Doctor"}
                </Badge>
                {authProfile?.full_name && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified Account
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  placeholder="Set your name..."
                  value={formData.full_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                  disabled={!isEditing}
                  className="h-11 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10 transition-all focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className="h-11 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10 transition-all focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2 opacity-70">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input value={authProfile?.email} disabled className="h-11 rounded-xl bg-muted/40 dark:bg-slate-800/60 cursor-not-allowed" />
              <p className="text-[10px] text-muted-foreground italic">Email changes require identity verification.</p>
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-3 pt-4 border-t border-white/40 dark:border-white/10"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: authProfile?.full_name || "",
                      phone: authProfile?.phone || "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/30" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </motion.div>
            )}
          </form>
        </CardContent>
        {!isEditing && (
          <CardFooter className="bg-white/40 dark:bg-white/5 border-t border-white/40 dark:border-white/10 justify-end backdrop-blur">
            <Button variant="outline" className="rounded-xl border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/15 hover:text-primary transition-all" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </CardFooter>
        )}
      </GlassCard>

      <FadeIn delay={0.2}>
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-500/30 p-4 flex gap-3 text-amber-900 dark:text-amber-200 backdrop-blur">
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Security Note</p>
            <p className="mt-0.5 text-amber-800/80 dark:text-amber-300/80">
              MedFlow uses end-to-end encrypted storage for your order history. Ensure your phone number is correct to receive delivery status updates.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
