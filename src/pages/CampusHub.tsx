import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, Trash2, Hand } from "lucide-react";

const db = supabase as any;

type Kind = "radar" | "food" | "borrow" | "gig" | "creator" | "ride";
const KINDS: { id: Kind; emoji: string; label: string; hint: string; cta: string; hours: number | null; extra?: string }[] = [
  { id: "radar", emoji: "📡", label: "Radar", hint: "What are you up to? e.g. Playing cricket at main ground", cta: "I'm in!", hours: 2 },
  { id: "food", emoji: "🍜", label: "Food Buddy", hint: "Eating alone? e.g. Lunch at Main Canteen, 1:30 PM", cta: "Join table", hours: 2, extra: "Who can join (Anyone / Boys / Girls)" },
  { id: "borrow", emoji: "🆘", label: "Borrow SOS", hint: "Need something fast? e.g. Lab coat for 2 hrs", cta: "I have it", hours: 6, extra: "Reward (optional)" },
  { id: "gig", emoji: "💸", label: "Gigs", hint: "Offer or hire a skill, e.g. Poster design", cta: "Interested", hours: null, extra: "Price (₹)" },
  { id: "creator", emoji: "🎬", label: "Creators", hint: "Find a collab, e.g. Need a reel partner", cta: "Let's collab", hours: null, extra: "Instagram handle" },
  { id: "ride", emoji: "🛺", label: "Ride Share", hint: "Going somewhere? e.g. Campus → Pari Chowk 5 PM", cta: "Join ride", hours: 12, extra: "Seats / cost split" },
];

const BAD = /\b(f+u+c+k+|bc|mc|bsdk|chutiya|madarchod|bhenchod|randi|gandu)\b/i;

const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

const CampusHub = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind = (params.get("tab") as Kind) || "radar";
  const meta = KINDS.find((k) => k.id === kind) || KINDS[0];
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", body: "", extra: "" });

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("campus_posts").select("*").eq("kind", kind).neq("status", "closed").order("created_at", { ascending: false }).limit(50);
    const live = (data || []).filter((p: any) => !p.expires_at || new Date(p.expires_at) > new Date());
    setPosts(live);
    const ids = live.map((p: any) => p.id);
    const uids = [...new Set(live.map((p: any) => p.user_id))];
    const [r, pr] = await Promise.all([
      ids.length ? db.from("campus_post_responses").select("*").in("post_id", ids) : { data: [] },
      uids.length ? supabase.from("profiles").select("id, full_name").in("id", uids as string[]) : { data: [] },
    ]);
    setResponses(r.data || []);
    setNames(Object.fromEntries((pr.data || []).map((p: any) => [p.id, p.full_name || "NIU student"])));
    setLoading(false);
  };

  useEffect(() => { if (userId) load(); else setLoading(false); }, [kind, userId]);

  const submit = async () => {
    if (busy || !userId) return;
    if (!form.title.trim()) return toast.error("Add a short title");
    if (BAD.test(`${form.title} ${form.body}`)) return toast.error("Please keep it friendly");
    setBusy(true);
    const { error } = await db.from("campus_posts").insert({
      user_id: userId, kind, title: form.title.trim().slice(0, 120), body: form.body.trim().slice(0, 500) || null,
      location: form.location.trim() || null, payload: form.extra ? { extra: form.extra.trim() } : {},
      expires_at: meta.hours ? new Date(Date.now() + meta.hours * 3600000).toISOString() : null,
    });
    setBusy(false);
    if (error) return toast.error("Couldn't post, try again");
    toast.success("Posted!");
    setForm({ title: "", location: "", body: "", extra: "" });
    load();
  };

  const respond = async (postId: string) => {
    if (busy) return;
    setBusy(true);
    const { error } = await db.from("campus_post_responses").insert({ post_id: postId, user_id: userId });
    setBusy(false);
    if (error) return toast.error("Already responded");
    toast.success("Sent! They can see you're in.");
    load();
  };

  const close = async (postId: string) => {
    await db.from("campus_posts").update({ status: "closed" }).eq("id", postId);
    load();
  };

  if (!userId && !loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold">Campus Hub</h1>
        <p className="mt-2 text-muted-foreground">Sign in with your NIU account to see what's happening.</p>
        <Button className="mt-6 rounded-2xl" onClick={() => navigate("/auth")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold">Campus Hub</h1>
      <p className="text-sm text-muted-foreground mt-1">Live pings from NIU students, right now.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => (
          <button key={k.id} onClick={() => setParams({ tab: k.id })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${k.id === kind ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 border-border/50"}`}>
            {k.emoji} {k.label}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 sm:p-5 space-y-3">
        <p className="font-serif text-lg font-bold">{meta.emoji} New {meta.label} post</p>
        <Input placeholder={meta.hint} value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Where? (public spot)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          {meta.extra && <Input placeholder={meta.extra} value={form.extra} onChange={(e) => setForm({ ...form, extra: e.target.value })} />}
        </div>
        <Textarea placeholder="Details (optional)" rows={2} maxLength={500} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{meta.hours ? `Disappears after ${meta.hours} hours` : "Stays until you close it"}</span>
          <Button onClick={submit} disabled={busy} className="rounded-2xl">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post</Button>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-3xl">{meta.emoji}</p>
            <p className="mt-2 font-semibold">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">Be the first — post above and your batch will see it.</p>
          </div>
        ) : posts.map((p) => {
          const resp = responses.filter((r) => r.post_id === p.id);
          const mine = p.user_id === userId;
          const joined = resp.some((r) => r.user_id === userId);
          return (
            <article key={p.id} className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{names[p.user_id] || "NIU student"} · {ago(p.created_at)}</p>
                </div>
                {mine && <button onClick={() => close(p.id)} aria-label="Close post" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div>
              {p.body && <p className="mt-2 text-sm">{p.body}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.location && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><MapPin className="h-3 w-3" />{p.location}</span>}
                {p.payload?.extra && <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">{p.payload.extra}</span>}
                {p.expires_at && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" />ends {new Date(p.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {resp.length} {resp.length === 1 ? "person" : "people"} in{mine && resp.length > 0 ? `: ${resp.map((r) => names[r.user_id] || "a student").join(", ")}` : ""}
                </span>
                {!mine && (
                  <Button size="sm" variant={joined ? "secondary" : "default"} disabled={joined || busy} onClick={() => respond(p.id)} className="rounded-xl">
                    <Hand className="mr-1 h-4 w-4" />{joined ? "Sent" : meta.cta}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </section>
      <p className="mt-6 text-center text-xs text-muted-foreground">Meet only in public spots on campus. Stay safe 💛</p>
    </div>
  );
};

export default CampusHub;
