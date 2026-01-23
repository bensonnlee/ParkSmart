import { Outlet, useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { LogIn, Upload } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* UCR Header */}
      <div className="bg-ucr-blue text-white py-3 sm:py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <div 
              onClick={() => navigate('/')} 
              className="cursor-pointer"
            >
              <h1 className="text-xl sm:text-2xl font-bold">UC RIVERSIDE</h1>
              <p className="text-xs sm:text-sm opacity-90">Transportation Services</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                onClick={() => navigate('/upload')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 text-xs sm:text-sm"
              >
                <Upload className="size-3 sm:size-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Upload Schedule</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              <Button
                onClick={() => navigate('/sign-in')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 text-xs sm:text-sm"
              >
                <LogIn className="size-3 sm:size-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Sign In</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <Outlet />
    </div>
  );
}