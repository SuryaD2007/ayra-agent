
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PrivateLockProvider } from '@/contexts/PrivateLockContext';
import { IPBanGuard } from '@/components/auth/IPBanGuard';
import Index from "./pages/Index";
import WhyPage from "./pages/WhyPage";
import HowPage from "./pages/HowPage";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ImportHub from "./pages/ImportHub";
import SearchPage from "./pages/SearchPage";
import Settings from "./pages/Settings";
import ManagePage from "./pages/ManagePage";
import PreviewPage from "./pages/PreviewPage";
import Navbar from "./components/Navbar";
import ConfigurationBanner from "./components/ConfigurationBanner";
import PreLaunchGuard from "./components/auth/PreLaunchGuard";
import RoleGuard from "./components/auth/RoleGuard";
import Admin from "./pages/Admin";
import { useConfigurationValidation } from "./hooks/useConfigurationValidation";
import './lib/sampleData'; // Import sample data utilities

const queryClient = new QueryClient();

// Page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="transition-opacity duration-300 animate-fade-in">
      {children}
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PageTransition>
            <Index />
          </PageTransition>
        } 
      />
      <Route 
        path="/why" 
        element={
          <PageTransition>
            <WhyPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/how" 
        element={
          <PageTransition>
            <HowPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/manage" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <ManagePage />
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <Profile />
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/import" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <ImportHub />
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/search" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <SearchPage />
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <Settings />
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <RoleGuard allowedRoles={['admin']}>
                <Admin />
              </RoleGuard>
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/preview/:id" 
        element={
          <PageTransition>
            <PreLaunchGuard>
              <PreviewPage />
            </PreLaunchGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="*" 
        element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } 
      />
    </Routes>
  );
};

const App = () => {
  const { showBanner, missingKeys, dismissBanner } = useConfigurationValidation();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <IPBanGuard>
              <PrivateLockProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  {showBanner && (
                    <ConfigurationBanner 
                      missingKeys={missingKeys} 
                      onDismiss={dismissBanner}
                    />
                  )}
                  <div className={`min-h-screen ${showBanner ? 'pt-20' : ''}`}>
                    <Navbar />
                    <AppRoutes />
                  </div>
                </TooltipProvider>
              </PrivateLockProvider>
            </IPBanGuard>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
