import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Send, ShieldOff } from "lucide-react";
import { db, CrushProfile, VIBES, initials, BAD } from "./shared";

const OPENERS = ["Okay the app said we match 👀 hi!", "Chai or coffee? Choose wisely.", "Your prompt answer made me laugh 😄", "Canteen after class?"];

export default function MatchesPanel({ me, refreshKey, openWith }: { me: CrushProfile; refreshKey: number; openWith?: CrushProfile | null }) {
  const [matches, setMatches] = useState<(CrushProfile & { matched_at: string })[]>([]);
  const [lastMsg, setLastMsg] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<CrushProfile | null>(null);

  const load = async () => {
    const { data: m } = await db.rpc("my_crush_matches");
    const ids = (m || []).map((x: any) => x.match_id);
    if (!ids.length) { setMatches([]); setLoading(false); return; }
    const { data: profs } = await db.from("crush_profiles").select("*").in("user_id", ids);
    setMatches((m || []).map((x: any) => ({ ...(profs || []).find((p: any) => p.user_id === x.match_id), matched_at: x.matched_at })).filter((x: any) => x.user_id));
    const { data: msgs } = await db.from("crush_messages").select("*").order("created_at", { ascending: false }).limit(200);
    const lm: Record<string, any> = {};
    (msgs || []).forEach((x: any) => { const other = x.sender_id === me.user_id ? x.receiver_id : x.sender_id; if (!lm[other]) lm[other] = x; });
    setLastMsg(lm);
    setLoading(false);
  };
  useEffect(() => { load(); }, [refreshKey]);
  useEffect(() => { if (openWith) setChat(openWith); }, [openWith]);

  if (loading) return <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!matches.length) return (
    <div className="rounded-3xl border border-dashed border-border p-8 text-center">
      <p className="text-5xl">💞</p>
      <p className="mt-3 font-serif text-xl font-bold">No matches yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Keep swiping in Discover. When you both like each other, you'll find them here.</p>
    </div>
  );

  const fresh = matches.filter((m) => !lastMsg[m.user_id]);
  const talking = matches.filter((m) => lastMsg[m.user_id]);

  return (
    <div className="space-y-5">
      {fresh.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">New matches</p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {fresh.map((m) => (
              <button key={m.user_id} onClick={() => setChat(m)} className="shrink-0 text-center">
                <div className="relative h-20 w-16 overflow-hidden rounded-2xl ring-2 ring-[hsl(var(--mode-borrow))] ring-offset-2 ring-offset-background">
                  {m.photos[0] ? <img src={m.photos[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-bold text-primary-foreground" style={{ background: `hsl(var(${VIBES[m.vibe_color]}))` }}>{initials(m.display_name)}</div>}
                </div>
                <p className="mt-1.5 w-16 truncate text-xs font-semibold">{m.display_name.split(" ")[0]}</p>
              </button>
            ))}
          </div>
        </section>
      )}
      {talking.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</p>
          <div className="space-y-2">
            {talking.map((m) => {
              const lm = lastMsg[m.user_id];
              return (
                <button key={m.user_id} onClick={() => setChat(m)} className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card/70 p-3 text-left">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {m.photos[0] ? <img src={m.photos[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm font-bold text-primary-foreground" style={{ background: `hsl(var(${VIBES[m.vibe_color]}))` }}>{initials(m.display_name)}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{lm.sender_id === me.user_id ? "You: " : ""}{lm.content}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {chat && <CrushChat me={me} other={chat} onClose={() => { setChat(null); load(); }} />}
    </div>
  );
}

function CrushChat({ me, other, onClose }: { me: CrushProfile; other: CrushProfile; onClose: () => void }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await db.from("crush_messages").select("*")
        .or(`and(sender_id.eq.${me.user_id},receiver_id.eq.${other.user_id}),and(sender_id.eq.${other.user_id},receiver_id.eq.${me.user_id})`)
        .order("created_at");
      setMsgs(data || []); setLoading(false);
    })();
    const ch = supabase.channel(`crush-${[me.user_id, other.user_id].sort().join("-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crush_messages", filter: `receiver_id=eq.${me.user_id}` }, (pl: any) => {
        if (pl.new.sender_id === other.user_id) setMsgs((p) => p.some((x) => x.id === pl.new.id) ? p : [...p, pl.new]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.user_id, other.user_id]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (content = text.trim()) => {
    if (!content || sending) return;
    if (BAD.test(content)) return toast.error("Please keep it friendly 🙏");
    setSending(true);
    const { data, error } = await db.from("crush_messages").insert({ sender_id: me.user_id, receiver_id: other.user_id, content }).select().single();
    setSending(false);
    if (error) return toast.error("Couldn't send");
    setText(""); setMsgs((p) => [...p, data]);
  };
  const unmatch = async () => {
    if (!confirm(`Unmatch & block ${other.display_name}? They won't be able to message you.`)) return;
    await db.from("crush_blocks").insert({ blocker_id: me.user_id, blocked_id: other.user_id, reason: "unmatched" });
    toast.success("Unmatched"); onClose();
  };

  return (
    <Drawer open onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="h-[88dvh] rounded-t-3xl">
        <DrawerHeader className="flex items-center justify-between border-b border-border/50 text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              {other.photos[0] ? <img src={other.photos[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm font-bold text-primary-foreground" style={{ background: `hsl(var(${VIBES[other.vibe_color]}))` }}>{initials(other.display_name)}</div>}
            </div>
            <div><DrawerTitle className="font-serif text-lg">{other.display_name}</DrawerTitle><p className="text-[0.7rem] text-muted-foreground">{[other.branch, other.year_of_study].filter(Boolean).join(" · ") || "NIU student"}</p></div>
          </div>
          <button onClick={unmatch} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"><ShieldOff className="h-4 w-4" />Unmatch</button>
        </DrawerHeader>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loading ? <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            : msgs.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-4xl">👋</p>
                <p className="mt-2 text-sm text-muted-foreground">You matched! Break the ice:</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {OPENERS.map((o) => <button key={o} onClick={() => send(o)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs">{o}</button>)}
                </div>
              </div>
            ) : msgs.map((m) => {
              const mine = m.sender_id === me.user_id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-md bg-[hsl(var(--mode-borrow))] text-primary-foreground" : "rounded-bl-md bg-muted"}`}>{m.content}</div>
                </div>
              );
            })}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Message…" className="rounded-2xl" />
          <Button type="submit" size="icon" className="shrink-0 rounded-2xl" disabled={sending || !text.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
