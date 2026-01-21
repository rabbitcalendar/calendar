import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  Menu, 
  X,
  LogOut,
  ChevronDown,
  Settings,
  Calendar
} from 'lucide-react';
import { useCalendar } from '../context/CalendarContext';
import ClientManager from './ClientManager';
import { ProfileSettings } from './ProfileSettings';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { clients, currentClient, setCurrentClient, user, logout } = useCalendar();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const location = useLocation();

  // Connection status check (simple version)
  const isSupabaseConnected = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isActive = (path: string) => location.pathname === path;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // If somehow no currentClient is selected but we are logged in (should be handled by login logic, but safe guard)
  // We render children anyway, as pages handle null clients gracefully or we show a fallback here?
  // Actually, login sets currentClient. If page reload, persistence restores it. 
  // If user is agency, currentClient could be null if they want to see "nothing"? No, logic forces selection.
  
  const displayClientName = currentClient?.name || user?.name || 'Select Client';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 text-primary-600">
          <LayoutDashboard className="w-6 h-6" />
          <span className="font-bold truncate max-w-[200px]">{displayClientName}</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area & Client Switcher for Agency */}
        {user?.role === 'agency' ? (
          <div className="relative border-b border-gray-200 hidden md:block">
            <button
              onClick={() => setIsClientMenuOpen(!isClientMenuOpen)}
              className="w-full h-16 flex items-center justify-between px-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-primary-600">
                <LayoutDashboard className="w-8 h-8" />
                <span className="text-lg font-bold text-gray-900 truncate max-w-[140px]">{displayClientName}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isClientMenuOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isClientMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setCurrentClient(client);
                      setIsClientMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between group ${
                      currentClient?.id === client.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{client.name}</span>
                    {client.role === 'agency' && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Agency</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Static Header for Clients */
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 hidden md:flex">
            <div className="flex items-center gap-2 text-primary-600">
              <LayoutDashboard className="w-8 h-8" />
              <span className="text-lg font-bold text-gray-900">{displayClientName}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Agency Actions */}
          {user?.role === 'agency' && (
            <div className="mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Agency
              </div>
              <button
                onClick={() => setIsClientManagerOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Manage Clients</span>
              </button>
            </div>
          )}

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Menu
          </div>
          <Link
            to="/client"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/client')
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Client Input</span>
          </Link>
          <Link
            to="/planner"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/planner') 
                ? 'bg-primary-50 text-primary-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Agency Planner</span>
          </Link>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
           <div className="mb-4 px-2">
             <p className="text-xs font-semibold text-gray-500 uppercase">Logged in as</p>
             <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
             <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
           </div>
           
           <div className="space-y-1">
             <button
                onClick={() => setIsProfileSettingsOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
             <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
           </div>
        </div>

        {/* Status Indicator */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isSupabaseConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 min-w-0 overflow-x-hidden">
        {children}
      </main>
      {/* Client Manager Modal */}
      {isClientManagerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Client Management</h2>
              <button 
                onClick={() => setIsClientManagerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <ClientManager />
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      <ProfileSettings 
        isOpen={isProfileSettingsOpen} 
        onClose={() => setIsProfileSettingsOpen(false)} 
      />
    </div>
  );
};
