import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import FeedbackButton from "./FeedbackButton";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Hide mobile feedback strip on chat-heavy pages to avoid clashing with chat input
  const hideMobileFeedback = ["/qa", "/lost-found", "/marketplace"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 pb-14 md:pb-0">{children}</div>

      {/* Mobile feedback strip — centered above bottom nav */}
      {!hideMobileFeedback && (
        <div className="md:hidden flex justify-center py-6 px-4">
          <FeedbackButton variant="footer" />
        </div>
      )}

      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
