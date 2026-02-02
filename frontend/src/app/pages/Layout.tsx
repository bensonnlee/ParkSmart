import { Outlet, useNavigate, useLocation } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Home, Calendar, Settings } from 'lucide-react';
import { useState } from 'react';
import { Sidebar, SidebarToggle } from '@/app/components/Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Layout is now only used for dashboard sub-routes
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* UCR Top Banner */}
      <div className="bg-ucr-blue text-white py-3 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />
              <div onClick={() => navigate('/dashboard')} className="cursor-pointer">
                <h1 className="text-lg font-bold uppercase tracking-wider">UC Riverside</h1>
                <p className="text-[10px] opacity-80 uppercase">Parking Optimizer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Button
            variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
            onClick={() => navigate('/dashboard')}
            className="flex-col h-auto py-2"
          >
            <Home className="size-5 mb-1" />
            <span className="text-[10px]">Today</span>
          </Button>
          <Button
            variant={location.pathname === '/dashboard/planner' ? 'default' : 'ghost'}
            onClick={() => navigate('/dashboard/planner')}
            className="flex-col h-auto py-2"
          >
            <Calendar className="size-5 mb-1" />
            <span className="text-[10px]">Schedule</span>
          </Button>
          <Button
            variant={location.pathname === '/dashboard/settings' ? 'default' : 'ghost'}
            onClick={() => navigate('/dashboard/settings')}
            className="flex-col h-auto py-2"
          >
            <Settings className="size-5 mb-1" />
            <span className="text-[10px]">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}