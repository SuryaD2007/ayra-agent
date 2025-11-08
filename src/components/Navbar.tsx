import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogIn, Search, Upload, User, Settings, LogOut, Moon, Sun, Table, Info, HelpCircle, Code, Shield, Calendar, CalendarDays } from 'lucide-react';
import { useRippleEffect } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRoles } from '@/hooks/useRoles';
import { useCanvasConnection } from '@/hooks/useCanvasConnection';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from '@/components/AuthModal';
import NewItemModal from '@/components/manage/NewItemModal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { TooltipProvider } from '@/components/ui/tooltip';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
}

const NavItem = ({ to, icon, label, active, onClick, hasSubmenu, children }: NavItemProps) => {
  const handleRipple = useRippleEffect();
  
  if (hasSubmenu) {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary", 
                active ? "bg-primary/10 text-primary" : "text-foreground/80"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                active ? "text-primary" : "text-foreground/60"
              )}>
                {icon}
              </span>
              <span className="font-medium">{label}</span>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[200px] gap-1 p-2">
                {children}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          to={to} 
          className={cn(
            "relative flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-300",
            "hover:bg-primary/10 hover:text-primary",
            "overflow-hidden",
            active ? "bg-primary/10 text-primary" : "text-foreground/80"
          )}
          onClick={(e) => {
            handleRipple(e);
            onClick();
          }}
        >
          <span className={cn(
            "transition-all duration-300",
            active ? "text-primary" : "text-foreground/60"
          )}>
            {icon}
          </span>
          {active && (
            <span className="ml-2 font-medium">{label}</span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const SubMenuItem = ({ to, icon, label, active, onClick }: NavItemProps) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-300",
        active ? "bg-primary/10 text-primary" : ""
      )}
      onClick={onClick}
    >
      <span className={cn(
        "transition-all duration-300",
        active ? "text-primary" : "text-foreground/60"
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

export const Navbar = () => {
  const [active, setActive] = useState('what');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const { isAuthenticated, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useRoles();
  const { isConnected: isCanvasConnected } = useCanvasConnection();
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if admin access is enabled (for owner login access)
  const isAdminMode = searchParams.get('admin') === 'true' || isAuthenticated;
  
  // Check Google Calendar connection
  useEffect(() => {
    const checkGoogleCalendar = async () => {
      if (!isAuthenticated) return;
      
      try {
        const { data } = await supabase
          .from('google_integrations')
          .select('calendar_enabled')
          .maybeSingle();
        
        setIsGoogleCalendarConnected(data?.calendar_enabled || false);
      } catch (error) {
        console.error('Error checking Google Calendar:', error);
      }
    };

    checkGoogleCalendar();
  }, [isAuthenticated]);

  // Update active state based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActive('what');
    else if (path === '/why') setActive('why');
    else if (path === '/how') setActive('how');
    else if (path === '/manage') setActive('manage');
    else if (path === '/search') setActive('search');
    else if (path === '/assignments') setActive('assignments');
    else if (path === '/calendar') setActive('calendar');
    else if (path === '/profile') setActive('profile');
    else if (path === '/settings') setActive('settings');
    else if (path === '/admin') setActive('admin');
    else if (path === '/import') setActive('import');
  }, [location.pathname]);
  
  const handleOpenAuthModal = () => {
    navigate('/auth');
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleNavItemClick = (id: string) => {
    setActive(id);
  };

  const handleImportClick = () => {
    navigate('/import');
  };

  // Get preselected space from URL params
  const getPreselectedSpace = () => {
    const spaceParam = searchParams.get('space');
    return spaceParam || null;
  };

  const ayraSubmenu = [
    { to: '/', icon: <Info size={18} />, label: 'What', id: 'what' },
    { to: '/why', icon: <HelpCircle size={18} />, label: 'Why', id: 'why' },
    { to: '/how', icon: <Code size={18} />, label: 'How', id: 'how' },
  ];
  
  const authNavItems = [
    { to: '/manage', icon: <Table size={20} />, label: 'Manage', id: 'manage' },
    { to: '/search', icon: <Search size={20} />, label: 'Search', id: 'search' },
    ...(isCanvasConnected ? [{ to: '/assignments', icon: <Calendar size={20} />, label: 'Assignments', id: 'assignments' }] : []),
    ...(isGoogleCalendarConnected ? [{ to: '/calendar', icon: <CalendarDays size={20} />, label: 'Calendar', id: 'calendar' }] : []),
    { to: '/profile', icon: <User size={20} />, label: 'Profile', id: 'profile' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings', id: 'settings' },
    ...(isAdmin() ? [{ to: '/admin', icon: <Shield size={20} />, label: 'Admin', id: 'admin' }] : []),
  ];

  const importNavItem = { 
    icon: <Upload size={20} />, 
    label: 'Import', 
    id: 'import',
    onClick: handleImportClick 
  };

  const navItems = isAuthenticated ? authNavItems : [];

  return (
    <>
      <TooltipProvider>
        <header className="glass-panel fixed top-6 left-1/2 transform -translate-x-1/2 z-40 rounded-lg px-1 py-1">
          <nav className="flex items-center">
            {/* Ayra with submenu */}
            <NavItem
              to="#"
              icon={<Brain size={20} />}
              label="Ayra"
              active={['what', 'why', 'how'].includes(active)}
              onClick={() => {}}
              hasSubmenu={true}
            >
              {ayraSubmenu.map((item) => (
                <SubMenuItem
                  key={item.id}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={active === item.id}
                  onClick={() => handleNavItemClick(item.id)}
                />
              ))}
            </NavItem>
            
            {/* Other nav items */}
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={active === item.id}
                onClick={() => handleNavItemClick(item.id)}
              />
            ))}
            
            {/* Import button (authenticated users only) */}
            {isAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={cn(
                      "relative flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-300",
                      "hover:bg-primary/10 hover:text-primary",
                      "overflow-hidden",
                      active === 'import' ? "bg-primary/10 text-primary" : "text-foreground/80"
                    )}
                    onClick={(e) => {
                      const handleRipple = useRippleEffect();
                      handleRipple(e);
                      handleImportClick();
                      setActive('import');
                    }}
                  >
                    <span className={cn(
                      "transition-all duration-300",
                      active === 'import' ? "text-primary" : "text-foreground/60"
                    )}>
                      {importNavItem.icon}
                    </span>
                    {active === 'import' && (
                      <span className="ml-2 font-medium">{importNavItem.label}</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{importNavItem.label}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg ml-1"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Only show auth controls in admin mode or when authenticated */}
            {isAdminMode && (
              <>
                {loading ? (
                  // Show loading state while auth is initializing
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                ) : isAuthenticated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary hover:text-primary-foreground"
                        onClick={logout}
                      >
                        <LogOut size={20} />
                        {active === 'logout' && <span className="font-medium">Logout</span>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Logout</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary hover:text-primary-foreground"
                        onClick={handleOpenAuthModal}
                      >
                        <LogIn size={20} />
                        {active === 'login' && <span className="font-medium">Login</span>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Login</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </nav>
        </header>
      </TooltipProvider>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
      <NewItemModal
        open={isNewItemModalOpen}
        onOpenChange={setIsNewItemModalOpen}
        onItemCreated={() => {
          setIsNewItemModalOpen(false);
          // Optionally refresh or update the UI
        }}
        preselectedSpace={getPreselectedSpace()}
      />
    </>
  );
};

export default Navbar;
