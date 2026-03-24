import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, HelpCircle, BookOpen, MapPin, Heart, Sparkles } from "lucide-react";
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
    <footer className="relative mt-16 border-t border-primary/10 bg-card/50 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/3 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img src={logoImage} alt="Logo" className="h-8 w-8 rounded-xl bg-card p-0.5 shadow-sm object-contain" />
              <div>
                <p className="text-sm font-semibold tracking-tight">Campus Innovation</p>
                <p className="text-[0.65rem] text-muted-foreground">Smart Campus Companion</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              A smart campus companion that connects students through events, study groups, lost & found, and AI-powered guidance.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quick Links</p>
            <div className="grid grid-cols-2 gap-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground text-left"
                  >
                    <Icon className="h-3 w-3 text-primary/60" />
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tech stack */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Built With</p>
            <div className="flex flex-wrap gap-1.5">
              {["React", "TypeScript", "Tailwind CSS", "Lovable Cloud", "AI"].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[0.65rem] text-muted-foreground"
                >
                  {tech === "AI" && <Sparkles className="h-2.5 w-2.5 text-primary" />}
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-[0.65rem] text-muted-foreground/70 leading-relaxed">
              Designed & developed as a campus innovation project showcasing full-stack capabilities.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-primary/10 pt-5 text-center">
          <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> for Campus Innovation
          </p>
          <p className="text-[0.6rem] text-muted-foreground/60">
            © {new Date().getFullYear()} Campus Innovation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
