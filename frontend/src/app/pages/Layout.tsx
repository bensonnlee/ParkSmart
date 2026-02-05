import { Outlet, useNavigate, useLocation } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Home, Calendar, Settings, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sidebar, SidebarToggle } from '@/app/components/Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state to change "Login" to "Settings" dynamically
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* UCR Top Banner - Sticky at the top */}
      <div className="sticky top-0 z-40 bg-ucr-blue text-white py-3 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />
              <div onClick={() => navigate('/')} className="cursor-pointer">
                <h1 className="text-lg font-bold uppercase tracking-wider">UC Riverside</h1>
                <p className="text-[10px] opacity-80 uppercase">Parking Optimizer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content - pb-20 ensures content isn't hidden by the bottom bar */}
      <main className="flex-grow container mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation - Fixed and Sticky for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden z-50">
        <div className="grid grid-cols-3 gap-1 p-2 pb-6"> {/* pb-6 adds safe space for iPhone home bar */}
          
          {/* Home/Today Button */}
          <Button
            variant={location.pathname === '/' || location.pathname === '/dashboard' ? 'default' : 'ghost'}
            onClick={() => navigate('/')}
            className="flex-col h-auto py-2 transition-all active:scale-95"
          >
            <Home className="size-5 mb-1" />
            <span className="text-[10px] font-bold">Today</span>
          </Button>

          {/* Schedule/Planner Button */}
          <Button
            variant={location.pathname.includes('planner') ? 'default' : 'ghost'}
            onClick={() => navigate('/dashboard/planner')}
            className="flex-col h-auto py-2 transition-all active:scale-95"
          >
            <Calendar className="size-5 mb-1" />
            <span className="text-[10px] font-bold">Schedule</span>
          </Button>

          {/* Dynamic Settings/Login Button */}
          <Button
            variant={location.pathname.includes('settings') || location.pathname === '/login' ? 'default' : 'ghost'}
            onClick={() => navigate(isLoggedIn ? '/dashboard/settings' : '/login')}
            className="flex-col h-auto py-2 transition-all active:scale-95"
          >
            {isLoggedIn ? (
              <>
                <Settings className="size-5 mb-1" />
                <span className="text-[10px] font-bold">Settings</span>
              </>
            ) : (
              <>
                <LogIn className="size-5 mb-1" />
                <span className="text-[10px] font-bold">Sign In</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}