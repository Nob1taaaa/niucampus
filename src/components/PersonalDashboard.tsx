import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Flame, MapPin, ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Stats {
  pendingClaims: number;
  upcomingEvents: number;
  unreadNotifications: number;
  streak: number;
}

interface Props {
  user: User;
}

const STREAK_KEY = "niu_streak_v1";

function computeStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (!raw) {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ last: today, count: 1 }));
      return 1;
    }
    const { last, count } = JSON.parse(raw);
    if (last === today) return count;
    const next = last === yesterday ? count + 1 : 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ last: today, count: next }));
    return next;
  } catch {
    return 1;
  }
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Working late", emoji: "🌙" };
};

const PersonalDashboard = ({ user }: Props) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    pendingClaims: 0,
    upcomingEvents: 0,
    unreadNotifications: 0,
    streak: 1,
  });
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const streak = computeStreak();

      const [profileRes, postsRes, eventsRes, notifRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("lost_found_posts").select("id").eq("user_id", user.id),
        supabase
          .from("event_attendees")
          .select("event_id, events!inner(event_date)")
          .eq("user_id", user.id)
          .gte("events.event_date", new Date().toISOString()),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);

      let pendingClaims = 0;
      const postIds = (postsRes.data ?? []).map((p) => p.id);
      if (postIds.length > 0) {
        const { count } = await supabase
          .from("lost_found_claims")
          .select("id", { count: "exact", head: true })
          .in("post_id", postIds)
          .eq("status", "pending");
        pendingClaims = count ?? 0;
      }

      if (!mounted) return;
      const fullName = profileRes.data?.full_name?.trim() || user.email?.split("@")[0] || "there";
      setName(fullName.split(" ")[0]);
      setStats({
        pendingClaims,
        upcomingEvents: eventsRes.data?.length ?? 0,
        unreadNotifications: notifRes.count ?? 0,
        streak,
      });
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user.id, user.email]);

  const g = greeting();

  const cards = [
    {
      label: "Pending Claims",
      value: stats.pendingClaims,
      icon: MapPin,
      tint: "from-rose-500/25 via-orange-500/15 to-transparent",
      ring: "ring-rose-500/20",
      iconColor: "text-rose-400",
      path: "/lost-found",
      hint: stats.pendingClaims > 0 ? "Review now" : "All clear",
    },
    {
      label: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: CalendarDays,
      tint: "from-emerald-500/25 via-teal-500/15 to-transparent",
      ring: "ring-emerald-500/20",
      iconColor: "text-emerald-400",
      path: "/events",
      hint: stats.upcomingEvents > 0 ? "On your list" : "Discover events",
    },
    {
      label: "Day Streak",
      value: stats.streak,
      icon: Flame,
      tint: "from-amber-500/30 via-yellow-500/15 to-transparent",
      ring: "ring-amber-500/25",
      iconColor: "text-amber-400",
      path: "/planner",
      hint: stats.streak > 1 ? "Keep it alive 🔥" : "Start today",
      glow: stats.streak >= 3,
    },
    {
      label: "Notifications",
      value: stats.unreadNotifications,
      icon: Bell,
      tint: "from-violet-500/25 via-indigo-500/15 to-transparent",
      ring: "ring-violet-500/20",
      iconColor: "text-violet-400",
      path: "#",
      hint: stats.unreadNotifications > 0 ? "New for you" : "You're caught up",
    },
  ];

  return (
    <section className="mb-4 sm:mb-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 backdrop-blur-2xl p-4 sm:p-6 md:p-7 shadow-lg">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-[80px]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-accent/15 blur-[70px]" />

        {/* Greeting */}
        <div className="relative flex items-start justify-between gap-3 mb-4 sm:mb-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-[0.6rem] sm:text-[0.65rem] font-semibold text-primary tracking-wide uppercase mb-2">
              <Sparkles className="h-3 w-3" />
              Your dashboard
            </div>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              {g.text}, <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">{loading ? "…" : name}</span> {g.emoji}
            </h2>
            <p className="text-[0.7rem] sm:text-sm text-muted-foreground mt-1">
              Here's what's happening on campus today.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                onClick={() => c.path !== "#" && navigate(c.path)}
                className={`group relative text-left overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-3 sm:p-4 ring-1 ${c.ring} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] active:scale-[0.98]`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.tint} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-background/60 ${c.iconColor} ${c.glow ? "animate-pulse" : ""}`}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
                    {loading ? "—" : c.value}
                  </div>
                  <div className="text-[0.65rem] sm:text-xs font-semibold text-foreground/80 mt-0.5">{c.label}</div>
                  <div className="text-[0.6rem] sm:text-[0.7rem] text-muted-foreground mt-0.5 line-clamp-1">{c.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PersonalDashboard;
