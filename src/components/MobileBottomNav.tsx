import { useNavigate, useLocation } from "react-router-dom";
import { Home, CalendarDays, MapPin, Users, HelpCircle, BookOpen, FileText } from "lucide-react";

const prefetchMap: Record<string, () => void> = {
  "/": () => import("@/pages/Index"),
  "/events": () => import("@/pages/Events"),
  "/lost-found": () => import("@/pages/LostFound"),
  "/study-groups": () => import("@/pages/StudyGroups"),
  "/qa": () => import("@/pages/QA"),
  "/materials": () => import("@/pages/StudyMaterials"),
};

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/events", label: "Events", icon: CalendarDays },
  { path: "/lost-found", label: "Lost", icon: MapPin },
  { path: "/study-groups", label: "Groups", icon: Users },
  { path: "/qa", label: "Q&A", icon: HelpCircle },
  { path: "/materials", label: "Notes", icon: FileText },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-xl md:hidden safe-area-bottom">
      <div className="grid grid-cols-6 gap-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              onTouchStart={() => prefetchMap[tab.path]?.()}
              className={`flex flex-col items-center gap-0.5 py-2 text-[0.6rem] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? "text-primary" : ""}`} />
              <span className="leading-none">{tab.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
