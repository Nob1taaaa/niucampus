import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Heart, Flame, MessageCircle, Lock, UserRound, Loader2 } from "lucide-react";
import { db, CrushProfile, isMissingTable, initials, VIBES } from "@/components/crush/shared";
import ProfileEditor from "@/components/crush/ProfileEditor";
import SwipeDeck from "@/components/crush/SwipeDeck";
import MatchesPanel from "@/components/crush/MatchesPanel";
import CrushVault from "@/components/crush/CrushVault";

type Tab = "discover" | "matches" | "vault" | "me";

const SecretCrush = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<CrushProfile | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [tab, setTab] = useState<Tab>("discover");
  const [likes, setLikes] = useState<number | null>(null);
  const [match, setMatch] = useState<CrushProfile | null>(null);
  const [openChat, setOpenChat] = useState<CrushProfile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
        setName(prof?.full_name || data.user?.email?.split("@")[0] || "");
        const { data: cp, error } = await db.from("crush_profiles").select("*").eq("user_id", uid).maybeSingle();
        if (isMissingTable(error)) setSetupNeeded(true);
        setMe(cp || null);
        if (!cp && !error) setTab("me");
        const { data: c } = await db.rpc("my_crush_likes_count");
        if (typeof c === "number") setLikes(c);
      }
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="grid h-[60dvh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 fill-[hsl(var(--mode-borrow))] text-[hsl(var(--mode-borrow))]" />
        <h1 className="mt-3 font-serif text-3xl font-bold">Crush @ NIU</h1>
        <p className="mt-2 text-muted-foreground">Make a profile, swipe, match and chat — only with verified NIU students.</p>
        <Button className="mt-6 rounded-2xl" onClick={() => navigate("/auth")}>Sign in to start</Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "discover", label: "Discover", icon: Flame },
    { id: "matches", label: "Matches", icon: MessageCircle },
    { id: "vault", label: "Vault", icon: Lock },
    { id: "me", label: "Profile", icon: UserRound },
  ];

  const needsProfile = !me && (tab === "discover" || tab === "matches");

  return (
    <div className="mx-auto max-w-xl px-4 py-5 pb-28 sm:py-8" style={{ ["--tone" as any]: "var(--mode-borrow)" }}>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-extrabold sm:text-3xl">Crush <span className="text-[hsl(var(--tone))]">@ NIU</span></h1>
          <p className="text-xs text-muted-foreground">Verified students only · you're always in control</p>
        </div>
        {likes !== null && likes > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--tone)/0.12)] px-3 py-1.5 text-xs font-bold text-[hsl(var(--tone))]">
            <Heart className="h-3.5 w-3.5 fill-current" />{likes} like{likes > 1 ? "s" : ""} you
          </div>
        )}
      </header>

      <nav className="mb-5 grid grid-cols-4 gap-1 rounded-2xl border border-border/50 bg-card/70 p-1 backdrop-blur-xl">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[0.7rem] font-bold transition-all ${tab === t.id ? "bg-[hsl(var(--tone))] text-primary-foreground shadow" : "text-muted-foreground"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </nav>

      {setupNeeded && tab !== "vault" ? (
        <div className="rounded-3xl border border-border/50 bg-card/70 p-6 text-center">
          <p className="text-4xl">🛠️</p>
          <p className="mt-2 font-serif text-xl font-bold">Almost ready</p>
          <p className="mt-1 text-sm text-muted-foreground">Profiles, swiping and match chat are switched on after a one-time setup. Your Secret Crush Vault already works.</p>
          <Button className="mt-4 rounded-2xl" onClick={() => setTab("vault")}>Open the Vault</Button>
        </div>
      ) : needsProfile ? (
        <div className="rounded-3xl border border-[hsl(var(--tone)/0.3)] bg-card/70 p-6 text-center">
          <p className="text-5xl">💫</p>
          <p className="mt-3 font-serif text-xl font-bold">Create your profile first</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a photo, a bio and your vibe so people can match with you.</p>
          <Button className="mt-4 rounded-2xl bg-[hsl(var(--tone))] text-primary-foreground hover:opacity-90" onClick={() => setTab("me")}>Make my profile</Button>
        </div>
      ) : tab === "discover" && me ? (
        <SwipeDeck me={me} onMatch={(p) => { setMatch(p); setRefreshKey((k) => k + 1); }} />
      ) : tab === "matches" && me ? (
        <MatchesPanel me={me} refreshKey={refreshKey} openWith={openChat} />
      ) : tab === "vault" ? (
        <CrushVault />
      ) : (
        <ProfileEditor userId={userId} initial={me} defaultName={name} onSaved={(p) => { setMe(p); setTab("discover"); }} />
      )}

      <Dialog open={!!match} onOpenChange={(v) => !v && setMatch(null)}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="sr-only">It's a match</DialogTitle>
          <p className="font-serif text-4xl font-extrabold text-[hsl(var(--mode-borrow))]">It's a match!</p>
          <p className="text-sm text-muted-foreground">You and {match?.display_name} liked each other 💘</p>
          <div className="mx-auto my-4 flex -space-x-4">
            {[me, match].map((p, i) => p && (
              <div key={i} className={`h-24 w-24 overflow-hidden rounded-full border-4 border-background ${i ? "rotate-6" : "-rotate-6"}`}>
                {p.photos[0] ? <img src={p.photos[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl font-bold text-primary-foreground" style={{ background: `hsl(var(${VIBES[p.vibe_color]}))` }}>{initials(p.display_name)}</div>}
              </div>
            ))}
          </div>
          <Button className="h-12 rounded-2xl bg-[hsl(var(--mode-borrow))] text-primary-foreground hover:opacity-90" onClick={() => { setOpenChat(match); setMatch(null); setTab("matches"); }}>Send a message</Button>
          <Button variant="ghost" className="rounded-2xl" onClick={() => setMatch(null)}>Keep swiping</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecretCrush;
