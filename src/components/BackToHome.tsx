import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Replaces browser history entries so that pressing "back"
 * always returns the user to the home page instead of the
 * previous route they visited.
 */
const BackToHome = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Replace every non-home navigation so the back stack only has "/"
    if (pathname !== "/") {
      window.history.replaceState(null, "", pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      // When user presses back, always go home
      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  return null;
};

export default BackToHome;
