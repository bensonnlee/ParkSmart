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
    <div className="relative min-h-screen bg-gray-50 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-ucr-blue text-white py-3 shadow-md">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <SidebarToggle onClick={() => setSidebarOpen(true)} />
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">UC Riverside</h1>
            <p className="text-[10px] opacity-80 uppercase text-white">Parking Optimizer</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-6 pb-32">
        <Outlet />
      </main>

      {/* Bottom Navigation - ALWAYS VISIBLE */}
      {/* I removed 'md:hidden' so it stays visible even when you expand the window past 768px */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-3 gap-1 px-4 pt-2 pb-8 max-w-md mx-auto"> 
          
          <Button
            variant={location.pathname === '/' || location.pathname === '/dashboard' ? 'default' : 'ghost'}
            onClick={() => navigate('/')}
            className={`flex-col h-auto py-2 transition-all active:scale-95 ${
              location.pathname === '/' || location.pathname === '/dashboard' 
              ? 'bg-ucr-blue text-white hover:bg-ucr-blue-dark' 
              : 'text-gray-500'
            }`}
          >
            <Home className="size-5 mb-1" />
            <span className="text-[10px] font-bold">Today</span>
          </Button>

          <Button
            variant={location.pathname.includes('planner') ? 'default' : 'ghost'}
            onClick={() => navigate('/dashboard/planner')}
            className={`flex-col h-auto py-2 transition-all active:scale-95 ${
              location.pathname.includes('planner') 
              ? 'bg-ucr-blue text-white hover:bg-ucr-blue-dark' 
              : 'text-gray-500'
            }`}
          >
            <Calendar className="size-5 mb-1" />
            <span className="text-[10px] font-bold">Schedule</span>
          </Button>

          <Button
            variant={location.pathname.includes('settings') || location.pathname === '/login' ? 'default' : 'ghost'}
            onClick={() => navigate(isLoggedIn ? '/dashboard/settings' : '/login')}
            className={`flex-col h-auto py-2 transition-all active:scale-95 ${
              location.pathname.includes('settings') || location.pathname === '/login'
              ? 'bg-ucr-blue text-white hover:bg-ucr-blue-dark' 
              : 'text-gray-500'
            }`}
          >
            <Settings className="size-5 mb-1" />
            <span className="text-[10px] font-bold">{isLoggedIn ? 'Settings' : 'Sign In'}</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}