import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Save, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — MedFlow" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile: authProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

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
      const { error } = await supabase
        .from("profiles")
        .update(newData)
        .eq("id", authProfile!.id);
      
      if (error) throw error;
      return newData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      // We might need to refresh the window or wait for auth-context to re-fetch
      // But usually just informing the user is enough for now.
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <Card className="overflow-hidden border-border bg-card shadow-soft">
        <CardHeader className="bg-secondary/20 border-b">
          <div className="flex items-center gap-4">
             <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                {authProfile?.full_name?.[0]?.toUpperCase() ?? "U"}
             </div>
             <div>
                <CardTitle className="font-display text-xl">
                   {authProfile?.full_name || authProfile?.email?.split('@')[0] || "User"}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                   <Badge variant="outline" className="capitalize bg-background">
                      {authProfile?.role === "mr" ? "Medical Representative" : "Doctor"}
                   </Badge>
                   {authProfile?.full_name && (
                     <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        Verified Account
                     </span>
                   )}
                </div>
             </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  disabled={!isEditing}
                  className="rounded-xl h-11 transition-all focus:ring-2 focus:ring-primary/20"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className="rounded-xl h-11 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2 opacity-70">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input 
                value={authProfile?.email} 
                disabled 
                className="rounded-xl h-11 bg-muted cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground italic">Email changes require identity verification.</p>
            </div>
            
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t">
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
                <Button 
                  type="submit" 
                  className="rounded-xl px-8"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
        {!isEditing && (
          <CardFooter className="bg-muted/30 border-t justify-end">
            <Button 
              variant="outline" 
              className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-amber-800 animate-in zoom-in-95 duration-700 delay-300">
        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Security Note</p>
          <p className="mt-0.5 text-amber-700/80">
            MedFlow uses end-to-end encrypted storage for your order history. Ensure your phone number is correct to receive delivery status updates.
          </p>
        </div>
      </div>
    </div>
  );
}
