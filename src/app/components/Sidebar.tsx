import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { X, Home, Calendar, MapPin, Settings, Menu } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'My Schedule', path: '/dashboard/planner' },
    { icon: MapPin, label: 'Find Parking', path: '/dashboard/map' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-ucr-blue text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🅿️</span>
            </div>
            <div>
              <h2 className="font-bold text-sm">CampusPark</h2>
              <p className="text-xs opacity-80">UCR Parking</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 size-8 p-0"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-ucr-blue text-white flex items-center justify-center font-bold">
              JD
            </div>
            <div>
              <p className="font-semibold text-gray-900">Jane Doe</p>
              <p className="text-xs text-gray-500">Student</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-ucr-blue text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            UCR Parking Optimizer v1.0
          </p>
        </div>
      </div>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-white hover:bg-white/20"
    >
      <Menu className="size-6" />
    </Button>
  );
}