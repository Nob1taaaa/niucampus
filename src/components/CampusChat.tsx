import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;
const BAD = /\b(fuck|shit|bitch|bc|mc|chutiya|madarchod|behenchod|randi|gandu|bsdk)\b/i;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string;
  postTitle: string;
  posterId: string;
  responderId: string;
  meId: string;
  otherName: string;
};

export default function CampusChat({ open, onOpenChange, postId, postTitle, posterId, responderId, meId, otherName }: Props) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let { data } = await db.from("campus_hub_chats").select("id").eq("post_id", postId).eq("responder_id", responderId).maybeSingle();
      if (!data) {
        const ins = await db.from("campus_hub_chats").insert({ post_id: postId, poster_id: posterId, responder_id: responderId }).select("id").single();
        data = ins.data;
        if (!data) {
          const again = await db.from("campus_hub_chats").select("id").eq("post_id", postId).eq("responder_id", responderId).maybeSingle();
          data = again.data;
        }
      }
      if (cancelled || !data) { setLoading(false); return; }
      setChatId(data.id);
      const m = await db.from("campus_hub_messages").select("*").eq("chat_id", data.id).order("created_at", { ascending: true });
      if (!cancelled) { setMsgs(m.data || []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, postId, posterId, responderId]);

  useEffect(() => {
    if (!open || !chatId) return;
    const ch = supabase
      .channel(`campus-chat-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "campus_hub_messages", filter: `chat_id=eq.${chatId}` },
        (payload: any) => setMsgs((prev) => prev.some((x) => x.id === payload.new.id) ? prev : [...prev, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, chatId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const content = text.trim();
    if (!content || !chatId || sending) return;
    if (BAD.test(content)) { toast.error("Please keep it friendly 🙏"); return; }
    setSending(true);
    const { data, error } = await db.from("campus_hub_messages").insert({ chat_id: chatId, sender_id: meId, content }).select().single();
    setSending(false);
    if (error) { toast.error("Couldn't send, try again"); return; }
    setText("");
    setMsgs((prev) => prev.some((x) => x.id === data.id) ? prev : [...prev, data]);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85dvh] rounded-t-3xl">
        <DrawerHeader className="text-left border-b border-border/50">
          <DrawerTitle className="font-serif text-xl">{otherName}</DrawerTitle>
          <p className="text-xs text-muted-foreground truncate">About: {postTitle}</p>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="grid place-items-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : msgs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground mt-10">Say hi 👋 and fix where to meet.</p>
          ) : msgs.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                  {m.content}
                  <div className={`mt-0.5 text-[0.6rem] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Message…" className="rounded-2xl text-base" disabled={!chatId} />
          <Button type="submit" size="icon" className="rounded-2xl shrink-0" disabled={sending || !text.trim() || !chatId}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
