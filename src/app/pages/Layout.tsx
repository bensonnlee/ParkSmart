import { Outlet, useNavigate, useLocation } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Home, Calendar, Settings } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide header on certain pages
  const hideHeader = ['/sign-in', '/parking'].some(path => location.pathname.includes(path));

  return (
    <div className="min-h-screen">
      {/* UCR Top Banner */}
      {!hideHeader && (
        <div className="bg-ucr-blue text-white py-3 shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div onClick={() => navigate('/')} className="cursor-pointer">
                <h1 className="text-lg sm:text-xl font-bold">UC RIVERSIDE</h1>
                <p className="text-xs opacity-90">Parking Optimizer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <Outlet />

      {/* Bottom Navigation - Mobile-friendly */}
      {!hideHeader && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
          <div className="grid grid-cols-3 gap-1 p-2">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
              className={`flex-col h-auto py-3 ${
                location.pathname === '/' 
                  ? 'bg-ucr-blue hover:bg-ucr-blue/90' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Home className="size-5 mb-1" />
              <span className="text-xs">Today</span>
            </Button>
            <Button
              variant={location.pathname === '/planner' ? 'default' : 'ghost'}
              onClick={() => navigate('/planner')}
              className={`flex-col h-auto py-3 ${
                location.pathname === '/planner' 
                  ? 'bg-ucr-blue hover:bg-ucr-blue/90' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Calendar className="size-5 mb-1" />
              <span className="text-xs">Schedule</span>
            </Button>
            <Button
              variant={location.pathname === '/settings' ? 'default' : 'ghost'}
              onClick={() => navigate('/settings')}
              className={`flex-col h-auto py-3 ${
                location.pathname === '/settings' 
                  ? 'bg-ucr-blue hover:bg-ucr-blue/90' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Settings className="size-5 mb-1" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Add padding to prevent content from being hidden behind bottom nav */}
      {!hideHeader && <div className="h-20 md:hidden" />}
    </div>
  );
}