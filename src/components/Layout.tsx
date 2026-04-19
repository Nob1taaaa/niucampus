import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import FeedbackButton from "./FeedbackButton";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Hide floating feedback on pages with their own floating UI (chatbot, chats)
  const hideFloating = ["/qa", "/lost-found", "/marketplace"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 pb-14 md:pb-0">{children}</div>
      <div className="hidden md:block">
        <Footer />
      </div>
      {/* Floating feedback button - mobile only, hidden on chat-heavy pages */}
      {!hideFloating && (
        <div className="md:hidden">
          <FeedbackButton variant="floating" />
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
