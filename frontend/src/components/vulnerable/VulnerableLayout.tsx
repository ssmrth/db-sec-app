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
              <ShoppingCart className="h-8 w-8 text-thunderlarra" />
              <span className="text-xl font-bold text-gray-900">VulnShop</span>
              <span className="text-xs bg-thunderlarra-light text-thunderlarra-dark px-2 py-1 rounded">PREMIUM</span>
            </Link>

            {/* Navigation Menu */}
            <nav className="flex space-x-8">
              <Link
                to="/vulnerable"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable' || location.pathname === '/vulnerable/'
                    ? 'bg-thunderlarra-light text-thunderlarra-dark'
                    : 'text-gray-600 hover:text-thunderlarra hover:bg-thunderlarra-light'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link
                to="/vulnerable/products"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable/products'
                    ? 'bg-thunderlarra-light text-thunderlarra-dark'
                    : 'text-gray-600 hover:text-thunderlarra hover:bg-thunderlarra-light'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Products</span>
              </Link>
              
              <Link
                to="/vulnerable/login"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable/login'
                    ? 'bg-thunderlarra-light text-thunderlarra-dark'
                    : 'text-gray-600 hover:text-thunderlarra hover:bg-thunderlarra-light'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
              
              <Link
                to="/vulnerable/profile"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/vulnerable/profile'
                    ? 'bg-thunderlarra-light text-thunderlarra-dark'
                    : 'text-gray-600 hover:text-thunderlarra hover:bg-thunderlarra-light'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </nav>

            {/* Security Dashboard Link */}
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 bg-aged-jade text-white rounded-md hover:bg-aged-jade-dark transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="vulnerable-card mx-4">
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                className="w-full pl-16 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thunderlarra focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-thunderlarra text-white px-4 py-1.5 rounded-md hover:bg-thunderlarra-dark transition-colors"
              >
                Search
              </button>
            </div>
          </form>
          
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

    </div>
  );
};

export default VulnerableLayout;
