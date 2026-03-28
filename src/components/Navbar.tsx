import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Home, CalendarDays, Users, HelpCircle, BookOpen, MapPin, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import logoImage from "@/assets/logo.png";

const navLinks = [
  { path: "/", label: "Home", icon: Home },
  { path: "/events", label: "Events", icon: CalendarDays },
  { path: "/lost-found", label: "Lost & Found", icon: MapPin },
  { path: "/study-groups", label: "Study Groups", icon: Users },
  { path: "/qa", label: "Q&A", icon: HelpCircle },
  { path: "/planner", label: "Planner", icon: BookOpen },
  { path: "/materials", label: "Materials", icon: FileText },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="relative">
            <img
              src={logoImage}
              alt="NIU Connect Logo"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain bg-card p-0.5 shadow-sm ring-1 ring-border/50 group-hover:ring-primary/30 transition-all"
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold tracking-tight">NIU Connect</span>
            <p className="hidden text-[0.65rem] text-muted-foreground md:block">
              Your Smart Campus
            </p>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
                {active && (
                  <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-foreground text-[0.65rem] font-bold text-primary-foreground md:flex ring-2 ring-primary/20">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-xs h-8 px-4 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Sign In
            </Button>
          )}

          {/* Mobile menu toggle removed — using bottom nav instead */}
        </div>
      </div>

      {/* Mobile menu - hidden since we have bottom nav */}
    </header>
  );
};

export default Navbar;
