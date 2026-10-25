import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, Plus, Search, Check, X, ArrowRight, Users, Sparkles, Shield, MessageCircle } from "lucide-react";
import CampusChat from "@/components/CampusChat";

const db = supabase as any;
type Kind = "radar" | "food" | "borrow" | "gig" | "creator" | "ride";

const MODES: Record<Kind, { emoji: string; label: string; tag: string; cta: string; hours: number | null; text: string; bg: string; soft: string; border: string; ring: string }> = {
  radar:   { emoji: "📡", label: "Radar",      tag: "Hang out right now",   cta: "I'm in",       hours: 2,    text: "text-mode-radar",   bg: "bg-mode-radar",   soft: "bg-mode-radar/10",   border: "border-mode-radar/40",   ring: "ring-mode-radar" },
  food:    { emoji: "🍜", label: "Food Buddy", tag: "Never eat alone",       cta: "Join table",   hours: 2,    text: "text-mode-food",    bg: "bg-mode-food",    soft: "bg-mode-food/10",    border: "border-mode-food/40",    ring: "ring-mode-food" },
  borrow:  { emoji: "🆘", label: "Borrow SOS", tag: "Need it in 15 mins",    cta: "I have it",    hours: 6,    text: "text-mode-borrow",  bg: "bg-mode-borrow",  soft: "bg-mode-borrow/10",  border: "border-mode-borrow/40",  ring: "ring-mode-borrow" },
  gig:     { emoji: "💸", label: "Gigs",       tag: "Earn from your skills", cta: "I'm interested", hours: null, text: "text-mode-gig",     bg: "bg-mode-gig",     soft: "bg-mode-gig/10",     border: "border-mode-gig/40",     ring: "ring-mode-gig" },
  creator: { emoji: "🎬", label: "Creators",   tag: "Find your collab",      cta: "Let's collab", hours: null, text: "text-mode-creator", bg: "bg-mode-creator", soft: "bg-mode-creator/10", border: "border-mode-creator/40", ring: "ring-mode-creator" },
  ride:    { emoji: "🛺", label: "Ride Share", tag: "Split autos & cabs",    cta: "Book seat",    hours: 12,   text: "text-mode-ride",    bg: "bg-mode-ride",    soft: "bg-mode-ride/10",    border: "border-mode-ride/40",    ring: "ring-mode-ride" },
};
const KINDS = Object.keys(MODES) as Kind[];
const isKind = (t: string): t is Kind => (KINDS as string[]).includes(t);

// Each mode gets its own identity: headline, flow, and safety note
const MODE_INFO: Record<Kind, { title: string; accent: string; steps: [string, string][]; tip: string; stat: string }> = {
  radar:   { title: "Who's free", accent: "right now?", stat: "pings nearby", tip: "Meet in public spots like the canteen, library or main lawn.",
             steps: [["📍", "Drop a ping with your spot"], ["👋", "Others tap “I'm in”"], ["☕", "Meet up within 2 hours"]] },
  food:    { title: "Never eat", accent: "alone again.", stat: "open tables", tip: "Pick a canteen or café on campus — split the bill fairly.",
             steps: [["🍽️", "Pick a spot & time"], ["🪑", "Set how many seats"], ["😋", "Share a table, make a friend"]] },
  borrow:  { title: "Need it", accent: "in 15 minutes?", stat: "open requests", tip: "Return items on time — your reputation travels fast.",
             steps: [["🆘", "Say what you need"], ["⚡", "Set urgency & reward"], ["🤝", "Someone nearby lends it"]] },
  gig:     { title: "Turn skills", accent: "into ₹ money.", stat: "gigs posted", tip: "Agree price and scope in chat before starting any work.",
             steps: [["💼", "Offer or hire a skill"], ["💬", "Chat & agree a price"], ["💸", "Deliver and get paid"]] },
  creator: { title: "Find your", accent: "collab partner.", stat: "creators looking", tip: "Credit each other on every post you make together.",
             steps: [["🎬", "Post the role you need"], ["📱", "Share platform & handle"], ["🚀", "Shoot, post, grow together"]] },
  ride:    { title: "Split the", accent: "auto & cab fare.", stat: "rides leaving", tip: "Share ride details with a friend before you leave.",
             steps: [["🗺️", "Set from, to and time"], ["💺", "Choose seats & fare"], ["🛺", "Pay just your share"]] },
};

// ---------- Mode-specific helpers ----------
const URG = ["Right now", "Within 1 hour", "Today"];
const urgRank = (p: any) => { const i = URG.indexOf(p.payload?.urgency); return i < 0 ? 9 : i; };
const perHead = (p: any) => p.payload?.fare ? Number(p.payload.fare) / ((p.payload.seats || 1) + 1) : 9e9;
const subKey = (p: any): string => {
  const pl = p.payload || {};
  switch (p.kind) {
    case "radar": case "food": case "borrow": return p.location || "";
    case "ride": return pl.to || "";
    case "gig": return pl.mode === "hire" ? "hire" : "offer";
    case "creator": return pl.platform || "";
    default: return "";
  }
};

const Seg = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-foreground text-background" : "bg-background/70 border border-border/50"}`}>{children}</button>
);
const Panel = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border/50 bg-card/70 p-4 backdrop-blur-xl">
    <div className="mb-3 flex items-baseline justify-between gap-2"><p className="font-serif text-lg font-bold">{title}</p>{hint && <p className="text-[0.7rem] text-muted-foreground">{hint}</p>}</div>
    {children}
  </div>
);

