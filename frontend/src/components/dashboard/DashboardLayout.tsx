import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  BarChart3, 
  Bell, 
  FileText, 
  Settings, 
  Eye,
  ShoppingCart,
  Wifi,
  WifiOff
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
      // Don't disconnect on unmount - keep connection alive for other dashboard pages
      // socketService.disconnect();
    };
  }, []);

  const navigation = [
    { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
    { name: 'Live Monitoring', href: '/dashboard/live', icon: Activity },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="dashboard-bg min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black min-h-screen border-r border-gray-800">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-thunderlarra" />
              <div>
                <h1 className="text-white text-lg font-bold">Security Center</h1>
                <p className="text-gray-400 text-xs">NoSQL Monitor</p>
              </div>
            </Link>
          </div>

          {/* Connection Status */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Connected</span>
                  <div className="h-2 w-2 bg-green-400 rounded-full pulse-dot"></div>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             (item.href === '/dashboard/overview' && location.pathname === '/dashboard');
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'dashboard-nav-active'
                      : 'text-white hover:bg-gray-900 hover:text-thunderlarra'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-800 mt-auto">
            <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/vulnerable"
                className="flex items-center space-x-2 text-white hover:text-thunderlarra text-sm transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Vulnerable App</span>
              </Link>
              <Link
                to="/dashboard/live"
                className="flex items-center space-x-2 text-white hover:text-thunderlarra text-sm transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Live Monitor</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Security Monitoring Dashboard
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Status:</span>
                    {isConnected ? (
                      <span className="text-green-600 font-medium">Active Monitoring</span>
                    ) : (
                      <span className="text-red-600 font-medium">Connection Lost</span>
                    )}
                  </div>
                  <Link
                    to="/vulnerable"
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    Test Vulnerabilities
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
