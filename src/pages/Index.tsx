import { useState, useEffect } from "react";
import { ArrowRight, MessageCircle, Users, CalendarDays, HelpCircle, Sparkles, BookOpen, MapPin, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ReunionFeed from "@/components/lost-found/ReunionFeed";

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
      emoji: "👥", title: "Study Groups",
      desc: "Join or create groups for any subject",
      path: "/study-groups", accent: "from-violet-500/20 to-indigo-500/10",
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

  return (
    <div className="text-foreground">
      <main className="mx-auto max-w-5xl px-3 pb-20 pt-4 sm:px-4 md:px-6 md:pt-14">
        {/* Hero — compact on mobile */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-4 sm:p-8 md:p-14 mb-4 sm:mb-10 shadow-lg">
          {/* Decorative layers — hidden on mobile */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/12 blur-[100px] hidden sm:block" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-accent/15 blur-[90px] hidden sm:block" />

          <div className="relative space-y-3 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 sm:px-4 sm:py-1.5 text-[0.65rem] sm:text-xs font-semibold text-primary tracking-wide uppercase">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              AI-Powered Campus
            </div>

            <h1 className="max-w-2xl text-2xl font-extrabold tracking-tight leading-[1.15] sm:text-4xl md:text-6xl font-serif">
              Your campus,
              <br />
              <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary/70 bg-clip-text text-transparent">
                brilliantly connected.
              </span>
            </h1>

            <p className="max-w-lg text-sm sm:text-lg text-muted-foreground leading-relaxed hidden sm:block">
              Events, lost & found, study groups, and Q&A — all in one place with an AI assistant that helps you navigate campus life.
            </p>

            <div className="flex gap-2 sm:gap-3 sm:flex-row pt-1 sm:pt-2">
              <Button
                className="group h-10 sm:h-12 rounded-xl sm:rounded-2xl px-4 sm:px-7 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-[0_8px_30px_hsl(var(--primary)/0.35)] hover:shadow-[0_12px_40px_hsl(var(--primary)/0.45)] transition-all duration-300"
                onClick={() => navigate("/qa")}
              >
                <MessageCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Campus AI
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform hidden sm:inline" />
              </Button>
              <Button
                variant="outline"
                className="h-10 sm:h-12 rounded-xl sm:rounded-2xl border-border/80 bg-card/50 hover:bg-primary/8 hover:border-primary/30 text-xs sm:text-sm font-medium transition-all duration-300"
                onClick={() => navigate("/events")}
              >
                <CalendarDays className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                Events
              </Button>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="mb-4 sm:mb-10">
          <div className="flex items-center gap-3 mb-3 sm:mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">Explore</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <button
                key={f.path}
                className="group relative text-left overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-3 sm:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.12)] hover:-translate-y-0.5 active:scale-[0.98]"
                onClick={() => navigate(f.path)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
                    <span className="text-lg sm:text-2xl">{f.emoji}</span>
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight">{f.title}</h3>
                  </div>
                  <p className="text-[0.65rem] sm:text-[0.8rem] text-muted-foreground leading-relaxed mb-1 sm:mb-4 line-clamp-2">{f.desc}</p>
                  <span className="inline-flex items-center text-[0.6rem] sm:text-xs font-semibold text-primary">
                    Open <ArrowRight className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </span>
                </div>
              </button>
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
