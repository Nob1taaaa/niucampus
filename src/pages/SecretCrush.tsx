import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Heart, Loader2, Lock, X, Copy, Shuffle, ShieldCheck, Sparkles, EyeOff } from "lucide-react";

const db = supabase as any;
const MAX = 3;

const OPENERS = [
  "So… the vault says we both had the same idea 👀",
  "Okay this is awkward-good. Nescafe at 5?",
  "I was today years old when I found out it's mutual 😄",
  "Plot twist: we both clicked. Coffee or chai?",
  "Our secret is out (only to us). Canteen after class?",
  "Rate my courage 1–10 for this message 😅",
  "Fun fact: you made my semester. Walk to Pari Chowk sometime?",
];
const TIPS = [
  "Be yourself — the vault only works if it's real.",
  "A mutual match is a door, not a promise. Start with a hi.",
  "Meet first in public spots: canteen, library, events.",
  "No reply in a day? It's okay. Respect the vibe.",
  "Compliment something they chose, not how they look.",
];
const initials = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
const vibeScore = (a: string, b: string) => {
  const s = (a + "♥" + b).toLowerCase().replace(/\s/g, "");
  let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return 55 + (h % 45);
};

const SecretCrush = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [crushes, setCrushes] = useState<any[]>([]);
  const [mutual, setMutual] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"vault" | "vibe" | "lines">("vault");
  const [matchModal, setMatchModal] = useState<any | null>(null);
  const [opener, setOpener] = useState(0);
  const [vA, setVA] = useState(""); const [vB, setVB] = useState(""); const [vRes, setVRes] = useState<number | null>(null);
  const [hidden, setHidden] = useState(true);
  const tip = TIPS[new Date().getDate() % TIPS.length];

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null); setReady(true);
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
        setMyName(p?.full_name || "");
      }
    });
  }, []);

  const load = async () => {
    const { data } = await db.from("secret_crushes").select("id, target_id, created_at").order("created_at");
    const ids = (data || []).map((c: any) => c.target_id);
    const { data: prof } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as any[] };
    const list = (data || []).map((c: any) => ({ ...c, name: prof?.find((p) => p.id === c.target_id)?.full_name || "NIU student" }));
    setCrushes(list);
    const { data: m } = await db.rpc("my_mutual_crushes");
    const mm: string[] = (m || []).map((r: any) => r.crush_id);
    const seenKey = `niu-crush-seen-${userId}`;
    const seen: string[] = JSON.parse(localStorage.getItem(seenKey) || "[]");
    const fresh = mm.find((id) => !seen.includes(id));
    if (fresh) {
      confetti({ particleCount: 140, spread: 100, colors: ["#f43f5e", "#fb7185", "#fda4af"] });
      setMatchModal(list.find((c: any) => c.target_id === fresh));
      localStorage.setItem(seenKey, JSON.stringify([...seen, fresh]));
    }
    setMutual(mm);
  };
  useEffect(() => { if (userId) load(); }, [userId]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").ilike("full_name", `%${q}%`).neq("id", userId!).limit(8);
      setResults(data || []); setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, userId]);

  const add = async (id: string) => {
    if (busy) return;
    if (crushes.length >= MAX) return toast.error(`Your vault holds ${MAX} names. Remove one first.`);
    setBusy(id);
    const { error } = await db.from("secret_crushes").insert({ admirer_id: userId, target_id: id });
    setBusy(null);
    if (error) return toast.error("Already in your vault");
    setQuery(""); setResults([]);
    toast.success("Locked in secretly 🔒");
    load();
  };
  const remove = async (id: string) => {
    if (busy) return; setBusy(id);
    await db.from("secret_crushes").delete().eq("id", id);
    setBusy(null); load();
  };
  const copy = (t: string) => { navigator.clipboard?.writeText(t); toast.success("Copied — go say hi 💌"); };

  const matches = useMemo(() => crushes.filter((c) => mutual.includes(c.target_id)), [crushes, mutual]);
  const added = new Set(crushes.map((c) => c.target_id));

  if (ready && !userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-[hsl(var(--mode-borrow))]" />
        <h1 className="mt-3 font-serif text-3xl font-bold">Secret Crush Vault</h1>
        <p className="mt-2 text-muted-foreground">Sign in to open your private vault.</p>
        <Button className="mt-6 rounded-2xl" onClick={() => navigate("/auth")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24 sm:py-10" style={{ ["--tone" as any]: "var(--mode-borrow)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--tone)/0.3)] bg-card/80 p-6 text-center backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[hsl(var(--tone)/0.25)] blur-[70px]" />
        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[hsl(var(--tone)/0.15)]">
            <Heart className="h-8 w-8 animate-pulse fill-[hsl(var(--tone))] text-[hsl(var(--tone))]" />
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold">Secret Crush Vault</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pick up to {MAX} people. Nobody sees your list — ever. Only if they pick you too, you both find out.</p>
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: MAX }).map((_, i) => (
              <Heart key={i} className={`h-6 w-6 transition-all ${i < crushes.length ? "fill-[hsl(var(--tone))] text-[hsl(var(--tone))] scale-110" : "text-muted-foreground/40"}`} />
            ))}
          </div>
          <p className="mt-1 text-[0.7rem] font-semibold text-muted-foreground">{MAX - crushes.length} slot{MAX - crushes.length === 1 ? "" : "s"} left · {matches.length} match{matches.length === 1 ? "" : "es"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-border/50 bg-card/60 p-1">
        {([["vault", "🔒 Vault"], ["vibe", "💞 Vibe check"], ["lines", "💬 Openers"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 text-xs font-bold transition-all ${tab === k ? "bg-[hsl(var(--tone))] text-primary-foreground shadow" : "text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      {tab === "vault" && (
        <>
          {matches.length > 0 && (
            <section className="mt-4 rounded-3xl border border-[hsl(var(--tone)/0.5)] bg-[hsl(var(--tone)/0.08)] p-4">
              <p className="font-serif text-lg font-bold">💘 Your matches</p>
              {matches.map((c) => (
                <div key={c.id} className="mt-2 flex items-center justify-between rounded-2xl bg-card/80 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--tone))] text-sm font-bold text-primary-foreground">{initials(c.name)}</div>
                    <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">It's mutual — {vibeScore(myName, c.name)}% vibe</p></div>
                  </div>
                  <Button size="sm" className="rounded-xl bg-[hsl(var(--tone))] text-primary-foreground hover:opacity-90" onClick={() => setMatchModal(c)}>Say hi</Button>
                </div>
              ))}
            </section>
          )}

          <section className="mt-4 rounded-3xl border border-border/50 bg-card/60 p-4 backdrop-blur-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Add someone</p>
            <div className="relative">
              <Input placeholder="Search a student by name…" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-2xl pr-9" />
              {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {query.trim().length >= 2 && !searching && results.length === 0 && <p className="mt-3 text-center text-xs text-muted-foreground">No student found with that name.</p>}
            {results.length > 0 && (
              <ul className="mt-2 divide-y divide-border/50">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[hsl(var(--tone)/0.15)] text-[0.65rem] font-bold text-[hsl(var(--tone))]">{initials(r.full_name || "S")}</div>
                      <span className="text-sm font-medium">{r.full_name}</span>
                    </div>
                    {added.has(r.id)
                      ? <span className="text-xs font-semibold text-muted-foreground">In vault</span>
                      : <Button size="sm" className="rounded-xl" disabled={!!busy} onClick={() => add(r.id)}>
                          {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="mr-1 h-3.5 w-3.5" />Add</>}
                        </Button>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg font-bold">Your vault</p>
              <button onClick={() => setHidden((h) => !h)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <EyeOff className="h-3.5 w-3.5" />{hidden ? "Show names" : "Hide names"}
              </button>
            </div>
            {crushes.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border p-6 text-center">
                <p className="text-3xl">🤫</p>
                <p className="mt-2 text-sm text-muted-foreground">Empty. Your secret is safe here.</p>
              </div>
            )}
            {crushes.map((c) => {
              const isMatch = mutual.includes(c.target_id);
              const days = Math.max(0, Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000));
              return (
                <div key={c.id} className={`flex items-center justify-between rounded-2xl border p-3 ${isMatch ? "border-[hsl(var(--tone))] bg-[hsl(var(--tone)/0.08)]" : "border-border/50 bg-card/70"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${isMatch ? "bg-[hsl(var(--tone))] text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {hidden && !isMatch ? "?" : initials(c.name)}
                    </div>
                    <div>
                      <p className={`font-semibold ${hidden && !isMatch ? "blur-sm select-none" : ""}`}>{c.name}</p>
                      <p className="text-xs text-muted-foreground">{isMatch ? "💘 It's mutual!" : `🔒 Locked ${days === 0 ? "today" : `${days}d ago`} · waiting`}</p>
                    </div>
                  </div>
                  <button aria-label="Remove" disabled={!!busy} onClick={() => remove(c.id)} className="p-1 text-muted-foreground hover:text-destructive">
                    {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </section>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[["🔒", "Add secretly"], ["🙈", "They never know"], ["💘", "Both pick = reveal"]].map(([e, t]) => (
              <div key={t} className="rounded-2xl border border-border/50 bg-card/60 p-3"><p className="text-2xl">{e}</p><p className="mt-1 text-[0.7rem] font-semibold">{t}</p></div>
            ))}
          </div>
        </>
      )}

      {tab === "vibe" && (
        <section className="mt-4 rounded-3xl border border-border/50 bg-card/70 p-5 text-center backdrop-blur-xl">
          <p className="font-serif text-xl font-bold">Vibe check 💞</p>
          <p className="mt-1 text-xs text-muted-foreground">Just for fun. Nothing is saved or shared.</p>
          <div className="mt-4 space-y-2">
            <Input placeholder="Your name" value={vA || myName} onChange={(e) => setVA(e.target.value)} className="rounded-2xl text-center" />
            <p className="text-xl">❤️</p>
            <Input placeholder="Their name" value={vB} onChange={(e) => setVB(e.target.value)} className="rounded-2xl text-center" />
          </div>
          <Button className="mt-4 w-full rounded-2xl bg-[hsl(var(--tone))] text-primary-foreground hover:opacity-90" disabled={!vB.trim()}
            onClick={() => { const s = vibeScore(vA || myName, vB); setVRes(s); if (s > 85) confetti({ particleCount: 80, spread: 70, colors: ["#f43f5e", "#fda4af"] }); }}>
            <Sparkles className="mr-2 h-4 w-4" />Check our vibe
          </Button>
          {vRes !== null && (
            <div className="mt-5">
              <p className="font-serif text-5xl font-extrabold text-[hsl(var(--tone))]">{vRes}%</p>
              <div className="mx-auto mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[hsl(var(--tone))] transition-all duration-700" style={{ width: `${vRes}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold">{vRes > 90 ? "Main character energy 🔥" : vRes > 78 ? "Strong vibes. Add them to the vault?" : vRes > 66 ? "Cute potential ✨" : "Friendship first 🤝"}</p>
            </div>
          )}
        </section>
      )}

      {tab === "lines" && (
        <section className="mt-4 space-y-2">
          <p className="px-1 text-xs text-muted-foreground">Got a match? Copy an opener and send it.</p>
          {OPENERS.map((o) => (
            <button key={o} onClick={() => copy(o)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 p-3.5 text-left text-sm transition-all hover:border-[hsl(var(--tone)/0.4)] active:scale-[0.98]">
              <span>{o}</span><Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </section>
      )}

      {/* Tip + safety */}
      <div className="mt-5 rounded-3xl border border-border/50 bg-card/60 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's tip</p>
        <p className="mt-1 text-sm">{tip}</p>
        <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Your list is private. Only mutual picks are ever revealed.</p>
      </div>

      {/* Match modal */}
      <Dialog open={!!matchModal} onOpenChange={(v) => !v && setMatchModal(null)}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="sr-only">It's a match</DialogTitle>
          <div className="mx-auto flex items-center justify-center -space-x-3">
            <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-background bg-primary text-lg font-bold text-primary-foreground">{initials(myName || "You")}</div>
            <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-background bg-[hsl(var(--mode-borrow))] text-lg font-bold text-primary-foreground">{initials(matchModal?.name || "?")}</div>
          </div>
          <p className="mt-3 font-serif text-3xl font-extrabold">It's a match! 💘</p>
          <p className="text-sm text-muted-foreground">You and <b>{matchModal?.name}</b> picked each other.</p>
          <div className="mt-4 rounded-2xl bg-muted/50 p-3 text-sm">{OPENERS[opener]}</div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setOpener((o) => (o + 1) % OPENERS.length)}><Shuffle className="mr-1.5 h-4 w-4" />Another</Button>
            <Button className="flex-1 rounded-2xl bg-[hsl(var(--mode-borrow))] text-primary-foreground hover:opacity-90" onClick={() => copy(OPENERS[opener])}><Copy className="mr-1.5 h-4 w-4" />Copy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecretCrush;
