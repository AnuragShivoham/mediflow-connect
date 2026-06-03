import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Boxes, ClipboardList, LayoutDashboard, LogOut, MessageSquare, Users, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Profile", url: "/profile", icon: User },
] as const;

export function AppSidebar({ hasUnreadMessages, hasNewOrders }: { hasUnreadMessages?: boolean; hasNewOrders?: boolean }) {
  const location = useLocation();
  const path = location.pathname;
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const roleLabel = profile?.role === "mr" ? "Medical Rep" : profile?.role === "doctor" ? "Doctor" : "";

  const filteredItems = items.filter(item => {
    if (item.url === "/inventory") return profile?.role === "mr";
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="border-b bg-card py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-base font-bold tracking-tight">MedFlow</div>
              <div className="truncate text-xs font-semibold text-primary/70">{roleLabel}</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {!isCollapsed && (
          <div className="px-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Workspace
          </div>
        )}
        <SidebarMenu>
          {filteredItems.map((item) => {
            const showDot = (item.url === "/chat" && hasUnreadMessages) || (item.url === "/orders" && hasNewOrders);
            const isActive = path === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.url} className="flex items-center w-full">
                    <div className="relative flex items-center justify-center shrink-0">
                      <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      {showDot && (
                        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className={cn("ml-3 font-medium", isActive ? "text-primary font-bold" : "text-slate-600")}>
                        {item.title}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t bg-slate-50/50 p-4">
        <div className={cn(
          "flex items-center gap-3 p-2 transition-all",
          isCollapsed ? "justify-center" : "rounded-xl border border-border/60 bg-white shadow-sm px-3"
        )}>
           <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 text-xs">
              {(profile?.full_name?.[0] || profile?.email?.[0] || "?")?.toUpperCase()}
            </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-900">
                  {profile?.full_name || profile?.email?.split('@')[0] || "User"}
                </div>
                <div className="truncate text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{roleLabel}</div>
              </div>
              <button onClick={signOut} className="text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
