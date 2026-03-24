import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, X, Home, CalendarDays, Search as SearchIcon, Users, HelpCircle, BookOpen, MapPin, FileText } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={logoImage}
            alt="Campus Innovation Logo"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain bg-white/90 p-0.5 shadow-sm"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-tight sm:text-sm">Campus Innovation</span>
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              Innovate. Create. Code.
            </p>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/70 text-xs font-semibold text-primary-foreground md:flex">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-primary/10"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-xs h-8 px-3 rounded-full border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10"
            >
              Sign In
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-border/40 bg-background/95 backdrop-blur-xl px-3 py-3 md:hidden animate-fade-in">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
