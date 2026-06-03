import { createFileRoute, Outlet, useNavigate, useLocation, Link } from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext } from "react";
import { useAuth } from "@/context/auth-context";
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
  Bell,
} from "lucide-react";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ParticleField } from "@/components/particle-field";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadSenderIds, setUnreadSenderIds] = useState<string[]>([]);
  const [unreadOrderIds, setUnreadOrderIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () =>
      api.get<{ unreadMessageSenders: string[]; unreadOrderIds: string[] }>("/notifications/unread"),
    refetchInterval: 10_000,
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!notifData) return;
    setUnreadSenderIds(notifData.unreadMessageSenders ?? []);
    setUnreadOrderIds(notifData.unreadOrderIds ?? []);
  }, [notifData]);

  const clearUnreadSender = (id: string) => setUnreadSenderIds((prev) => prev.filter((i) => i !== id));
  const clearUnreadOrder = (id: string) => setUnreadOrderIds((prev) => prev.filter((i) => i !== id));

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    navigate({ to: "/login" });
  };

  if (loading || !user) {
    return (
      <div className="relative grid h-screen place-items-center overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 aurora opacity-50" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 shadow-2xl shadow-primary/30"
        >
          <Activity className="h-8 w-8 text-white" />
        </motion.div>
      </div>
    );
  }

  const roleLabel = profile?.role === "mr" ? "Medical Rep" : "Doctor";
  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "User";

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Inventory", url: "/inventory", icon: Boxes, role: "mr" },
    { title: "Orders", url: "/orders", icon: ClipboardList },
    { title: "Contacts", url: "/contacts", icon: Users },
    { title: "Chat", url: "/chat", icon: MessageSquare },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const filteredNav = navItems.filter((item) => !item.role || item.role === profile?.role);
  const totalUnread = unreadSenderIds.length + unreadOrderIds.length;

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      <NotificationContext.Provider value={{ unreadSenderIds, unreadOrderIds, clearUnreadSender, clearUnreadOrder }}>
        <SmoothScroll>
          <div className="relative flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="pointer-events-none fixed inset-0 aurora opacity-40 dark:opacity-25" />
            <div className="pointer-events-none fixed inset-0">
              <ParticleField density={35} className="h-full w-full" />
            </div>

            {/* DESKTOP SIDEBAR */}
            <aside
              className={cn(
                "hidden md:flex flex-col glass-strong border-r border-white/40 dark:border-white/10 shrink-0 transition-all duration-300 ease-in-out relative z-30",
                isCollapsed ? "w-20" : "w-64",
              )}
            >
              <div className="p-6 border-b border-white/40 dark:border-white/10 flex items-center justify-between overflow-hidden">
                <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-violet-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Activity className="h-6 w-6" />
                  </div>
                  {!isCollapsed && (
                    <div className="animate-in fade-in duration-300">
                      <h1 className="font-bold text-slate-800 dark:text-slate-100 leading-none">
                        <span className="gradient-text">MedFlow</span>
                      </h1>
                      <p className="text-[10px] uppercase font-bold text-primary tracking-widest mt-1">{roleLabel}</p>
                    </div>
                  )}
                </Link>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredNav.map((item, idx) => {
                  const isActive = location.pathname === item.url;
                  const hasNotif =
                    (item.url === "/chat" && unreadSenderIds.length > 0) ||
                    (item.url === "/orders" && unreadOrderIds.length > 0);
                  return (
                    <motion.div
                      key={item.url}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group",
                          isActive
                            ? "bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg shadow-primary/30"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-primary",
                          )}
                        />
                        {!isCollapsed && <span className="animate-in fade-in duration-300">{item.title}</span>}
                        {hasNotif && (
                          <span
                            className={cn(
                              "absolute rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900",
                              isCollapsed ? "right-2 top-2 h-2.5 w-2.5" : "right-3 top-1/2 -translate-y-1/2 h-2 w-2",
                            )}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/40 dark:border-white/10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 transition-colors focus:outline-none backdrop-blur",
                        isCollapsed ? "p-2 justify-center" : "p-2.5",
                      )}
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-violet-500 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                        {displayName[0].toUpperCase()}
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 text-left animate-in fade-in duration-300">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                          <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 truncate tracking-tight">{roleLabel}</p>
                        </div>
                      )}
                      {!isCollapsed && <MoreVertical className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mb-2 rounded-2xl px-2 py-2" align={isCollapsed ? "start" : "end"} side="right" sideOffset={10}>
                    <DropdownMenuLabel className="px-2 pb-2 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
                        <Settings className="h-4 w-4" /> Profile Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-bold text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </aside>

            {/* MOBILE MENU */}
            <AnimatePresence>
              {isMobileOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] md:hidden"
                >
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                    className="absolute inset-y-0 left-0 w-72 glass-strong flex flex-col p-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 grid place-items-center text-white shadow-md">
                          <Activity className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          <span className="gradient-text">MedFlow</span>
                        </span>
                      </div>
                      <button onClick={() => setIsMobileOpen(false)} className="h-8 w-8 rounded-full bg-white/60 dark:bg-white/10 flex items-center justify-center">
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                      </button>
                    </div>
                    <nav className="space-y-2 flex-1 pt-4">
                      {filteredNav.map((item) => (
                        <Link
                          key={item.url}
                          to={item.url}
                          onClick={() => setIsMobileOpen(false)}
                          className="flex items-center gap-4 p-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                        >
                          <item.icon className="h-5 w-5 text-slate-400 dark:text-slate-500" /> {item.title}
                        </Link>
                      ))}
                    </nav>

                    <div className="mt-auto space-y-3 pt-6 border-t border-white/40 dark:border-white/10">
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-violet-500 text-white grid place-items-center font-black text-xs shadow-md shrink-0">
                          {displayName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate">{roleLabel}</p>
                        </div>
                      </div>
                      <button onClick={handleSignOut} className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors">
                        Sign Out <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              <header className="h-14 flex items-center px-6 glass-strong border-b border-white/40 dark:border-white/10 shrink-0 z-20">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => (window.innerWidth < 768 ? setIsMobileOpen(true) : setIsCollapsed(!isCollapsed))}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-primary transition-colors hover:bg-white dark:hover:bg-white/10 active:scale-95"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="h-4 w-px bg-white/60 dark:bg-white/10 mx-2" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight hidden sm:block">MedFlow Management Hub</h2>
                </div>
                <div className="flex items-center gap-3">
                  {totalUnread > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                      <Bell className="h-3 w-3" /> {totalUnread} new
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden md:flex leading-none">
                    <span>Secure Session</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <ThemeToggle />
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                <div className="mx-auto max-w-6xl">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        </SmoothScroll>
      </NotificationContext.Provider>
    </SidebarContext.Provider>
  );
}
