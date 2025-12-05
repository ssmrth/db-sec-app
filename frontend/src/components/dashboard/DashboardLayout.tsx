import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  BarChart3, 
  Bell, 
  FileText, 
  Settings, 
  ShoppingCart,
  WifiOff,
  History
} from 'lucide-react';
import socketService from '../../services/socket';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket service
    socketService.connect();
    
    // Set initial connection status
    setIsConnected(socketService.connected);
    
    // Listen for connection changes
    const unsubscribe = socketService.onConnectionChange(setIsConnected);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const navigation = [
    { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
    { name: 'Attack History', href: '/dashboard/history', icon: History },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="dashboard-bg min-h-screen flex font-sans text-gray-400">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B1120] border-r border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="p-2 bg-blue-900/20 rounded-lg group-hover:bg-blue-900/40 transition-colors">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight">
                Security<span className="text-blue-500">Center</span>
              </h1>
              <p className="text-gray-500 text-xs font-medium">Enterprise Edition</p>
            </div>
          </Link>
        </div>

        {/* Connection Status */}
        <div className="px-6 py-4 border-b border-gray-800 bg-[#0F172A]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">System Status</span>
            <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {isConnected ? (
                <>
                  <div className="h-1.5 w-1.5 bg-green-400 rounded-full pulse-dot"></div>
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard/overview' && location.pathname === '/dashboard');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'dashboard-nav-active shadow-lg shadow-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-800 bg-[#0F172A]/50">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4 px-2">Quick Actions</h3>
          <div className="space-y-1">
            <Link
              to="/vulnerable"
              target="_blank" 
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg text-sm transition-colors group"
            >
              <ShoppingCart className="h-4 w-4 group-hover:text-purple-400 transition-colors" />
              <span>Open Shop Demo</span>
            </Link>
          </div>
          
          <div className="mt-6 px-2 pb-2">
            <p className="text-xs text-gray-600 text-center">v2.4.0 (Build 892)</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Simplified */}
        <header className="h-16 bg-[#0F172A]/80 backdrop-blur-md border-b border-gray-800 flex items-center px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Real-time security monitoring & analysis</p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0F172A] p-8">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