type Quick = (patch: Partial<ReturnType<typeof emptyDraft>>) => void;
const ModeTools = ({ k, posts, sub, setSub, sort, setSort, quick }: { k: Kind; posts: any[]; sub: string; setSub: (s: string) => void; sort: string; setSort: (s: string) => void; quick: Quick }) => {
  const m = MODES[k];
  const tally = (keys: string[]) => keys.map((x) => [x, posts.filter((p) => subKey(p) === x).length] as const);
  const toggle = (x: string) => setSub(sub === x ? "" : x);
  const [fare, setFare] = useState(""); const [ppl, setPpl] = useState(3);

  if (k === "radar") return (
    <section className="mt-4 grid gap-3 md:grid-cols-2">
      <Panel title="📍 Spot board" hint="Tap a spot to see who's there">
        <div className="grid grid-cols-2 gap-2">
          {tally(SPOTS).map(([s, n]) => (
            <button key={s} onClick={() => toggle(s)} className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold transition ${sub === s ? `${m.bg} text-primary-foreground border-transparent` : `${m.soft} ${m.border}`}`}>
              <span className="truncate">{s}</span>
              <span className="flex items-center gap-1">{n > 0 && <span className={`h-2 w-2 animate-pulse rounded-full ${sub === s ? "bg-background" : m.bg}`} />}{n}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="⚡ One-tap hangout" hint="Goes live for 2 hours">
        <div className="grid grid-cols-2 gap-2">
          {PICKS.radar.map((x) => <button key={x} onClick={() => quick({ pick: x, when: "Right now" })} className="rounded-2xl border border-border/50 bg-background/70 px-3 py-2.5 text-left text-sm font-medium active:scale-95">{x}</button>)}
        </div>
      </Panel>
    </section>
  );

  if (k === "food") {
    const meals: [string, string, string][] = [["🌅", "Breakfast", "In 30 mins"], ["🍛", "Lunch", "Right now"], ["🍟", "Snacks", "In 15 mins"], ["🌙", "Dinner", "In 1 hour"]];
    return (
      <section className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <Panel title="🪑 Open tables by canteen" hint="Filled dots = people already seated">
          <div className="space-y-2">
            {SPOTS.slice(0, 5).map((s) => {
              const here = posts.filter((p) => p.location === s);
              const seats = here.reduce((a, p) => a + (p.payload?.size || 1), 0);
              const taken = here.reduce((a, p) => a + (p.payload?.accepted?.length || 0), 0);
              return (
                <button key={s} onClick={() => toggle(s)} className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${sub === s ? m.border + " " + m.soft : "border-border/40 bg-background/60"}`}>
                  <span className="text-sm font-semibold">{s}</span>
                  <span className="flex gap-1">{seats === 0 ? <span className="text-[0.7rem] text-muted-foreground">no tables</span> : Array.from({ length: Math.min(seats, 8) }).map((_, i) => <span key={i} className={`h-3 w-3 rounded-full ${i < taken ? m.bg : "border-2 " + m.border}`} />)}</span>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title="🍽️ I'm hungry for…" hint="Start a table in one tap">
          <div className="grid grid-cols-2 gap-2">
            {meals.map(([e, l, w]) => (
              <button key={l} onClick={() => quick({ spot: "Main Canteen", when: w, title: `${l} at Main Canteen` })} className={`rounded-2xl ${m.soft} border ${m.border} p-3 text-left active:scale-95`}>
                <span className="text-2xl">{e}</span><p className="mt-1 text-sm font-bold">{l}</p><p className="text-[0.65rem] text-muted-foreground">{w}</p>
              </button>
            ))}
          </div>
        </Panel>
      </section>
    );
  }

  if (k === "borrow") return (
    <section className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr]">
      <Panel title="🚨 Urgency meter">
        <div className="grid grid-cols-3 gap-2 text-center">
          {URG.map((u, i) => {
            const n = posts.filter((p) => p.payload?.urgency === u).length;
            return <div key={u} className={`rounded-2xl p-3 ${i === 0 ? "bg-destructive/10 text-destructive" : "bg-background/70 border border-border/50"}`}><p className="font-serif text-2xl font-bold">{n}</p><p className="text-[0.65rem] font-semibold">{u}</p></div>;
          })}
        </div>
        <div className="mt-3 flex gap-2"><Seg on={sort === "new"} onClick={() => setSort("new")}>Newest</Seg><Seg on={sort === "urgent"} onClick={() => setSort("urgent")}>🔥 Most urgent first</Seg></div>
      </Panel>
      <Panel title="🆘 Need it fast?" hint="Tap the item — we'll post the SOS">
        <div className="grid grid-cols-4 gap-2">
          {PICKS.borrow.map((x) => { const [e, ...r] = x.split(" "); return (
            <button key={x} onClick={() => quick({ pick: x, urgency: "Right now" })} className="flex flex-col items-center gap-1 rounded-2xl border border-border/50 bg-background/70 p-2 active:scale-95"><span className="text-2xl">{e}</span><span className="text-[0.62rem] font-semibold leading-tight">{r.join(" ")}</span></button>
          ); })}
        </div>
      </Panel>
    </section>
  );

  if (k === "gig") {
    const offers = posts.filter((p) => p.payload?.mode !== "hire"); const hires = posts.length - offers.length;
    const priced = offers.map((p) => Number(p.payload?.price)).filter((x) => x > 0);
    const avg = priced.length ? Math.round(priced.reduce((a, b) => a + b, 0) / priced.length) : null;
    return (
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <Panel title="💼 Gig market">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-background/70 border border-border/50 p-3"><p className="font-serif text-2xl font-bold">{offers.length}</p><p className="text-[0.65rem]">offering</p></div>
            <div className="rounded-2xl bg-background/70 border border-border/50 p-3"><p className="font-serif text-2xl font-bold">{hires}</p><p className="text-[0.65rem]">hiring</p></div>
            <div className={`rounded-2xl ${m.soft} p-3`}><p className={`font-serif text-2xl font-bold ${m.text}`}>{avg ? `₹${avg}` : "—"}</p><p className="text-[0.65rem]">avg price</p></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Seg on={sub === ""} onClick={() => setSub("")}>All</Seg><Seg on={sub === "offer"} onClick={() => setSub("offer")}>🙋 Offering</Seg><Seg on={sub === "hire"} onClick={() => setSub("hire")}>🔎 Hiring</Seg>
            <Seg on={sort === "price"} onClick={() => setSort(sort === "price" ? "new" : "price")}>₹ Cheapest first</Seg>
          </div>
        </Panel>
        <Panel title="💸 What can you earn from?" hint="Tap a skill to offer it">
          <div className="grid grid-cols-2 gap-2">
            {PICKS.gigCat.map((x) => <button key={x} onClick={() => quick({ pick: x, mode: "offer" })} className="rounded-2xl border border-border/50 bg-background/70 px-3 py-2 text-left text-sm font-medium active:scale-95">{x}</button>)}
          </div>
        </Panel>
      </section>
    );
  }

  if (k === "creator") {
    const plats = ["Instagram", "YouTube", "Snapchat", "LinkedIn"];
    return (
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <Panel title="📱 Browse by platform">
          <div className="grid grid-cols-2 gap-2">
            {tally(plats).map(([pf, n]) => (
              <button key={pf} onClick={() => toggle(pf)} className={`rounded-2xl border p-3 text-left transition ${sub === pf ? `${m.bg} text-primary-foreground border-transparent` : `${m.soft} ${m.border}`}`}>
                <p className="text-sm font-bold">{pf}</p><p className="text-[0.65rem] opacity-80">{n} looking</p>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="🎬 I need a…" hint="Post the role in one tap">
          <div className="flex flex-wrap gap-2">
            {PICKS.creatorNeed.map((x) => <button key={x} onClick={() => quick({ pick: x })} className="rounded-full border border-border/50 bg-background/70 px-3 py-1.5 text-xs font-semibold active:scale-95">{x}</button>)}
          </div>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">💡 Paid fest coverage pays ₹2,000–₹8,000 — team up to pitch clubs together.</p>
        </Panel>
      </section>
    );
  }

  // ride
  const dests = PLACES.filter((x) => x !== "NIU Campus");
  const share = fare && ppl > 0 ? Math.ceil(Number(fare) / ppl) : null;
  return (
    <section className="mt-4 grid gap-3 md:grid-cols-[1.3fr_1fr]">
      <Panel title="🗺️ Route board" hint="Where people are heading">
        <div className="space-y-1.5">
          {tally(dests).map(([dst, n]) => (
            <button key={dst} onClick={() => toggle(dst)} className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition ${sub === dst ? `${m.soft} ${m.border}` : "border-border/40 bg-background/60"}`}>
              <span className="text-muted-foreground">NIU</span><span className={`h-px flex-1 border-t-2 border-dashed ${m.border}`} /><span className="font-semibold">{dst}</span>
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${n ? `${m.bg} text-primary-foreground` : "bg-muted/50 text-muted-foreground"}`}>{n}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2"><Seg on={sort === "new"} onClick={() => setSort("new")}>Newest</Seg><Seg on={sort === "cheap"} onClick={() => setSort("cheap")}>₹ Cheapest per head</Seg></div>
      </Panel>
      <Panel title="🧮 Fare splitter">
        <Input inputMode="numeric" placeholder="Total fare ₹" value={fare} onChange={(e) => setFare(e.target.value.replace(/\D/g, ""))} className="rounded-2xl" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">People sharing</span>
          <div className="flex items-center gap-2"><Seg on={false} onClick={() => setPpl(Math.max(1, ppl - 1))}>−</Seg><span className="w-5 text-center font-bold">{ppl}</span><Seg on={false} onClick={() => setPpl(Math.min(6, ppl + 1))}>+</Seg></div>
        </div>
        <div className={`mt-3 rounded-2xl ${m.soft} p-4 text-center`}><p className={`font-serif text-3xl font-bold ${m.text}`}>{share ? `₹${share}` : "₹—"}</p><p className="text-[0.7rem] text-muted-foreground">each pays</p></div>
        <Button className={`mt-3 w-full rounded-2xl ${m.bg} text-primary-foreground hover:opacity-90`} onClick={() => quick({ fare, seats: Math.max(1, ppl - 1) })}>Post this ride</Button>
      </Panel>
    </section>
  );
};

const ModeHero = ({ k, count, onPost, onBack }: { k: Kind; count: number; onPost: () => void; onBack: () => void }) => {
  const m = MODES[k]; const info = MODE_INFO[k];
  return (
    <section className={`relative overflow-hidden rounded-[2rem] border ${m.border} ${m.soft} p-5 sm:p-8`}>
      <div className={`pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full ${m.bg} opacity-20 blur-3xl`} />
      <span className="pointer-events-none absolute -right-4 -bottom-8 text-[9rem] leading-none opacity-15 select-none">{m.emoji}</span>
      <div className="relative">
        <button onClick={onBack} className="text-xs font-semibold text-muted-foreground hover:text-foreground">← All live modes</button>
        <div className="mt-3 flex items-center gap-3">
          <span className={`grid h-14 w-14 place-items-center rounded-2xl ${m.bg} text-3xl shadow-lg`}>{m.emoji}</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${m.text}`}>{m.label}</p>
            <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{count}</span> {info.stat}</p>
          </div>
        </div>
        <h1 className="mt-4 font-serif text-3xl sm:text-5xl font-bold leading-tight">{info.title}<br /><span className={`italic ${m.text}`}>{info.accent}</span></h1>
        <ol className="mt-5 grid gap-2 sm:grid-cols-3">
          {info.steps.map(([e, s], i) => (
            <li key={s} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/70 p-3 backdrop-blur">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.bg} text-xs font-bold text-primary-foreground`}>{i + 1}</span>
              <span className="text-sm"><span className="mr-1">{e}</span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={onPost} className={`h-11 rounded-2xl px-6 font-semibold ${m.bg} text-primary-foreground hover:opacity-90`}><Plus className="mr-1 h-4 w-4" />Post in {m.label}</Button>
          <p className="text-xs text-muted-foreground">🛡️ {info.tip}</p>
        </div>
      </div>
    </section>
  );
};

const SPOTS = ["Main Canteen", "Nescafe", "Amul Parlour", "Hostel Mess", "Maggi Point", "Library", "Main Ground"];
const PLACES = ["NIU Campus", "Pari Chowk", "KP-II Metro", "Alpha 1", "Boys Hostel", "Girls Hostel", "Delhi", "Noida Sec 18"];
const PICKS = {
  radar: ["🏏 Cricket", "🎮 Gaming", "☕ Chai break", "📚 Group study", "🎸 Jam session", "🚶 Evening walk", "🏸 Badminton", "🎬 Movie plan"],
  borrow: ["🔌 Charger", "🥼 Lab coat", "🧮 Calculator", "📐 Drafter", "☂️ Umbrella", "👔 Iron", "🎧 Earphones", "💊 Medicine"],
  gigCat: ["🎨 Design", "💻 Coding", "🎥 Video edit", "📝 Notes", "👩‍🏫 Tutoring", "📸 Photography", "✍️ Assignment help", "🎤 Anchoring"],
  creatorNeed: ["Reel partner", "Video editor", "Photographer", "Model", "Scriptwriter", "Voiceover"],
};
const BAD = /\b(f+u+c+k+\w*|bc|mc|bsdk|chutiya|madarchod|bhenchod|randi|gandu|sex|nude)\b/i;

const ago = (d: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};
const left = (p: any) => {
  if (!p.expires_at) return null;
  const total = new Date(p.expires_at).getTime() - new Date(p.created_at).getTime();
  const rem = new Date(p.expires_at).getTime() - Date.now();
  const mins = Math.max(0, Math.round(rem / 60000));
  return { pct: Math.max(0, Math.min(100, (rem / total) * 100)), label: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins}m left` };
};
const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();

const Chip = ({ on, onClick, children, k }: { on: boolean; onClick: () => void; children: React.ReactNode; k: Kind }) => (
  <button type="button" onClick={onClick}
    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${on ? `${MODES[k].bg} text-primary-foreground border-transparent shadow-sm` : "bg-background/70 border-border/60 hover:border-foreground/30"}`}>
    {children}
  </button>
);

const emptyDraft = () => ({ pick: "", spot: "", when: "Right now", who: "Anyone", size: 2, from: "NIU Campus", to: "Pari Chowk", seats: 3, fare: "", price: "", mode: "offer", platform: "Instagram", handle: "", reward: "", urgency: "Right now", note: "", title: "" });

const CampusHub = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Kind | "all" | "mine") || "all";
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [sub, setSub] = useState<string>(""); // mode-specific filter (spot, route, platform…)
  const [sort, setSort] = useState<string>("new");
  useEffect(() => { setSub(""); setSort("new"); }, [tab]);
  const [open, setOpen] = useState(false);
  const [composeKind, setComposeKind] = useState<Kind>("radar");
  const [d, setD] = useState(emptyDraft());
  const [chat, setChat] = useState<{ post: any; responderId: string; otherName: string } | null>(null);
  const set = (patch: Partial<ReturnType<typeof emptyDraft>>) => setD((x) => ({ ...x, ...patch }));

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { setUserId(data.user?.id ?? null); setAuthReady(true); }); }, []);

  const load = async () => {
    const { data } = await db.from("campus_posts").select("*").neq("status", "closed").order("created_at", { ascending: false }).limit(150);
    const live = (data || []).filter((p: any) => !p.expires_at || new Date(p.expires_at) > new Date());
    const ids = live.map((p: any) => p.id);
    const r = ids.length ? await db.from("campus_post_responses").select("*").in("post_id", ids) : { data: [] };
    const uids = [...new Set([...live.map((p: any) => p.user_id), ...(r.data || []).map((x: any) => x.user_id)])] as string[];
    const pr = uids.length ? await supabase.from("profiles").select("id, full_name").in("id", uids) : { data: [] as any[] };
    setPosts(live); setResponses(r.data || []);
    setNames(Object.fromEntries((pr.data || []).map((p: any) => [p.id, p.full_name || "NIU student"])));
    setLoading(false);
  };
  useEffect(() => {
    if (!userId) { if (authReady) setLoading(false); return; }
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    let t: ReturnType<typeof setTimeout> | undefined;
    const reload = () => { clearTimeout(t); t = setTimeout(load, 400); };
    const ch = supabase
      .channel("campus-hub-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "campus_posts" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "campus_post_responses" }, reload)
      .subscribe();
    return () => { window.removeEventListener("focus", onFocus); clearTimeout(t); supabase.removeChannel(ch); };
  }, [userId, authReady]);

  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k, posts.filter((p) => p.kind === k).length])) as Record<Kind, number>, [posts]);
  const peopleOut = useMemo(() => new Set([...posts.map((p) => p.user_id), ...responses.map((r) => r.user_id)]).size, [posts, responses]);

  const visible = useMemo(() => {
    let list = posts;
    if (tab === "mine") list = posts.filter((p) => p.user_id === userId || responses.some((r) => r.post_id === p.id && r.user_id === userId));
    else if (tab !== "all") list = posts.filter((p) => p.kind === tab);
    if (sub && isKind(tab)) list = list.filter((p) => subKey(p) === sub);
    if (tab === "borrow" && sort === "urgent") list = [...list].sort((a, b) => urgRank(a) - urgRank(b));
    if (tab === "gig" && sort === "price") list = [...list].sort((a, b) => (Number(a.payload?.price) || 9e9) - (Number(b.payload?.price) || 9e9));
    if (tab === "ride" && sort === "cheap") list = [...list].sort((a, b) => perHead(a) - perHead(b));
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((p) => `${p.title} ${p.body || ""} ${p.location || ""}`.toLowerCase().includes(s));
    return list;
  }, [posts, responses, tab, q, userId, sub, sort]);

  const openCompose = (k: Kind, patch: Partial<ReturnType<typeof emptyDraft>> = {}) => { setComposeKind(k); setD({ ...emptyDraft(), ...patch }); setOpen(true); };

  const build = () => {
    const k = composeKind;
    const p: any = {};
    let title = d.title.trim(), location = "";
    if (k === "radar") { if (!d.pick && !title) return null; title ||= d.pick; location = d.spot; p.when = d.when; }
    if (k === "food") { if (!d.spot) return null; title ||= `Lunch at ${d.spot}`; location = d.spot; Object.assign(p, { when: d.when, who: d.who, size: d.size }); }
    if (k === "borrow") { if (!d.pick && !title) return null; title ||= `Need a ${d.pick.replace(/^\S+\s/, "")}`; location = d.spot; Object.assign(p, { urgency: d.urgency, reward: d.reward }); }
    if (k === "gig") { if (!d.pick && !title) return null; title ||= `${d.mode === "offer" ? "I can do" : "Looking for"} ${d.pick.replace(/^\S+\s/, "")}`; Object.assign(p, { mode: d.mode, category: d.pick, price: d.price }); }
    if (k === "creator") { if (!d.pick && !title) return null; title ||= `Need a ${d.pick.toLowerCase()}`; Object.assign(p, { platform: d.platform, handle: d.handle, need: d.pick }); }
    if (k === "ride") { if (d.from === d.to) return null; title ||= `${d.from} → ${d.to}`; location = d.from; Object.assign(p, { from: d.from, to: d.to, seats: d.seats, fare: d.fare, when: d.when }); }
    return { title, location, payload: p };
  };

  const submit = async () => {
    if (busy || !userId) return;
    const b = build();
    if (!b) return toast.error("Pick the options above first");
    if (BAD.test(`${b.title} ${d.note}`)) return toast.error("Keep it friendly — that wording isn't allowed");
    setBusy(true);
    const hrs = MODES[composeKind].hours;
    const { error } = await db.from("campus_posts").insert({
      user_id: userId, kind: composeKind, title: b.title.slice(0, 120), body: d.note.trim().slice(0, 400) || null,
      location: b.location || null, payload: b.payload, expires_at: hrs ? new Date(Date.now() + hrs * 3600000).toISOString() : null,
    });
    setBusy(false);
    if (error) return toast.error("Couldn't post, try again");
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
    toast.success("You're live on campus!");
    setOpen(false);
    setParams({ tab: composeKind });
    load();
  };

  const respond = async (postId: string) => {
    if (busy) return;
    setBusy(true);
    const { error } = await db.from("campus_post_responses").insert({ post_id: postId, user_id: userId });
    setBusy(false);
    if (error) return toast.error("You already sent a request");
    toast.success("Request sent — they'll see your name");
    load();
  };
  const withdraw = async (postId: string) => { await db.from("campus_post_responses").delete().eq("post_id", postId).eq("user_id", userId); load(); };
  const accept = async (post: any, uid: string) => {
    const acc = [...new Set([...(post.payload?.accepted || []), uid])];
    const seats = post.kind === "ride" ? post.payload?.seats : post.kind === "food" ? post.payload?.size : 1;
    const full = acc.length >= (seats || 1);
    await db.from("campus_posts").update({ payload: { ...post.payload, accepted: acc }, status: full ? "claimed" : "open" }).eq("id", post.id);
    toast.success(`${names[uid] || "Student"} accepted`);
    load();
  };
  const close = async (id: string) => { await db.from("campus_posts").update({ status: "closed" }).eq("id", id); toast("Post closed"); load(); };

  if (authReady && !userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <div className="grid grid-cols-3 gap-3 mb-8">{KINDS.map((k) => <div key={k} className={`rounded-3xl ${MODES[k].soft} p-5 text-3xl`}>{MODES[k].emoji}</div>)}</div>
        <h1 className="font-serif text-4xl font-bold">Campus Hub</h1>
        <p className="mt-3 text-muted-foreground">Hangouts, food buddies, borrow SOS, gigs, creator collabs and ride shares — only for NIU students.</p>
        <Button className="mt-6 rounded-2xl h-12 px-8" onClick={() => navigate("/auth")}>Sign in to join</Button>
      </div>
    );
  }

  const Mode = MODES[composeKind];

  return (
    <div className="mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pt-8">
      {isKind(tab) ? (
        <ModeHero k={tab} count={counts[tab]} onPost={() => openCompose(tab)} onBack={() => setParams({ tab: "all" })} />
      ) : (<>
      <section className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/70 backdrop-blur-xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full bg-mode-food/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-mode-radar/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/70 border border-border/50 px-3 py-1 text-xs font-semibold">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
              NIU is live
            </span>
            <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-bold leading-tight">What's happening<br /><span className="italic text-primary">on campus</span> right now</h1>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-background/70 border border-border/50 px-4 py-3 text-center"><p className="font-serif text-3xl font-bold">{posts.length}</p><p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">live pings</p></div>
            <div className="rounded-2xl bg-background/70 border border-border/50 px-4 py-3 text-center"><p className="font-serif text-3xl font-bold">{peopleOut}</p><p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">students out</p></div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {KINDS.map((k) => {
          const m = MODES[k];
          return (
            <button key={k} onClick={() => setParams({ tab: k })}
              className={`group relative overflow-hidden text-left rounded-3xl border ${m.border} ${m.soft} p-4 sm:p-5 transition hover:-translate-y-0.5 active:scale-[0.98]`}>
              <div className="flex items-start justify-between">
                <span className="text-3xl sm:text-4xl transition group-hover:scale-110">{m.emoji}</span>
                {counts[k] > 0 && <span className={`rounded-full ${m.bg} text-primary-foreground px-2 py-0.5 text-[0.65rem] font-bold`}>{counts[k]} live</span>}
              </div>
              <p className="mt-3 font-serif text-lg sm:text-xl font-bold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.tag}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${m.text}`}>Open →</span>
            </button>
          );
        })}
      </section>
      </>)}

      {isKind(tab) && (
        <ModeTools k={tab} posts={posts.filter((p) => p.kind === tab)} sub={sub} setSub={setSub} sort={sort} setSort={setSort}
          quick={(patch) => openCompose(tab, patch)} />
      )}

      {/* Filters */}
      <section className="sticky top-14 z-20 mt-6 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", ...KINDS, "mine"] as const).map((t) => (
            <button key={t} onClick={() => setParams({ tab: t })}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-foreground text-background border-foreground" : "bg-card/60 border-border/50"}`}>
              {t === "all" ? "✨ All" : t === "mine" ? "🙋 My activity" : `${MODES[t].emoji} ${MODES[t].label}`}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pings, spots, skills…" className="pl-9 rounded-2xl bg-card/60" />
        </div>
      </section>

      {/* Feed */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 rounded-3xl bg-card/60 animate-pulse" />)
        : visible.length === 0 ? (
          <div className="sm:col-span-2 rounded-3xl border border-dashed border-border/60 p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-serif text-xl font-bold">{tab === "mine" ? "You haven't joined anything yet" : "Quiet right now…"}</p>
            <p className="text-sm text-muted-foreground mt-1">Start something — the first ping always gets the most replies.</p>
            <Button className="mt-5 rounded-2xl" onClick={() => openCompose(tab !== "all" && tab !== "mine" ? tab : "food")}><Plus className="mr-1 h-4 w-4" />Start a ping</Button>
          </div>
        ) : visible.map((p) => {
          const m = MODES[p.kind as Kind];
          const resp = responses.filter((r) => r.post_id === p.id);
          const mine = p.user_id === userId;
          const myResp = resp.find((r) => r.user_id === userId);
          const accepted: string[] = p.payload?.accepted || [];
          const amAccepted = accepted.includes(userId!);
          const t = left(p);
          const pl = p.payload || {};
          const author = names[p.user_id] || "NIU student";
          return (
            <article key={p.id} className={`relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl p-4 sm:p-5 shadow-sm`}>
              <div className={`absolute inset-x-0 top-0 h-1 ${m.bg}`} />
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 shrink-0 rounded-2xl ${m.soft} ${m.text} grid place-items-center text-sm font-bold`}>{initials(author)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{mine ? "You" : author}</p>
                  <p className="text-[0.7rem] text-muted-foreground">{ago(p.created_at)}</p>
                </div>
                <span className={`rounded-full ${m.soft} ${m.text} px-2.5 py-1 text-[0.65rem] font-bold`}>{m.emoji} {m.label}</span>
              </div>

              {p.kind === "ride" ? (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 rounded-2xl bg-background/70 border border-border/50 p-2.5"><p className="text-[0.6rem] uppercase text-muted-foreground">From</p><p className="text-sm font-bold">{pl.from}</p></div>
                  <ArrowRight className={`h-5 w-5 shrink-0 ${m.text}`} />
                  <div className="flex-1 rounded-2xl bg-background/70 border border-border/50 p-2.5"><p className="text-[0.6rem] uppercase text-muted-foreground">To</p><p className="text-sm font-bold">{pl.to}</p></div>
                </div>
              ) : (
                <h3 className="mt-3 font-serif text-xl font-bold leading-snug">{p.title}</h3>
              )}
              {p.body && <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>}

              <div className="mt-3 flex flex-wrap gap-1.5 text-[0.7rem] font-medium">
                {p.location && p.kind !== "ride" && <span className="inline-flex items-center gap-1 rounded-full bg-background/80 border border-border/50 px-2.5 py-1"><MapPin className="h-3 w-3" />{p.location}</span>}
                {pl.when && <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1">🕐 {pl.when}</span>}
                {pl.who && <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1">👥 {pl.who}</span>}
                {pl.urgency && <span className="rounded-full bg-destructive/10 text-destructive px-2.5 py-1 font-bold">⚡ {pl.urgency}</span>}
                {pl.reward && <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1">🎁 {pl.reward}</span>}
                {p.kind === "gig" && <span className={`rounded-full ${m.bg} text-primary-foreground px-2.5 py-1 font-bold`}>{pl.mode === "hire" ? "Hiring" : "Offering"}{pl.price ? ` · ₹${pl.price}` : ""}</span>}
                {p.kind === "creator" && <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1">📱 {pl.platform}{pl.handle ? ` · ${pl.handle}` : ""}</span>}
                {p.kind === "ride" && <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1">💺 {Math.max(0, (pl.seats || 1) - accepted.length)} of {pl.seats} seats left</span>}
                {p.kind === "ride" && pl.fare && <span className={`rounded-full ${m.bg} text-primary-foreground px-2.5 py-1 font-bold`}>≈ ₹{Math.ceil(Number(pl.fare) / ((pl.seats || 1) + 1))}/head</span>}
                {p.kind === "food" && <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1">🪑 {accepted.length + 1}/{(pl.size || 1) + 1} at table</span>}
              </div>

              {t && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden"><div className={`h-full ${m.bg} transition-all`} style={{ width: `${t.pct}%` }} /></div>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{t.label}</p>
                </div>
              )}

              {/* Actions */}
              {mine ? (
                <div className="mt-4 rounded-2xl bg-background/60 border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold flex items-center gap-1"><Users className="h-3.5 w-3.5" />{resp.length ? `${resp.length} request${resp.length > 1 ? "s" : ""}` : "Waiting for replies…"}</p>
                    <button onClick={() => close(p.id)} className="text-[0.7rem] font-semibold text-muted-foreground hover:text-destructive">Close post</button>
                  </div>
                  {resp.map((r) => (
                    <div key={r.id} className="mt-2 flex items-center justify-between">
                      <span className="text-sm">{names[r.user_id] || "NIU student"}</span>
                      {accepted.includes(r.user_id)
                        ? <Button size="sm" className="h-7 rounded-xl text-xs" onClick={() => setChat({ post: p, responderId: r.user_id, otherName: names[r.user_id] || "NIU student" })}><MessageCircle className="mr-1 h-3.5 w-3.5" />Chat</Button>
                        : <Button size="sm" variant="outline" className="h-7 rounded-xl text-xs" onClick={() => accept(p, r.user_id)}>Accept</Button>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex -space-x-2">
                    {resp.slice(0, 4).map((r) => <div key={r.id} className={`h-7 w-7 rounded-full border-2 border-card ${m.soft} ${m.text} grid place-items-center text-[0.6rem] font-bold`}>{initials(names[r.user_id] || "S")}</div>)}
                    {resp.length > 0 && <span className="pl-3 self-center text-[0.7rem] text-muted-foreground">{resp.length} in</span>}
                  </div>
                  {amAccepted ? (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">✅ Confirmed</span>
                      <Button size="sm" className="h-7 rounded-xl text-xs" onClick={() => setChat({ post: p, responderId: userId!, otherName: names[p.user_id] || "NIU student" })}><MessageCircle className="mr-1 h-3.5 w-3.5" />Chat</Button>
                    </div>
                  ) : myResp ? (
                    <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => withdraw(p.id)}><X className="mr-1 h-3.5 w-3.5" />Requested</Button>
                  ) : p.status === "claimed" ? (
                    <span className="text-xs font-semibold text-muted-foreground">Full</span>
                  ) : (
                    <Button size="sm" disabled={busy} onClick={() => respond(p.id)} className={`rounded-xl ${m.bg} text-primary-foreground hover:opacity-90`}>{m.cta}</Button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5" />Verified NIU students only · Meet in public spots · Close posts anytime</p>

      {/* Floating create */}
      <button onClick={() => openCompose(tab !== "all" && tab !== "mine" ? tab : "radar")} aria-label="New ping"
        className="fixed bottom-24 right-5 md:bottom-8 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center active:scale-90 transition">
        <Plus className="h-6 w-6" />
      </button>

      {/* Composer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="mx-auto w-full max-w-lg overflow-y-auto px-4 pb-6">
            <DrawerHeader className="px-0">
              <DrawerTitle className="font-serif text-2xl">{Mode.emoji} {Mode.label}</DrawerTitle>
              <p className="text-sm text-muted-foreground">{Mode.tag}{Mode.hours ? ` · disappears in ${Mode.hours}h` : ""}</p>
            </DrawerHeader>
            <div className="flex gap-1.5 overflow-x-auto pb-3 no-scrollbar">
              {KINDS.map((k) => <Chip key={k} k={k} on={composeKind === k} onClick={() => { setComposeKind(k); setD(emptyDraft()); }}>{MODES[k].emoji} {MODES[k].label}</Chip>)}
            </div>

            <div className="space-y-4">
              {composeKind === "radar" && (<>
                <Field label="What's the plan?">{PICKS.radar.map((x) => <Chip key={x} k="radar" on={d.pick === x} onClick={() => set({ pick: x })}>{x}</Chip>)}</Field>
                <Field label="Where?">{SPOTS.map((x) => <Chip key={x} k="radar" on={d.spot === x} onClick={() => set({ spot: x })}>{x}</Chip>)}</Field>
                <Field label="When?">{["Right now", "In 15 mins", "In 30 mins", "In 1 hour"].map((x) => <Chip key={x} k="radar" on={d.when === x} onClick={() => set({ when: x })}>{x}</Chip>)}</Field>
              </>)}
              {composeKind === "food" && (<>
                <Field label="Which spot?">{SPOTS.slice(0, 5).map((x) => <Chip key={x} k="food" on={d.spot === x} onClick={() => set({ spot: x })}>{x}</Chip>)}</Field>
                <Field label="When?">{["Right now", "In 15 mins", "1:00 PM", "1:30 PM", "Dinner 8 PM"].map((x) => <Chip key={x} k="food" on={d.when === x} onClick={() => set({ when: x })}>{x}</Chip>)}</Field>
                <Field label="Who can join?">{["Anyone", "Girls only", "Boys only"].map((x) => <Chip key={x} k="food" on={d.who === x} onClick={() => set({ who: x })}>{x}</Chip>)}</Field>
                <Field label="Empty seats">{[1, 2, 3, 4].map((x) => <Chip key={x} k="food" on={d.size === x} onClick={() => set({ size: x })}>{x}</Chip>)}</Field>
              </>)}
              {composeKind === "borrow" && (<>
                <Field label="What do you need?">{PICKS.borrow.map((x) => <Chip key={x} k="borrow" on={d.pick === x} onClick={() => set({ pick: x })}>{x}</Chip>)}</Field>
                <Field label="How urgent?">{["Right now", "Within 1 hour", "Today"].map((x) => <Chip key={x} k="borrow" on={d.urgency === x} onClick={() => set({ urgency: x })}>{x}</Chip>)}</Field>
                <Field label="Where are you?">{SPOTS.map((x) => <Chip key={x} k="borrow" on={d.spot === x} onClick={() => set({ spot: x })}>{x}</Chip>)}</Field>
                <Input placeholder="Thank-you reward (e.g. a coffee ☕)" value={d.reward} onChange={(e) => set({ reward: e.target.value })} />
              </>)}
              {composeKind === "gig" && (<>
                <Field label="I want to…"><Chip k="gig" on={d.mode === "offer"} onClick={() => set({ mode: "offer" })}>💼 Offer a skill</Chip><Chip k="gig" on={d.mode === "hire"} onClick={() => set({ mode: "hire" })}>🔍 Hire someone</Chip></Field>
                <Field label="Category">{PICKS.gigCat.map((x) => <Chip key={x} k="gig" on={d.pick === x} onClick={() => set({ pick: x })}>{x}</Chip>)}</Field>
                <Input inputMode="numeric" placeholder={d.mode === "offer" ? "Your price (₹)" : "Budget (₹)"} value={d.price} onChange={(e) => set({ price: e.target.value.replace(/\D/g, "") })} />
              </>)}
              {composeKind === "creator" && (<>
                <Field label="Looking for">{PICKS.creatorNeed.map((x) => <Chip key={x} k="creator" on={d.pick === x} onClick={() => set({ pick: x })}>{x}</Chip>)}</Field>
                <Field label="Platform">{["Instagram", "YouTube", "LinkedIn", "Snapchat"].map((x) => <Chip key={x} k="creator" on={d.platform === x} onClick={() => set({ platform: x })}>{x}</Chip>)}</Field>
                <Input placeholder="Your handle (e.g. @harshit.shoots)" value={d.handle} onChange={(e) => set({ handle: e.target.value })} />
              </>)}
              {composeKind === "ride" && (<>
                <Field label="From">{PLACES.map((x) => <Chip key={x} k="ride" on={d.from === x} onClick={() => set({ from: x })}>{x}</Chip>)}</Field>
                <Field label="To">{PLACES.map((x) => <Chip key={x} k="ride" on={d.to === x} onClick={() => set({ to: x })}>{x}</Chip>)}</Field>
                <Field label="When?">{["Right now", "In 30 mins", "Evening 5 PM", "Tonight", "Tomorrow morning"].map((x) => <Chip key={x} k="ride" on={d.when === x} onClick={() => set({ when: x })}>{x}</Chip>)}</Field>
                <Field label="Seats free">{[1, 2, 3, 4].map((x) => <Chip key={x} k="ride" on={d.seats === x} onClick={() => set({ seats: x })}>{x}</Chip>)}</Field>
                <Input inputMode="numeric" placeholder="Total fare (₹) — we'll split it" value={d.fare} onChange={(e) => set({ fare: e.target.value.replace(/\D/g, "") })} />
                {d.fare && <p className={`text-sm font-bold ${Mode.text}`}>≈ ₹{Math.ceil(Number(d.fare) / (d.seats + 1))} per person</p>}
              </>)}

              <Textarea rows={2} maxLength={400} placeholder="Add a note (optional)" value={d.note} onChange={(e) => set({ note: e.target.value })} />
              <Button onClick={submit} disabled={busy} className={`w-full h-12 rounded-2xl text-base font-bold ${Mode.bg} text-primary-foreground hover:opacity-90`}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Go live {Mode.emoji}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      {chat && userId && (
        <CampusChat
          open={!!chat}
          onOpenChange={(v) => { if (!v) setChat(null); }}
          postId={chat.post.id}
          postTitle={chat.post.title}
          posterId={chat.post.user_id}
          responderId={chat.responderId}
          meId={userId}
          otherName={chat.otherName}
        />
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div className="flex flex-wrap gap-1.5">{children}</div></div>
);

export default CampusHub;
