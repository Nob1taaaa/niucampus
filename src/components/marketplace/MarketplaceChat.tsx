import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@supabase/supabase-js";

interface Chat {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing_title?: string;
  other_name?: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  listingId?: string | null;
  user: User | null;
  onBack: () => void;
}

const MarketplaceChat = ({ listingId, user, onBack }: Props) => {
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Load chats
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("marketplace_chats")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) { setLoading(false); return; }

      const chatData = data || [];
      // Get listing titles and other user names
      const listingIds = [...new Set(chatData.map(c => c.listing_id))];
      const otherUserIds = [...new Set(chatData.map(c => c.buyer_id === user.id ? c.seller_id : c.buyer_id))];

      const [listingsRes, profilesRes] = await Promise.all([
        listingIds.length > 0 ? supabase.from("marketplace_listings").select("id, title").in("id", listingIds) : { data: [] },
        otherUserIds.length > 0 ? supabase.from("profiles").select("id, full_name").in("id", otherUserIds) : { data: [] },
      ]);

      const listingMap: Record<string, string> = {};
      (listingsRes.data || []).forEach(l => { listingMap[l.id] = l.title; });
      const profileMap: Record<string, string> = {};
      (profilesRes.data || []).forEach(p => { profileMap[p.id] = p.full_name || "Student"; });

      const enriched = chatData.map(c => ({
        ...c,
        listing_title: listingMap[c.listing_id] || "Item",
        other_name: profileMap[c.buyer_id === user.id ? c.seller_id : c.buyer_id] || "Student",
      }));

      setChats(enriched);

      // Auto-select chat for specific listing
      if (listingId) {
        const match = enriched.find(c => c.listing_id === listingId);
        if (match) setSelectedChat(match.id);
      }

      setLoading(false);
    };
    load();
  }, [user, listingId]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    const load = async () => {
      const { data } = await supabase
        .from("marketplace_messages")
        .select("*")
        .eq("chat_id", selectedChat)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    load();

    // Real-time subscription
    const channel = supabase
      .channel(`market-chat-${selectedChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "marketplace_messages", filter: `chat_id=eq.${selectedChat}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChat]);

  const handleSend = async () => {
    if (!user || !selectedChat || !newMsg.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("marketplace_messages").insert({
      chat_id: selectedChat,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setNewMsg("");
    setSending(false);
  };

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-4 flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
        </div>
      ))}
    </div>
  );

  // Chat detail view
  if (selectedChat) {
    const chat = chats.find(c => c.id === selectedChat);
    return (
      <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm overflow-hidden flex flex-col" style={{ height: "calc(100dvh - 200px)" }}>
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border/40 bg-card/50">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setSelectedChat(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{chat?.other_name}</p>
            <p className="text-[0.6rem] text-muted-foreground truncate">Re: {chat?.listing_title}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">Start the conversation! 💬</p>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/30 border border-border/40 text-foreground rounded-bl-md"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[0.5rem] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-t border-border/40 bg-card/50">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl text-xs h-9"
            />
            <Button type="submit" size="icon" disabled={sending || !newMsg.trim()} className="h-9 w-9 rounded-xl">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Chat list
  return (
    <div className="space-y-3">
      {chats.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/70 py-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3">
            <MessageCircle className="h-6 w-6 text-primary/50" />
          </div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start chatting by clicking "Chat with Seller" on any listing.</p>
        </div>
      ) : (
        chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className="w-full rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm p-3 sm:p-4 flex items-center gap-3 text-left transition-all hover:border-primary/25 hover:bg-card/90"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary/20 shrink-0">
              {chat.other_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{chat.other_name}</p>
              <p className="text-[0.6rem] text-muted-foreground truncate">Re: {chat.listing_title}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

export default MarketplaceChat;
