import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import BackToHome from "./components/BackToHome";

// Lazy-load pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EventsPage = lazy(() => import("./pages/Events"));
const LostFoundPage = lazy(() => import("./pages/LostFound"));
const MarketplacePage = lazy(() => import("./pages/Marketplace"));
const QAPage = lazy(() => import("./pages/QA"));
const StudyPlannerPage = lazy(() => import("./pages/StudyPlanner"));
const StudyMaterialsPage = lazy(() => import("./pages/StudyMaterials"));
const UnsubscribePage = lazy(() => import("./pages/Unsubscribe"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 min — revisited pages use cache
      gcTime: 1000 * 60 * 10,         // 10 min — keep unused data in memory
      refetchOnWindowFocus: false,     // don't refetch when tab regains focus
      retry: 1,                        // single retry on failure
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center gap-3">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
    <span className="text-xs text-muted-foreground font-medium animate-pulse">Loading…</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <BackToHome />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/events" element={<Layout><EventsPage /></Layout>} />
            <Route path="/lost-found" element={<Layout><LostFoundPage /></Layout>} />
            <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
            <Route path="/qa" element={<Layout><QAPage /></Layout>} />
            <Route path="/planner" element={<Layout><StudyPlannerPage /></Layout>} />
            <Route path="/materials" element={<Layout><StudyMaterialsPage /></Layout>} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
