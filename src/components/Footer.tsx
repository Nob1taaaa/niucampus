import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, HelpCircle, BookOpen, MapPin, Heart, Sparkles, ArrowUpRight } from "lucide-react";
import logoImage from "@/assets/logo.png";

const Footer = () => {
  const navigate = useNavigate();

  const links = [
    { path: "/events", label: "Events", icon: CalendarDays },
    { path: "/lost-found", label: "Lost & Found", icon: MapPin },
    { path: "/study-groups", label: "Study Groups", icon: Users },
    { path: "/qa", label: "Q&A", icon: HelpCircle },
    { path: "/planner", label: "Planner", icon: BookOpen },
  ];

  return (
    <footer className="relative mt-20 border-t border-border/30 bg-card/40 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/3 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Logo" className="h-9 w-9 rounded-xl bg-card p-0.5 shadow-sm ring-1 ring-border/50 object-contain" />
              <div>
                <p className="text-sm font-bold tracking-tight">NIU Connect</p>
                <p className="text-[0.65rem] text-muted-foreground">Your Smart Campus</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              A smart campus companion connecting students through events, study groups, lost & found, and AI-powered guidance.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-primary">Quick Links</p>
            <div className="grid grid-cols-2 gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-all hover:bg-primary/5 hover:text-foreground text-left"
                  >
                    <Icon className="h-3 w-3 text-primary/50 group-hover:text-primary transition-colors" />
                    {link.label}
                    <ArrowUpRight className="h-2.5 w-2.5 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-50 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tech badges */}
          <div className="space-y-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-primary">Built With</p>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Tailwind CSS", "ui/ux", "AI"].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5 text-[0.65rem] font-medium text-muted-foreground"
                >
                  {tech === "AI" && <Sparkles className="h-2.5 w-2.5 text-primary" />}
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-[0.65rem] text-muted-foreground/60 leading-relaxed">
              Designed & developed for Noida International University students.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border/20 pt-6 text-center">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-destructive fill-destructive animate-pulse" /> for NIU Connect
          </p>
          <p className="text-[0.6rem] text-muted-foreground/50">
            © {new Date().getFullYear()} NIU Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
