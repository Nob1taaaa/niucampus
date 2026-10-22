import { useState, useEffect } from "react";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ReunionFeed from "@/components/lost-found/ReunionFeed";
import FeedbackButton from "@/components/FeedbackButton";
import PersonalDashboard from "@/components/PersonalDashboard";

type Tile = { emoji: string; title: string; desc: string; to: string; tone: string; badge?: string };

// tone = CSS variable name holding an HSL triplet
const groups: { title: string; subtitle: string; tiles: Tile[] }[] = [
  {
    title: "Live on campus",
    subtitle: "Meet people, right now",
    tiles: [
      { emoji: "📡", title: "Campus Radar", desc: "Hangout pings nearby", to: "/campus?tab=radar", tone: "--mode-radar", badge: "Live" },
      { emoji: "🍜", title: "Food Buddy", desc: "Never eat alone", to: "/campus?tab=food", tone: "--mode-food", badge: "Live" },
      { emoji: "🛺", title: "Ride Share", desc: "Split autos & cabs", to: "/campus?tab=ride", tone: "--mode-ride" },
      { emoji: "🆘", title: "Borrow SOS", desc: "Charger? Lab coat? Ask", to: "/campus?tab=borrow", tone: "--mode-borrow" },
    ],
  },
  {
    title: "Earn & create",
    subtitle: "Turn skills into money",
    tiles: [
      { emoji: "💸", title: "Micro-Gigs", desc: "Offer or hire skills", to: "/campus?tab=gig", tone: "--mode-gig", badge: "New" },
      { emoji: "🎬", title: "Creator Hub", desc: "Find collab partners", to: "/campus?tab=creator", tone: "--mode-creator", badge: "New" },
      { emoji: "🏪", title: "NIU Bazaar", desc: "Buy, sell, give away", to: "/marketplace", tone: "--mode-ride" },
      { emoji: "📍", title: "Lost & Found", desc: "AI matches your item", to: "/lost-found", tone: "--mode-borrow" },
    ],
  },
  {
    title: "Study smarter",
    subtitle: "Notes, plans and an AI that knows NIU",
    tiles: [
      { emoji: "📚", title: "Study Materials", desc: "Notes, PDFs, PYQs", to: "/materials", tone: "--primary" },
      { emoji: "🎯", title: "Study Planner", desc: "AI plans your week", to: "/planner", tone: "--mode-gig" },
      { emoji: "❓", title: "Campus AI", desc: "Ask anything", to: "/qa", tone: "--mode-radar" },
      { emoji: "🎉", title: "Events", desc: "Fests & workshops", to: "/events", tone: "--mode-creator" },
    ],
  },
  {
    title: "Just for fun",
    subtitle: "Your daily dose of campus",
    tiles: [
      { emoji: "💌", title: "Secret Crush", desc: "Revealed only if mutual", to: "/crush", tone: "--mode-borrow", badge: "Hot" },
      { emoji: "🧩", title: "Daily Trivia", desc: "Play, streak, win", to: "/trivia", tone: "--mode-food" },
    ],
  },
];

const TileCard = ({ t, onClick }: { t: Tile; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{ ["--tone" as any]: `var(${t.tone})` }}
    className="group relative flex h-full min-h-[132px] flex-col justify-between overflow-hidden rounded-3xl border border-border/50 bg-card/75 p-4 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--tone)/0.4)] hover:shadow-[0_10px_30px_hsl(var(--tone)/0.18)] active:scale-[0.97]"
  >
    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[hsl(var(--tone)/0.18)] blur-2xl transition-opacity group-hover:opacity-100" />
    <div className="relative flex items-start justify-between">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[hsl(var(--tone)/0.14)] text-2xl">{t.emoji}</span>
      {t.badge && (
        <span className="rounded-full bg-[hsl(var(--tone)/0.15)] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[hsl(var(--tone))]">{t.badge}</span>
      )}
    </div>
    <div className="relative mt-3">
      <p className="font-serif text-[0.98rem] font-bold leading-tight">{t.title}</p>
      <p className="mt-0.5 text-[0.72rem] leading-snug text-muted-foreground line-clamp-1">{t.desc}</p>
    </div>
  </button>
);

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "").split(" ")[0];

  return (
    <div className="text-foreground">
      <main className="mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pt-10">
        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-5 shadow-lg backdrop-blur-2xl sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-[90px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-[hsl(var(--mode-food)/0.15)] blur-[80px]" />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary sm:text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              NIU is live
            </div>
            <h1 className="font-serif text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              {user && firstName
                ? <>{greeting},<br /><span className="capitalize text-primary">{firstName}.</span></>
                : <>Your campus,<br /><span className="text-primary">beautifully connected.</span></>}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Find a food buddy, split a ride, earn from your skills, and ace your exams — all in one place.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button className="group h-11 rounded-2xl px-5 font-semibold shadow-[0_8px_30px_hsl(var(--primary)/0.35)]" onClick={() => navigate("/campus")}>
                <Sparkles className="mr-2 h-4 w-4" /> What's happening
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" className="h-11 rounded-2xl border-border/80 bg-card/50" onClick={() => navigate("/qa")}>
                <MessageCircle className="mr-2 h-4 w-4 text-primary" /> Ask Campus AI
              </Button>
            </div>
          </div>
        </section>

        {/* Grouped features */}
        {groups.map((g) => (
          <section key={g.title} className="mb-7">
            <div className="mb-3 flex items-end justify-between px-1">
              <div>
                <h2 className="font-serif text-xl font-bold sm:text-2xl">{g.title}</h2>
                <p className="text-xs text-muted-foreground">{g.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
              {g.tiles.map((t) => <TileCard key={t.title} t={t} onClick={() => navigate(t.to)} />)}
            </div>
          </section>
        ))}

        {user && <PersonalDashboard user={user} />}

        <ReunionFeed />

        {!user && (
          <section className="relative mt-8 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 to-primary/5 p-8 text-center backdrop-blur-xl">
            <p className="text-lg font-bold">Ready to get started?</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Sign in with your NIU account to post, chat and join in.</p>
            <Button className="mt-5 h-11 rounded-2xl px-8 font-semibold" onClick={() => navigate("/auth")}>Sign In</Button>
          </section>
        )}

        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="text-xs italic text-muted-foreground">Got an idea?</span>
          <FeedbackButton variant="footer" />
        </div>
      </main>
    </div>
  );
};

export default Index;
