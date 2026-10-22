import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Heart, X, Star, RotateCcw, Loader2, Flag } from "lucide-react";
import { db, CrushProfile, LOOKING } from "./shared";
import ProfileCard from "./ProfileCard";

export default function SwipeDeck({ me, onMatch }: { me: CrushProfile; onMatch: (p: CrushProfile) => void }) {
  const [deck, setDeck] = useState<CrushProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [last, setLast] = useState<CrushProfile | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [fly, setFly] = useState<null | "left" | "right" | "up">(null);
  const [busy, setBusy] = useState(false);
  const start = useRef({ x: 0, y: 0 });

  const load = async () => {
    setLoading(true);
    const [{ data: sw }, { data: bl }] = await Promise.all([
      db.from("crush_swipes").select("target_id"),
      db.from("crush_blocks").select("blocked_id"),
    ]);
    const skip = new Set([me.user_id, ...(sw || []).map((s: any) => s.target_id), ...(bl || []).map((b: any) => b.blocked_id)]);
    const { data } = await db.from("crush_profiles").select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(80);
    const list = (data || []).filter((p: CrushProfile) => !skip.has(p.user_id));
    // people with more shared interests first
    list.sort((a: CrushProfile, b: CrushProfile) => b.interests.filter((i) => me.interests.includes(i)).length - a.interests.filter((i) => me.interests.includes(i)).length);
    setDeck(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, [me.user_id]);

  const visible = useMemo(() => filter === "all" ? deck : deck.filter((p) => p.looking_for === filter), [deck, filter]);
  const top = visible[0];

  const act = async (action: "like" | "pass" | "super") => {
    if (!top || busy) return;
    setBusy(true);
    setFly(action === "pass" ? "left" : action === "super" ? "up" : "right");
    const target = top;
    const { error } = await db.from("crush_swipes").insert({ swiper_id: me.user_id, target_id: target.user_id, action });
    setTimeout(async () => {
      setDeck((d) => d.filter((x) => x.user_id !== target.user_id));
      setFly(null); setDrag({ x: 0, y: 0, active: false }); setBusy(false);
      setLast(target);
      if (error) { toast.error("Couldn't save that swipe"); return; }
      if (action !== "pass") {
        const { data: m } = await db.rpc("crush_is_match", { a: me.user_id, b: target.user_id });
        if (m) { confetti({ particleCount: 160, spread: 110, colors: ["#f43f5e", "#fb7185", "#fda4af", "#fde68a"] }); onMatch(target); }
        else if (action === "super") toast.success("⭐ Super like sent!");
      }
    }, 280);
  };

  const undo = async () => {
    if (!last || busy) return;
    setBusy(true);
    await db.from("crush_swipes").delete().eq("swiper_id", me.user_id).eq("target_id", last.user_id);
    setDeck((d) => [last, ...d]); setLast(null); setBusy(false);
  };

  const report = async () => {
    if (!top || busy) return;
    setBusy(true);
    await db.from("crush_blocks").insert({ blocker_id: me.user_id, blocked_id: top.user_id, reason: "reported from discover" });
    setDeck((d) => d.filter((x) => x.user_id !== top.user_id)); setBusy(false);
    toast.success("Reported & hidden. Thanks for keeping NIU safe.");
  };

  const onDown = (e: React.PointerEvent) => { if (busy) return; start.current = { x: e.clientX, y: e.clientY }; setDrag({ x: 0, y: 0, active: true }); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (!drag.active) return; setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true }); };
  const onUp = () => {
    if (!drag.active) return;
    if (drag.x > 110) act("like"); else if (drag.x < -110) act("pass"); else if (drag.y < -130) act("super");
    else setDrag({ x: 0, y: 0, active: false });
  };

  const tx = fly === "right" ? 600 : fly === "left" ? -600 : drag.x;
  const ty = fly === "up" ? -800 : drag.y;
  const common = top ? top.interests.filter((i) => me.interests.includes(i)) : [];

  return (
    <div>
      <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
        {[{ id: "all", label: "Everyone", emoji: "🌍" }, ...LOOKING].map((l) => (
          <button key={l.id} onClick={() => setFilter(l.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === l.id ? "border-[hsl(var(--mode-borrow))] bg-[hsl(var(--mode-borrow)/0.12)] text-[hsl(var(--mode-borrow))]" : "border-border/60 text-muted-foreground"}`}>{l.emoji} {l.label}</button>
        ))}
      </div>

      <div className="relative mx-auto h-[min(68dvh,560px)] w-full max-w-sm">
        {loading ? (
          <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !top ? (
          <div className="grid h-full place-items-center rounded-[2rem] border border-dashed border-border bg-card/50 p-8 text-center">
            <div>
              <p className="text-5xl">🌙</p>
              <p className="mt-3 font-serif text-xl font-bold">You've seen everyone</p>
              <p className="mt-1 text-sm text-muted-foreground">New students join every day. Share NIU Connect with your batch to grow the deck!</p>
              <Button variant="outline" className="mt-4 rounded-2xl" onClick={load}>Refresh</Button>
            </div>
          </div>
        ) : (
          <>
            {visible[1] && <div className="absolute inset-0 scale-[0.95] translate-y-3 opacity-70"><ProfileCard p={visible[1]} /></div>}
            <div
              className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
              style={{ transform: `translate(${tx}px, ${ty}px) rotate(${tx / 18}deg)`, transition: drag.active && !fly ? "none" : "transform 0.3s ease-out" }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            >
              <ProfileCard key={top.user_id} p={top} common={common} />
              <span className="pointer-events-none absolute left-6 top-8 -rotate-12 rounded-xl border-4 border-[hsl(var(--mode-gig))] px-3 py-1 font-serif text-3xl font-extrabold text-[hsl(var(--mode-gig))]" style={{ opacity: Math.max(0, Math.min(1, drag.x / 100)) }}>LIKE</span>
              <span className="pointer-events-none absolute right-6 top-8 rotate-12 rounded-xl border-4 border-destructive px-3 py-1 font-serif text-3xl font-extrabold text-destructive" style={{ opacity: Math.max(0, Math.min(1, -drag.x / 100)) }}>NOPE</span>
              <span className="pointer-events-none absolute bottom-[42%] left-1/2 -translate-x-1/2 rounded-xl border-4 border-[hsl(var(--mode-radar))] px-3 py-1 font-serif text-2xl font-extrabold text-[hsl(var(--mode-radar))]" style={{ opacity: Math.max(0, Math.min(1, -drag.y / 120)) }}>SUPER</span>
              {common.length > 0 && <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-bold">✨ {common.length} in common</span>}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button aria-label="Undo" onClick={undo} disabled={!last || busy} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card shadow disabled:opacity-40"><RotateCcw className="h-4 w-4 text-[hsl(var(--mode-ride))]" /></button>
        <button aria-label="Pass" onClick={() => act("pass")} disabled={!top || busy} className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card shadow-lg transition active:scale-90 disabled:opacity-40"><X className="h-7 w-7 text-destructive" /></button>
        <button aria-label="Super like" onClick={() => act("super")} disabled={!top || busy} className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card shadow transition active:scale-90 disabled:opacity-40"><Star className="h-5 w-5 fill-[hsl(var(--mode-radar))] text-[hsl(var(--mode-radar))]" /></button>
        <button aria-label="Like" onClick={() => act("like")} disabled={!top || busy} className="grid h-16 w-16 place-items-center rounded-full bg-[hsl(var(--mode-borrow))] shadow-lg shadow-[hsl(var(--mode-borrow)/0.4)] transition active:scale-90 disabled:opacity-40"><Heart className="h-7 w-7 fill-primary-foreground text-primary-foreground" /></button>
        <button aria-label="Report" onClick={report} disabled={!top || busy} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card shadow disabled:opacity-40"><Flag className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">Swipe right to like · left to pass · up to super like · tap photo sides to flip</p>
    </div>
  );
}
