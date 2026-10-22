import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, Plus, Search, Check, X, ArrowRight, Users, Sparkles, Shield } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [composeKind, setComposeKind] = useState<Kind>("radar");
  const [d, setD] = useState(emptyDraft());
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
    return () => window.removeEventListener("focus", onFocus);
  }, [userId, authReady]);

  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k, posts.filter((p) => p.kind === k).length])) as Record<Kind, number>, [posts]);
  const peopleOut = useMemo(() => new Set([...posts.map((p) => p.user_id), ...responses.map((r) => r.user_id)]).size, [posts, responses]);

  const visible = useMemo(() => {
    let list = posts;
    if (tab === "mine") list = posts.filter((p) => p.user_id === userId || responses.some((r) => r.post_id === p.id && r.user_id === userId));
    else if (tab !== "all") list = posts.filter((p) => p.kind === tab);
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((p) => `${p.title} ${p.body || ""} ${p.location || ""}`.toLowerCase().includes(s));
    return list;
  }, [posts, responses, tab, q, userId]);

  const openCompose = (k: Kind) => { setComposeKind(k); setD(emptyDraft()); setOpen(true); };

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
    <div className="mx-auto max-w-5xl px-4 py-5 sm:py-10 pb-28">
      {/* Hero */}
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

      {/* Mode bento */}
      <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {KINDS.map((k, i) => {
          const m = MODES[k];
          return (
            <button key={k} onClick={() => openCompose(k)}
              className={`group relative overflow-hidden text-left rounded-3xl border ${m.border} ${m.soft} p-4 sm:p-5 transition hover:-translate-y-0.5 active:scale-[0.98] ${i === 0 ? "sm:row-span-1" : ""}`}>
              <div className="flex items-start justify-between">
                <span className="text-3xl sm:text-4xl transition group-hover:scale-110">{m.emoji}</span>
                {counts[k] > 0 && <span className={`rounded-full ${m.bg} text-primary-foreground px-2 py-0.5 text-[0.65rem] font-bold`}>{counts[k]} live</span>}
              </div>
              <p className="mt-3 font-serif text-lg sm:text-xl font-bold">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.tag}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${m.text}`}><Plus className="h-3.5 w-3.5" />Post</span>
            </button>
          );
        })}
      </section>

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
                        ? <span className="text-xs font-bold text-primary flex items-center gap-1"><Check className="h-3.5 w-3.5" />Accepted</span>
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
                    <span className="rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">✅ You're confirmed{p.location ? ` · ${p.location}` : ""}</span>
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
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div className="flex flex-wrap gap-1.5">{children}</div></div>
);

export default CampusHub;
