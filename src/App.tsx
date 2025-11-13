
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
import RoleGuard from "./components/auth/RoleGuard";
import Admin from "./pages/Admin";
import ClipperSetup from "./pages/ClipperSetup";
import QuickClip from "./pages/QuickClip";
import Assignments from "./pages/Assignments";
import CalendarPage from "./pages/CalendarPage";
import { useConfigurationValidation } from "./hooks/useConfigurationValidation";
import { useSettings } from "./hooks/useSettings";
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
            <ManagePage />
          </PageTransition>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PageTransition>
            <Profile />
          </PageTransition>
        } 
      />
      <Route 
        path="/import" 
        element={
          <PageTransition>
            <ImportHub />
          </PageTransition>
        } 
      />
      <Route 
        path="/search" 
        element={
          <PageTransition>
            <SearchPage />
          </PageTransition>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <PageTransition>
            <Settings />
          </PageTransition>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <PageTransition>
            <RoleGuard allowedRoles={['admin']}>
              <Admin />
            </RoleGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/assignments" 
        element={
          <PageTransition>
            <Assignments />
          </PageTransition>
        } 
      />
      <Route 
        path="/calendar" 
        element={
          <PageTransition>
            <CalendarPage />
          </PageTransition>
        } 
      />
      <Route
        path="/clipper" 
        element={
          <PageTransition>
            <RoleGuard allowedRoles={['admin']}>
              <ClipperSetup />
            </RoleGuard>
          </PageTransition>
        } 
      />
      <Route 
        path="/clip" 
        element={
          <PageTransition>
            <QuickClip />
          </PageTransition>
        } 
      />
      <Route 
        path="/preview/:id"
        element={
          <PageTransition>
            <PreviewPage />
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

// Component to handle settings that require AuthProvider
const SettingsHandler = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();

  // Apply global classes based on settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Handle animations setting
    if (!settings.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
    
    // Handle compact view setting
    if (settings.compactView) {
      root.classList.add('compact-view');
    } else {
      root.classList.remove('compact-view');
    }
  }, [settings.animations, settings.compactView]);

  return <>{children}</>;
};

const App = () => {
  const { showBanner, missingKeys, dismissBanner } = useConfigurationValidation();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <SettingsHandler>
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
            </SettingsHandler>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
