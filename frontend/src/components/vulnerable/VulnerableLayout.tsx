import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, User, Home, Package, Shield } from 'lucide-react';

const VulnerableLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="vulnerable-app min-h-screen">
      {/* Header Navigation */}
      <header className="vulnerable-card shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/vulnerable" className="flex items-center space-x-2">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">VulnShop</span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">DEMO</span>
            </Link>

            {/* Navigation Menu */}
            <nav className="flex space-x-8">
              <Link
                to="/vulnerable"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable' || location.pathname === '/vulnerable/'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link
                to="/vulnerable/products"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable/products'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Products</span>
              </Link>
              
              <Link
                to="/vulnerable/login"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable/login'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
              
              <Link
                to="/vulnerable/profile"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable/profile'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </nav>

            {/* Security Dashboard Link */}
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Security Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="vulnerable-card mx-4 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('search') as string;
              if (query) {
                window.location.href = `/vulnerable/search?q=${encodeURIComponent(query)}`;
              }
            }}
            className="relative max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="search"
                placeholder="Search products... (Try: {'$ne': null})"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-4 py-1.5 rounded-md hover:bg-purple-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Vulnerability Hint */}
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              💡 <strong>Demo Hint:</strong> Try searching with: <code className="bg-gray-100 px-2 py-1 rounded text-red-600">{"{'$ne': null}"}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="vulnerable-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">© 2024 VulnShop - Intentionally Vulnerable Demo Application</p>
              <p className="text-sm text-red-600 mt-1">
                ⚠️ This application contains intentional security vulnerabilities for educational purposes.
              </p>
            </div>
            <div className="text-right">
              <Link
                to="/dashboard"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                View Security Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VulnerableLayout;
