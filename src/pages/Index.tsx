import { useState, useEffect } from "react";
import { ArrowRight, MessageCircle, Users, CalendarDays, HelpCircle, Sparkles, BookOpen, MapPin, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      icon: CalendarDays, emoji: "📅", title: "Events",
      desc: "Browse workshops, hackathons, and campus meetups",
      path: "/events", color: "text-primary",
    },
    {
      icon: MapPin, emoji: "📍", title: "Lost & Found",
      desc: "Report or find lost items across campus",
      path: "/lost-found", color: "text-destructive",
    },
    {
      icon: Users, emoji: "👥", title: "Study Groups",
      desc: "Join or create groups for DSA, DBMS, and more",
      path: "/study-groups", color: "text-accent-foreground",
    },
    {
      icon: HelpCircle, emoji: "❓", title: "Q&A",
      desc: "Ask anything — get AI-powered campus answers",
      path: "/qa", color: "text-primary",
    },
    {
      icon: BookOpen, emoji: "🎯", title: "Study Planner",
      desc: "AI creates a personalized weekly study plan",
      path: "/planner", color: "text-accent-foreground",
    },
    {
      icon: FileText, emoji: "📚", title: "Study Materials",
      desc: "Upload & share notes, PDFs, and useful links",
      path: "/materials", color: "text-primary",
    },
  ];

  return (
    <div className="text-foreground">
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 md:px-6 md:pt-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-6 sm:p-8 md:p-10 mb-8">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-[80px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-accent/12 blur-[80px]" />

          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI-Powered Campus Platform
            </div>

            <h1 className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Your campus,
              <span className="bg-gradient-to-br from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
                {" "}brilliantly connected.
              </span>
            </h1>

            <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
              Events, lost & found, study groups, and Q&A — all in one place with an AI assistant that helps you navigate campus life.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="hover-scale bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[var(--shadow-glow)] h-11 rounded-xl px-6 text-sm"
                onClick={() => navigate("/qa")}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                Talk to Campus AI
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-sm"
                onClick={() => navigate("/events")}
              >
                <CalendarDays className="mr-1.5 h-4 w-4 text-primary" />
                Browse Events
              </Button>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.path}
              className="hover-scale cursor-pointer group border-primary/12 bg-card/70 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md hover:border-primary/25"
              onClick={() => navigate(f.path)}
            >
              <div className="h-1 bg-gradient-to-r from-primary/50 to-accent-foreground/30" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-lg">{f.emoji}</span>
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
                <span className={`mt-3 inline-flex items-center text-xs font-semibold ${f.color} group-hover:gap-2 transition-all`}>
                  Open <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Reunion Feed */}
        <ReunionFeed />

        {/* Quick info for logged-out users */}
        {!user && (
          <section className="mt-8 rounded-2xl border border-primary/12 bg-card/60 backdrop-blur-sm p-6 text-center">
            <p className="text-base font-semibold text-foreground">Ready to get started?</p>
            <p className="text-sm text-muted-foreground mt-1">Sign in to create events, join study groups, and access all features.</p>
            <Button className="mt-4 rounded-xl" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </section>
        )}
      </main>

      {/* Floating AI button */}
      <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
        <Button
          size="icon"
          onClick={() => navigate("/qa")}
          className="hover-scale h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[var(--shadow-glow)] hover:shadow-lg transition-shadow"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
