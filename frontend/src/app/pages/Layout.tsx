import { Outlet, useNavigate, NavLink } from 'react-router';
import { Home, Calendar, Settings, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center min-h-12 rounded-md transition-all active:scale-95 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
    isActive
      ? 'bg-ucr-blue text-white hover:bg-ucr-blue-dark'
      : 'text-gray-500 hover:bg-accent hover:text-accent-foreground'
  }`;

export default function Layout() {
  const navigate = useNavigate();
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-ucr-blue text-white py-3 shadow-md">
        <div className="container mx-auto px-4">
          <div onClick={() => navigate('/dashboard')} className="cursor-pointer">
            <h1 className="text-lg font-bold uppercase tracking-wider text-white">UC Riverside</h1>
            <p className="text-[10px] opacity-80 uppercase text-white">Parking Optimizer</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow container mx-auto px-4 py-6 pb-nav-offset">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-100 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-4 gap-1 px-4 pt-2 max-w-md mx-auto pb-safe">

          <NavLink to="/dashboard" end className={navLinkClass}>
            <Home className="size-5 mb-1" />
            <span className="text-xs font-bold">Today</span>
          </NavLink>

          <NavLink to="/dashboard/find-by-building" className={navLinkClass}>
            <Search className="size-5 mb-1" />
            <span className="text-xs font-bold">Search</span>
          </NavLink>

          <NavLink to="/dashboard/schedule" className={navLinkClass}>
            <Calendar className="size-5 mb-1" />
            <span className="text-xs font-bold">Schedule</span>
          </NavLink>

          <NavLink to={isLoggedIn ? '/dashboard/settings' : '/welcome'} className={navLinkClass}>
            <Settings className="size-5 mb-1" />
            <span className="text-xs font-bold">{isLoggedIn ? 'Settings' : 'Sign In'}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
