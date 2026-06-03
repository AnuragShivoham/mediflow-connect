import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, User, MessageSquare, Loader2, Check, CheckCheck, Paperclip } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNotifications } from "@/routes/_authenticated";

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
    queryKey: ["contacts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`id, contact:profiles!contacts_contact_id_fkey(id, full_name, role, email, phone)`)
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${profile?.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${profile?.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContact,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        sender_id: profile!.id,
        receiver_id: selectedContact.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedContact?.id] });
    },
  });

  useEffect(() => {
    if (selectedContact?.id && unreadSenderIds.includes(selectedContact.id)) {
      clearUnreadSender(selectedContact.id);
    }
  }, [selectedContact, unreadSenderIds]);

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
      <div className="w-80 rounded-3xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-800">Messages</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search records..." className="pl-10 h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingContacts ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></div>
            ) : contacts?.map((c: any) => {
              const hasUnread = unreadSenderIds.includes(c.contact.id);
              const isSelected = selectedContact?.id === c.contact.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c.contact)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                    isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-slate-50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                      <AvatarFallback className={cn(isSelected ? "bg-white/20" : "bg-primary/5 text-primary")}>
                        {(c.contact.full_name?.[0] || c.contact.email?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{c.contact.full_name || c.contact.email?.split('@')[0]}</div>
                    <div className={cn("text-[10px] uppercase font-bold tracking-tighter truncate", isSelected ? "text-white/70" : "text-slate-400")}>
                      {hasUnread ? "New Message" : c.contact.role === "doctor" ? "Practitioner" : "Medical Rep"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 rounded-3xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-white shadow-sm">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {(selectedContact.full_name?.[0] || selectedContact.email?.[0] || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm text-slate-800">{selectedContact.full_name || selectedContact.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active now</span>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-slate-50/30">
              <div className="space-y-6">
                {loadingMessages ? (
                  <div className="p-12 text-center items-center flex flex-col gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                    <span className="text-xs font-bold text-slate-400">Loading secure history...</span>
                  </div>
                ) : messages?.map((msg: any) => {
                  const isOwn = msg.sender_id === profile?.id;
                  return (
                    <div key={msg.id} className={cn("flex flex-col gap-1.5 max-w-[75%]", isOwn ? "ml-auto items-end" : "mr-auto items-start")}>
                      <div className={cn("px-4 py-3 rounded-2xl text-sm font-medium shadow-sm", 
                        isOwn ? "bg-primary text-white rounded-tr-none" : "bg-white border border-slate-100 rounded-tl-none")}>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOwn && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-100">
              <form onSubmit={handleSend} className="flex gap-3 items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-primary">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a secure message..." className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-2" />
                <Button type="submit" size="icon" className="shrink-0 rounded-xl h-10 w-10 shadow-md" disabled={!newMessage.trim() || sendMutation.isPending}>
                  {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Your Communication Hub</h2>
            <p className="mt-2 text-sm font-medium text-slate-400 max-w-xs">
              Select a practitioner or representative from the left to start a secure discussion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
