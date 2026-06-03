import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, MessageSquare, Loader2, Check, CheckCheck, Paperclip } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/routes/_authenticated";
import { GlassCard } from "@/components/glass-card";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Messages — MedFlow" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { unreadSenderIds, clearUnreadSender } = useNotifications();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: contacts, isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts-list", profile?.id],
    queryFn: () => api.get<any[]>("/contacts"),
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedContact?.id, profile?.id],
    queryFn: () => api.get<any[]>(`/messages/${selectedContact.id}`),
    enabled: !!selectedContact,
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post<{ id: string }>("/messages", {
        receiver_id: selectedContact.id,
        content,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedContact?.id] });
    },
    onError: (err: any) => {
      // toast imported lazily to avoid circular dep
      import("sonner").then(({ toast }) => toast.error(err.message));
    },
  });

  useEffect(() => {
    if (selectedContact?.id && unreadSenderIds.includes(selectedContact.id)) {
      clearUnreadSender(selectedContact.id);
    }
  }, [selectedContact, unreadSenderIds, clearUnreadSender]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMutation.isPending) return;
    sendMutation.mutate(newMessage.trim());
  };

  return (
    <div className="mx-auto max-w-6xl flex h-[calc(100vh-10rem)] gap-4 overflow-hidden">
      {/* Sidebar */}
      <GlassCard delay={0} className="w-80 flex flex-col overflow-hidden !p-0">
        <div className="p-5 border-b border-white/40 dark:border-white/5">
          <h2 className="font-display text-lg font-bold gradient-text">Messages</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search records..." className="pl-10 h-10 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border-white/60 dark:border-white/10" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingContacts ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : (
              contacts?.map((c: any) => {
                const hasUnread = unreadSenderIds.includes(c.contact.id);
                const isSelected = selectedContact?.id === c.contact.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContact(c.contact)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                      isSelected
                        ? "bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg shadow-primary/30"
                        : "hover:bg-white/60 dark:hover:bg-white/10",
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarFallback className={cn(isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                          {(c.contact.full_name?.[0] || c.contact.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {hasUnread && (
                        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{c.contact.full_name || c.contact.email?.split("@")[0]}</div>
                      <div className={cn("text-[10px] uppercase font-bold tracking-tighter truncate", isSelected ? "text-white/70" : "text-muted-foreground")}>
                        {hasUnread ? "New Message" : c.contact.role === "doctor" ? "Practitioner" : "Medical Rep"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </GlassCard>

      {/* Main Chat Area */}
      <GlassCard delay={0.05} className="flex-1 flex flex-col overflow-hidden !p-0">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-white/40 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5 backdrop-blur">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-violet-500/10 text-primary font-bold">
                    {(selectedContact.full_name?.[0] || selectedContact.email?.[0] || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm">{selectedContact.full_name || selectedContact.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active now</span>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="p-12 text-center items-center flex flex-col gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Loading secure history...</span>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages?.map((msg: any, idx: number) => {
                      const isOwn = msg.sender_id === profile?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, delay: Math.min(idx * 0.01, 0.1) }}
                          className={cn("flex flex-col gap-1.5 max-w-[75%]", isOwn ? "ml-auto items-end" : "mr-auto items-start")}
                        >
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm",
                              isOwn
                                ? "bg-gradient-to-br from-primary to-violet-500 text-white rounded-tr-md"
                                : "glass rounded-tl-md",
                            )}
                          >
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {isOwn && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/40 dark:border-white/5">
              <form onSubmit={handleSend} className="flex gap-2 items-center bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-white/60 dark:border-white/10 backdrop-blur">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a secure message..."
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-2"
                />
                <Button type="submit" size="icon" className="shrink-0 rounded-xl h-10 w-10 shadow-md bg-gradient-to-br from-primary to-violet-500" disabled={!newMessage.trim() || sendMutation.isPending}>
                  {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center text-primary mb-6 shadow-inner"
            >
              <MessageSquare className="h-10 w-10" />
            </motion.div>
            <h2 className="text-xl font-bold">Your Communication Hub</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Select a practitioner or representative from the left to start a secure discussion.
            </p>
            <Link to="/contacts" className="mt-4 text-sm font-bold text-primary hover:underline">Manage contacts -&gt;</Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
