import { useState, useEffect } from "react";
import { ArrowRight, MessageCircle, CalendarDays, HelpCircle, BookOpen, MapPin, ShoppingBag, Target, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ReunionFeed from "@/components/lost-found/ReunionFeed";
import FeedbackButton from "@/components/FeedbackButton";
import PersonalDashboard from "@/components/PersonalDashboard";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      emoji: "🎉", title: "Events",
      desc: "Browse workshops, hackathons, and campus meetups",
      path: "/events", accent: "from-emerald-500/20 to-teal-500/10",
    },
    {
      emoji: "📍", title: "Lost & Found",
      desc: "Report or find lost items across campus",
      path: "/lost-found", accent: "from-rose-500/20 to-orange-500/10",
    },
    {
      emoji: "🏪", title: "NIU Bazaar",
      desc: "Buy, sell, or give away items on campus",
      path: "/marketplace", accent: "from-violet-500/20 to-indigo-500/10",
    },
    {
      emoji: "❓", title: "Q&A",
      desc: "Ask anything — get AI-powered campus answers",
      path: "/qa", accent: "from-sky-500/20 to-cyan-500/10",
    },
    {
      emoji: "🎯", title: "Study Planner",
      desc: "AI creates a personalized weekly study plan",
      path: "/planner", accent: "from-amber-500/20 to-yellow-500/10",
    },
    {
      emoji: "📚", title: "Study Materials",
      desc: "Upload & share notes, PDFs, and useful links",
      path: "/materials", accent: "from-lime-500/20 to-green-500/10",
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "").split(" ")[0];

  const quick = [
    { icon: CalendarDays, label: "Events", path: "/events" },
    { icon: MapPin, label: "Lost item", path: "/lost-found" },
    { icon: BookOpen, label: "Notes", path: "/materials" },
    { icon: HelpCircle, label: "Ask AI", path: "/qa" },
  ];

  const comingSoon = [
    { emoji: "📡", title: "Campus Radar", desc: "Food buddy & hangout pings" },
    { emoji: "🆘", title: "Borrow SOS", desc: "Need a charger? Ask nearby" },
    { emoji: "💸", title: "Micro-Gigs", desc: "Earn from your skills" },
    { emoji: "🧩", title: "Daily Trivia", desc: "Play, streak, win" },
  ];

  return (
    <div className="text-foreground">
      <main className="mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pt-12">
        {/* Bento hero */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
          <div className="relative col-span-2 md:col-span-3 md:row-span-2 overflow-hidden rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-5 sm:p-8 md:p-10 shadow-lg">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-[90px]" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold text-primary uppercase tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Live on campus
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight">
                {user && firstName ? <>{greeting},<br /><span className="text-primary capitalize">{firstName}.</span></> : <>Your campus,<br /><span className="text-primary">beautifully connected.</span></>}
              </h1>
              <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
                Events, deals, lost items, notes and an AI that knows campus — all in one place.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button className="group h-11 rounded-2xl px-5 font-semibold shadow-[0_8px_30px_hsl(var(--primary)/0.35)]" onClick={() => navigate("/qa")}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Campus AI
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="h-11 rounded-2xl bg-card/50 border-border/80" onClick={() => navigate("/marketplace")}>
                  <ShoppingBag className="mr-2 h-4 w-4 text-primary" /> Bazaar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground italic">Got an idea?</span>
                <FeedbackButton variant="footer" />
              </div>
            </div>
          </div>

          <button onClick={() => navigate("/planner")} className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 to-card/80 backdrop-blur-xl p-4 sm:p-5 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            <Target className="h-6 w-6 text-primary mb-6 sm:mb-10" />
            <p className="font-serif text-lg font-bold leading-tight">Study Planner</p>
            <p className="text-xs text-muted-foreground mt-1">AI plans your week</p>
          </button>
          <button onClick={() => navigate("/events")} className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-accent/30 to-card/80 backdrop-blur-xl p-4 sm:p-5 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            <Flame className="h-6 w-6 text-primary mb-6 sm:mb-10" />
            <p className="font-serif text-lg font-bold leading-tight">What's on</p>
            <p className="text-xs text-muted-foreground mt-1">Fests, workshops & meetups</p>
          </button>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-10">
          {quick.map((q) => (
            <button key={q.path} onClick={() => navigate(q.path)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm py-3 sm:py-4 transition-all hover:border-primary/30 active:scale-95">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><q.icon className="h-5 w-5" /></span>
              <span className="text-[0.7rem] sm:text-xs font-semibold">{q.label}</span>
            </button>
          ))}
        </section>

        {user && <PersonalDashboard user={user} />}

        {/* Explore all */}
        <section className="mb-5 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl font-bold mb-3 sm:mb-5">Explore campus</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
            {features.map((f) => (
              <button key={f.path} onClick={() => navigate(f.path)} className="group relative text-left overflow-hidden rounded-3xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.12)] hover:-translate-y-0.5 active:scale-[0.98]">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <span className="text-2xl sm:text-3xl">{f.emoji}</span>
                  <h3 className="mt-2 text-sm sm:text-base font-bold">{f.title}</h3>
                  <p className="text-[0.7rem] sm:text-sm text-muted-foreground leading-relaxed mt-1 line-clamp-2">{f.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <section className="mb-5 sm:mb-10 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold">Coming soon</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">v2</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x">
            {comingSoon.map((c) => (
              <div key={c.title} className="min-w-[150px] snap-start rounded-2xl border border-border/50 bg-background/60 p-3.5">
                <span className="text-2xl">{c.emoji}</span>
                <p className="mt-2 text-sm font-bold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* Reunion Feed */}
        <ReunionFeed />

        {/* Quick info for logged-out users */}
        {!user && (
          <section className="mt-10 relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 to-primary/5 backdrop-blur-xl p-8 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-[60px]" />
            <div className="relative">
              <p className="text-lg font-bold text-foreground">Ready to get started?</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Sign in to create events, join study groups, and access all features.</p>
              <Button className="mt-5 rounded-2xl h-11 px-8 font-semibold" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Floating AI button — pushed up on mobile to clear bottom nav */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8">
        <Button
          size="icon"
          onClick={() => navigate("/qa")}
          className="group h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_8px_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_hsl(var(--primary)/0.55)] hover:scale-105 transition-all duration-300"
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
