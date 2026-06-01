import { createFileRoute, Outlet, useNavigate, useLocation, Link } from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  LayoutDashboard, 
  Boxes, 
  ClipboardList, 
  Users, 
  MessageSquare, 
  User, 
  LogOut, 
  Activity,
  Menu,
  X,
  MoreVertical,
  Settings,
  PanelLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



// Simplified Sidebar Context
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
});

const NotificationContext = createContext<{
  unreadSenderIds: string[];
  unreadOrderIds: string[];
  clearUnreadSender: (id: string) => void;
  clearUnreadOrder: (id: string) => void;
}>({
  unreadSenderIds: [],
  unreadOrderIds: [],
  clearUnreadSender: () => {},
  clearUnreadOrder: () => {},
});

export const useNotifications = () => useContext(NotificationContext);
export const useSidebar = () => useContext(SidebarContext);

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [unreadSenderIds, setUnreadSenderIds] = useState<string[]>([]);
  const [unreadOrderIds, setUnreadOrderIds] = useState<string[]>([]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

const sendNativeNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "./favicon.ico" });
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('global-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
          if (p.new.receiver_id === profile.id) {
            setUnreadSenderIds(prev => Array.from(new Set([...prev, p.new.sender_id])));
            sendNativeNotification("New Message Received", p.new.content);
            toast("New Message", { description: p.new.content });
          }
          queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (p) => {
          if (p.new.mr_id === profile.id) {
            setUnreadOrderIds(prev => Array.from(new Set([...prev, p.new.id])));
            sendNativeNotification("New Order Received!", "A new order has been placed.");
            toast.success("New Order Received!");
          }
          queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient]);

  const clearUnreadSender = (id: string) => setUnreadSenderIds(prev => prev.filter(i => i !== id));
  const clearUnreadOrder = (id: string) => setUnreadOrderIds(prev => prev.filter(i => i !== id));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Activity className="h-10 w-10 animate-pulse text-primary" />
      </div>
    );
  }

  const roleLabel = profile?.role === "mr" ? "Medical Rep" : "Doctor";
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || "User";

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Inventory", url: "/inventory", icon: Boxes, role: "mr" },
    { title: "Orders", url: "/orders", icon: ClipboardList },
    { title: "Contacts", url: "/contacts", icon: Users },
    { title: "Chat", url: "/chat", icon: MessageSquare },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const filteredNav = navItems.filter(item => !item.role || item.role === profile?.role);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      <NotificationContext.Provider value={{ unreadSenderIds, unreadOrderIds, clearUnreadSender, clearUnreadOrder }}>
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
          
          {/* DESKTOP SIDEBAR */}
          <aside className={cn(
            "hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 transition-all duration-300 ease-in-out relative z-30",
            isCollapsed ? "w-20" : "w-64"
          )}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between overflow-hidden">
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-md">
                  <Activity className="h-6 w-6" />
                </div>
                {!isCollapsed && (
                  <div className="animate-in fade-in duration-300">
                    <h1 className="font-bold text-slate-800 leading-none">MedFlow</h1>
                    <p className="text-[10px] uppercase font-bold text-primary tracking-widest mt-1 uppercase">{roleLabel}</p>
                  </div>
                )}
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.url;
                const hasNotif = (item.url === "/chat" && unreadSenderIds.length > 0) || (item.url === "/orders" && unreadOrderIds.length > 0);
                return (
                  <Link key={item.url} to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group",
                      isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">{item.title}</span>}
                    {hasNotif && (
                      <span className={cn("absolute rounded-full bg-rose-500 ring-2 ring-white", isCollapsed ? "right-2 top-2 h-2.5 w-2.5" : "right-3 top-1/2 -translate-y-1/2 h-2 w-2")} />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors focus:outline-none",
                    isCollapsed ? "p-2 justify-center" : "p-2.5"
                  )}>
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 shrink-0 shadow-sm">
                      {displayName[0].toUpperCase()}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 text-left animate-in fade-in duration-300">
                        <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                        <p className="text-[9px] uppercase font-bold text-slate-400 truncate tracking-tight">{roleLabel}</p>
                      </div>
                    )}
                    {!isCollapsed && <MoreVertical className="h-4 w-4 text-slate-400 shrink-0" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2 rounded-2xl px-2 py-2" align={isCollapsed ? "start" : "end"} side="right" sideOffset={10}>
                  <DropdownMenuLabel className="px-2 pb-2 text-[10px] font-black uppercase text-slate-400">Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Link to="/profile" className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-bold text-slate-600">
                        <Settings className="h-4 w-4" /> Profile Details
                     </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-bold text-rose-600 focus:bg-rose-50" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          {/* MOBILE MENU */}
          {isMobileOpen && (
            <div className="fixed inset-0 z-[100] md:hidden">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col p-6 animate-in slide-in-from-left duration-300 shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-primary shadow-sm" />
                      <span className="font-bold text-slate-800">MedFlow</span>
                    </div>
                    <button onClick={() => setIsMobileOpen(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                 </div>
                 <nav className="space-y-2 flex-1 pt-4">
                    {filteredNav.map(item => (
                      <Link key={item.url} to={item.url} onClick={() => setIsMobileOpen(false)} className="flex items-center gap-4 p-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        <item.icon className="h-5 w-5 text-slate-400" /> {item.title}
                      </Link>
                    ))}
                 </nav>
                 
                 <div className="mt-auto space-y-3 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 shrink-0">
                          {displayName[0].toUpperCase()}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">{roleLabel}</p>
                       </div>
                    </div>
                    <button onClick={handleSignOut} className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors">
                      Sign Out <LogOut className="h-5 w-5" />
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* WORKSPACE */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <header className="h-14 flex items-center px-6 bg-white border-b border-slate-200 shrink-0 z-20">
              <div className="flex items-center gap-4 flex-1">
                {/* UNIVERSAL TRIGGER */}
                <button 
                  onClick={() => window.innerWidth < 768 ? setIsMobileOpen(true) : setIsCollapsed(!isCollapsed)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-primary transition-colors hover:bg-white active:scale-95"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-2" />
                <h2 className="text-sm font-bold text-slate-800 tracking-tight hidden sm:block">MedFlow Management Hub</h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:flex leading-none">
                <span>Secure Session</span>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
               <div className="mx-auto max-w-6xl">
                  <Outlet />
               </div>
            </main>
          </div>
        </div>
      </NotificationContext.Provider>
    </SidebarContext.Provider>
  );
}
