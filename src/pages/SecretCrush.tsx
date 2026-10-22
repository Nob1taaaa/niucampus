import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Heart, Loader2, Lock, X } from "lucide-react";

const db = supabase as any;
const MAX = 3;

const SecretCrush = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [crushes, setCrushes] = useState<any[]>([]);
  const [mutual, setMutual] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { setUserId(data.user?.id ?? null); setReady(true); }); }, []);

  const load = async () => {
    const { data } = await db.from("secret_crushes").select("id, target_id");
    const ids = (data || []).map((c: any) => c.target_id);
    const { data: prof } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as any[] };
    setCrushes((data || []).map((c: any) => ({ ...c, name: prof?.find((p) => p.id === c.target_id)?.full_name || "NIU student" })));
    const { data: m } = await db.rpc("my_mutual_crushes");
    setMutual((m || []).map((r: any) => r.crush_id));
  };
  useEffect(() => { if (userId) load(); }, [userId]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").ilike("full_name", `%${q}%`).neq("id", userId!).limit(8);
      setResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [query, userId]);

  const add = async (id: string) => {
    if (busy) return;
    if (crushes.length >= MAX) return toast.error(`You can pick up to ${MAX} crushes`);
    setBusy(true);
    const { error } = await db.from("secret_crushes").insert({ admirer_id: userId, target_id: id });
    setBusy(false);
    if (error) return toast.error("Already in your vault");
    setQuery(""); setResults([]);
    toast.success("Locked in secretly 🔒");
    load();
  };

  const remove = async (id: string) => { await db.from("secret_crushes").delete().eq("id", id); load(); };

  if (ready && !userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold">Secret Crush Vault</h1>
        <p className="mt-2 text-muted-foreground">Sign in to open your vault.</p>
        <Button className="mt-6 rounded-2xl" onClick={() => navigate("/auth")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 to-primary/10 backdrop-blur-xl p-6 text-center">
        <Heart className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-2 font-serif text-3xl font-bold">Secret Crush Vault</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add up to {MAX} names. Nobody ever sees your list. If they add you too, you both see it's a match.</p>
      </div>

      <section className="mt-5 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-4">
        <Input placeholder="Search a student by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-border/50">
            {results.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">{r.full_name}</span>
                <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => add(r.id)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 mr-1" />}Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 space-y-2">
        <p className="font-serif text-lg font-bold">Your vault ({crushes.length}/{MAX})</p>
        {crushes.length === 0 && <p className="text-sm text-muted-foreground">Empty. Your secret is safe here.</p>}
        {crushes.map((c) => {
          const isMatch = mutual.includes(c.target_id);
          return (
            <div key={c.id} className={`flex items-center justify-between rounded-2xl border p-3 ${isMatch ? "border-primary bg-primary/10" : "border-border/50 bg-card/70"}`}>
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{isMatch ? "💘 It's mutual! Say hi." : "Waiting… they'll never know unless it's mutual"}</p>
              </div>
              <button aria-label="Remove" onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default SecretCrush;
